import { useState } from "react";
import { Grid, TextField, Fab, Paper, makeStyles, FormControlLabel, Radio } from "@material-ui/core";
//import CheckCircleRoundedIcon from "@material-ui/icons/CheckCircleRounded";
import RemoveIcon from "@material-ui/icons/Remove";

type EventTimePickerProps = {
    id: number,
    color: string,
    checked: boolean,
    onAddTime: (time: string, seats: number, id: number) => any,
    onRemoveTime: (id: number) => any,
    onChangeTime: (id: number) => any
}

const useStyles = makeStyles({
    root: {
        margin: "4px",
    }
})

export default function EventTimePicker({ id, color, checked, onAddTime, onRemoveTime, onChangeTime } : EventTimePickerProps) {
    const [time, setTime] = useState("");
    const [seats, setSeats] = useState<number>(0);

    const onSetTime = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setTime(e.currentTarget.value);
        onAddTime(e.currentTarget.value, seats, id);
    }

    const onSetSeats = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setSeats(+e.currentTarget.value);
        onAddTime(time, +e.currentTarget.value, id);
    }

    return (
        <Grid container key={id} component={ Paper } style={{ margin: "3px"}}>
            <Grid item xs={1}>
                <span>
                    <svg width="10" height="10">
                        <rect width="100%" height="100%" fill={color}></rect>
                    </svg>
                </span>
            </Grid>
            <Grid item xs={1}>
                <FormControlLabel value={id} checked={checked} control={<Radio onChange={() => onChangeTime(id)} />} label=""/>
            </Grid>
            <Grid item xs={2}>
                <p>Start time:</p>
            </Grid>
            <Grid item xs={2}>
                <TextField 
                    type="time" 
                    size="small" 
                    margin="dense" 
                    variant="outlined" 
                    onBlur={(event) => onSetTime(event)} 
                    required 
                />
            </Grid>
            <Grid item xs={2}>
                <p>Total Seats:</p>
            </Grid>
            <Grid item xs={2}>
                <TextField 
                    type="number" 
                    size="small" 
                    margin="dense" 
                    variant="outlined" 
                    onBlur={(event) => onSetSeats(event)} 
                    required 
                />
            </Grid>
            {/*
            <Grid item xs={1}>
                <Fab 
                    size="small" 
                    color="primary" 
                    onClick={() => onAddTime(time, seats, id)} 
                    disabled={ !(isValidSeats && isValidTime) }
                >
                    <CheckCircleRoundedIcon />
                </Fab>
            </Grid>
            */}
                
            <Grid item xs={1}></Grid>
            <Grid item xs={1}>
                <Fab 
                    size="small" 
                    color="secondary" onClick={() => onRemoveTime(id)} 
                    disabled={id === 0}
                >
                    <RemoveIcon />
                </Fab>
            </Grid>
        </Grid>
    )
}