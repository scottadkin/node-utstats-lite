"use client"
import { useState } from "react";
import { getMonthName, getOrdinal } from "../lib/generic.mjs";


function CalendarBlock({children, value}){

    if(value !== null){
        value = getOrdinal(value);
    }else{
        value = <>&nbsp;</>;
    }

    return <div className="calendar-block">
        {children}<span className="tiny-font">{value}</span>
    </div>
}

function renderMonth(year, month){

    if(month < 10){
        month = `0${month}`;
    }

    const date = new Date(year, month);
    const lastDay = new Date(year, month + 1, 0);

    const firstDay = date.getDay();
    const lastDate = lastDay.getDate();

    const rows = [<div key={"day-names"} className="calendar-row">
            <CalendarBlock key={`01`} value={null}>S</CalendarBlock>
            <CalendarBlock key={`02`} value={null}>M</CalendarBlock>
            <CalendarBlock key={`03`} value={null}>T</CalendarBlock>
            <CalendarBlock key={`04`} value={null}>W</CalendarBlock>
            <CalendarBlock key={`05`} value={null}>T</CalendarBlock>
            <CalendarBlock key={`06`} value={null}>F</CalendarBlock>
            <CalendarBlock key={`07`} value={null}>S</CalendarBlock>
        </div>
    ];

    let currentRow = [];

    for(let i = 0; i < firstDay; i++){
        currentRow.push(<CalendarBlock key={`i-${i}`} value={null}>&nbsp;</CalendarBlock>);
    }

    let currentDay = firstDay;
    let currentDate = 1;

    for(let i = 1; i <= lastDate; i++){

        currentRow.push(<CalendarBlock key={i} value={currentDate}>{currentDate}</CalendarBlock>);

        currentDay++;

        if(currentDay > 6){
            currentDay = 0;
            rows.push(<div key={i} className="calendar-row">{currentRow}</div>);
            currentRow = [];
        }

        currentDate++;
    }

    if(currentRow.length > 0){

        for(let i = currentRow.length; i <= 6; i++){
            currentRow.push(<CalendarBlock key={`last-${i}`} value={null}>&nbsp;</CalendarBlock>);
        }
        
        rows.push(<div key={"end"} className="calendar-row">{currentRow}</div>);
    }

    return <>
        {rows}
    </>
}

export default function CalendarHeatMap({}){
    

    const now = new Date(Date.now());

    const year = now.getFullYear();
    const month = now.getMonth(); //0-11
    const date = now.getDate(); //1-31
    const day = now.getDay(); //0-6 sunday-saturday

    const [selectedYear, setSelectedYear] = useState(year);
    const [selectedMonth, setSelectedMonth] = useState(month);
    //const [currentDate, setCurrentMonth] = useState(date);
   // const [currentYear, setCurrentYear] = useState(year);


    return <div className="calendar-heat-map-wrapper">
        <button onClick={() =>{
            if(selectedMonth - 1 < 0){
                setSelectedMonth(11);
                setSelectedYear(selectedYear - 1);
            }else{
                setSelectedMonth(selectedMonth - 1);
            }
        }}>previous</button>
        <button onClick={() =>{

            if(selectedMonth + 1 > 11){
                setSelectedMonth(0);
                setSelectedYear(selectedYear + 1);
            }else{
                setSelectedMonth(selectedMonth + 1);
            }
        }}>next</button>
        {getMonthName(selectedMonth, true)} {selectedYear} <br/>
        {renderMonth(selectedYear, selectedMonth)}
    </div>
}