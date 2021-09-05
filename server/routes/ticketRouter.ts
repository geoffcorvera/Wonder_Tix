import express from 'express'
import { pool } from '../db'
import { Ticket } from '../../src/features/ticketing/ticketingSlice'

const ticketRouter = express.Router()

// Remove $ and parse to float
const parseMoneyString = (s: string) => Number.parseFloat(s.slice(1))
const toTicket = (row): Ticket => {
    const {eventdate, starttime, ...rest} = row
    const [hour, min] = starttime.split(':')
    let date = new Date(eventdate)
    date.setHours(hour,min)
    return {
        ...rest,
        date: date.toJSON(),
        eventid: row.eventid.toString(),
        ticket_price: parseMoneyString(row.ticket_price),
        concession_price: parseMoneyString(row.concession_price),
    }
}

interface TicketState {byId: {[key: number]: Ticket}, allIds: number[]}
const reduceToTicketState = (res, t: Ticket) => {
    const id = t.event_instance_id
    const {byId, allIds} = res
    return (allIds.includes(id))
        ? res
        : {byId: {...byId, [id]: t}, allIds: [...allIds, id]}
}

// Responds with tickets subset of Redux state
ticketRouter.get('/', async (req, res) => {
    try {
        const qs =
            `SELECT
                ei.id AS event_instance_id,
                eventid,
                eventdate,
                starttime,
                totalseats,
                availableseats,
                tt.name AS admission_type,
                price AS ticket_price,
                concessions AS concession_price
            FROM event_instances ei
                JOIN linkedtickets lt ON ei.id=lt.event_instance_id
                JOIN tickettype tt ON lt.ticket_type=tt.id
            WHERE salestatus=true AND isseason=false AND availableseats > 0
            ORDER BY ei.id, event_instance_id;`
        const query_res = await pool.query(qs)
        res.json(
            query_res.rows
                .map(toTicket)
                .reduce(reduceToTicketState, {byId: {}, allIds: []} as TicketState)
        );
        console.log('# tickets:', query_res.rowCount)
    }
    catch (err) {
        console.error(err.message)
    }
})


// Get all ticket types
ticketRouter.get("/type", async (req, res) => {
    try{
        const query = "select * from tickettype";
        const get_all_tickets = await pool.query(query);
        res.json(get_all_tickets.rows);
    } catch (error) {
        console.error(error);
    }
})

// Set which tickets can be sold for an event
ticketRouter.post("/set-tickets", async (req, res) => {
    try {
        let body = req.body;
        const values = [body.event_instance_id, body.ticket_type];
        const query = "insert into linkedtickets (event_instance_id, type) values ($1, $2)";
        const set_tickets = await pool.query(query, values);
        res.json(set_tickets);
    } catch (error) {
        console.error(error);
    }
})

// Get list of which tickets can be purchased for the show along with its prices
ticketRouter.get("/show-tickets", async (req, res) => {
    try {
        const query = 
            `SELECT ev.id as event_id, ei.id as event_instance_id, eventname, eventdescription, eventdate, starttime, totalseats, availableseats, price, concessions
            FROM events ev
                LEFT JOIN event_instances ei ON ev.id=ei.eventid
                JOIN linkedtickets lt ON lt.event_instance_id=ei.id
                JOIN tickettype tt ON lt.ticket_type=tt.id
            WHERE ev.id=$1 AND isseason=false;`
        const values = [req.query.event]
        const available_tickets = await pool.query(query, values)
        res.json(available_tickets)
        console.log(available_tickets.rows)
        return available_tickets.rows
    } catch (error) {
        console.error(error)
    }
})

export default ticketRouter