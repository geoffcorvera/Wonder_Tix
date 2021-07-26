import { createSlice, createAsyncThunk, PayloadAction, CaseReducer } from '@reduxjs/toolkit'
import { RootState } from '../../app/store'
import { Play, Ticket, ticketingState } from './ticketingTypes'
import { titleCase } from '../../utils'

const INITIAL_STATE: ticketingState = {
    cart: [],
    tickets: [],
    plays: [],
    status: 'idle',
    selection: {
        selectedTicket: null,
        qty: '',
    }
}

const fetchData = async (url: string) => {
    try {
        const res = await fetch(url)
        return await res.json()
    }
    catch(err) {
        console.error(err.message)
    }
}

const createTitleMap = (plays: Play[]) =>
    plays.reduce((titleMap, play) => {
        const key = play.id
        return (titleMap[key])
            ? {...titleMap}
            : {...titleMap, [key]: play.title}
    }, {} as {[index:string] : string})

const addPlayTitles = (titleMap: any) => (ticket: Ticket): Ticket => ({
    ...ticket,
    event_title: (titleMap[ticket.playid])
        ? titleCase(titleMap[ticket.playid])
        : 'Play'
})

// TODO: sort by date
export const fetchTicketingData = createAsyncThunk(
    'events/fetch',
    async () => {
        const plays: Play[] = await fetchData('/api/plays')
        const titleMap = createTitleMap(plays)
        const appendTitles = addPlayTitles(titleMap)
        const ticketdata: Ticket[] = await fetchData('/api/tickets')

        return { plays, tickets: ticketdata.map(appendTitles)}
    }
)

const someInList = <T>(list: Array<T>, prop: keyof T) => (value: T[keyof T]) =>
    list.some(i => i[prop]===value)

const selectTicketReducer = (state: ticketingState, action: PayloadAction<number>) => {
    const idInTickets = someInList(state.tickets, 'eventid')
    return {
        ...state,
        selection: {
            ...state.selection,
            selectedTicket: (idInTickets(action.payload))
                ? action.payload
                : null
        }
    }
}

const setQtyReducer = (state: ticketingState, action: PayloadAction<number>) => ({
    ...state,
    selection: {...state.selection, qty: (action.payload > 0) ? action.payload : 0}
})


const byEventId = (id: number) => (obj: Ticket) => obj.eventid===id
const getPartialCartData = (ticket: Ticket) => ({
    product_id: ticket.eventid,
    name: 'Ticket(s) to ' + ticket.event_title,
    desc: ticket.desc,
    price: ticket.ticket_price.slice(1),
})

const addTicketReducer: CaseReducer<ticketingState, PayloadAction<{id: number, qty: number}>> = (state, action) => {
    const idInTickets = someInList(state.tickets, 'eventid')
    const ticketData = (idInTickets(action.payload.id))
        ? state.tickets.find(byEventId(action.payload.id))
        : null

    const newCartItem = (ticketData)
        ? {
            ...getPartialCartData(ticketData),
            qty: action.payload.qty,
            product_img_url: state.plays.find(p => p.id===ticketData.playid)!.image_url,
        }
        : null
    
    return {
        ...state,
        cart: (newCartItem)
            ? [...state.cart, newCartItem]
            : [...state.cart]
    }
}

const ticketingSlice = createSlice({
    name: 'cart',
    initialState: INITIAL_STATE,
    reducers: {
        // TODO: removeTicket: (state, action) => state,
        // TODO: editQty: (state, action) => state,
        addTicketToCart: addTicketReducer,
        selectTicket: selectTicketReducer,
        setQty: setQtyReducer,
        clearSelection: (state) => ({ ...state, selection: {selectedTicket: null, qty: ''}})
    },
    extraReducers: builder => {
        builder
            .addCase(fetchTicketingData.pending, state => {
                state.status = 'loading'
            })
            .addCase(fetchTicketingData.fulfilled, (state, action) => {
                state.status = 'success'
                state.tickets = (action.payload.tickets)
                    ? action.payload.tickets
                    : []
                state.plays = (action.payload.plays)
                    ? action.payload.plays
                    : []
            })
            .addCase(fetchTicketingData.rejected, state => {
                state.status = 'failed'
            })
    }
})

export const selectSelectedTicket = (state: RootState) => state.ticketing.selection.selectedTicket
export const selectTicketQty = (state: RootState) => state.ticketing.selection.qty
export const { addTicketToCart, selectTicket, clearSelection, setQty } = ticketingSlice.actions
export default ticketingSlice.reducer