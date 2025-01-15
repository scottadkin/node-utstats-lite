"use client"
import CalendarHeatMap from "../CalendarHeatMap";
import { useState, useReducer, useEffect } from "react";
import Header from "../Header";


function reducer(state, action){

    switch(action.type){

        case "save-data": {

            const data = {...state.data};

            data[`${action.year}-${action.month}`] = action.data;

            return {
                ...state,
                "data": data

            };
        }
    }

    return state;
}

async function loadData(dispatch, month, year){
    
    try{

        const startDate = new Date(year, month);
        const endDate = new Date(year, month + 1, 0);

        const req = await fetch("/api/matches", {
            "headers": {"Content-type": "application/json"},
            "method": "POST",
            "body": JSON.stringify({"mode": "get-matches-played-between", "start": startDate, "end": endDate})
        });

        const res = await req.json();

        if(res.error !== undefined) throw new Error(res.error);

        dispatch({"type": "save-data", "data": res, "month": month, "year": year});

        console.log(res);

    }catch(err){
        console.trace(err);
    }
}


export default function ActivityHeatMap(){

    const now = new Date(Date.now());
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);

    //save data as year-month in data instead of reloading the same data over and over

    const [state, dispatch] = useReducer(reducer, {
        "data": {}
    });


    useEffect(() =>{

        //don't want to load the same data more than once
        if(state.data[`${selectedYear}-${selectedMonth}`] !== undefined) return;
        loadData(dispatch, selectedMonth, selectedYear);

    },[selectedYear, selectedMonth, state.data]);



    return <div className="text-center">
        <Header>Activity Heatmap</Header>
        <div className="calendar-heat-map-wrapper margin-bottom-1">
            
            <button className="a-h-m-button" onClick={() =>{
                if(selectedMonth - 1 < 0){
                    setSelectedMonth(11);
                    setSelectedYear(selectedYear - 1);
                }else{
                    setSelectedMonth(selectedMonth - 1);
                }
            }}>Previous</button>
            <button className="a-h-m-button" onClick={() =>{

                if(selectedMonth + 1 > 11){
                    setSelectedMonth(0);
                    setSelectedYear(selectedYear + 1);
                }else{
                    setSelectedMonth(selectedMonth + 1);
                }
            }}>Next</button>
        
            <CalendarHeatMap title={"Matches Played"} year={selectedYear} month={selectedMonth + 1} data={state.data[`${selectedYear}-${selectedMonth}`]}/>
        </div>
    </div>

}