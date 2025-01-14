"use client"
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

export default function CalendarHeatMap({year, month}){
    
    //convert from 1-12 to 0-11
    month = month - 1;

    const currentDate = new Date(year, month);

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); //0-11
    //const date = currentDate.getDate(); //1-31
    //const day = currentDate.getDay(); //0-6 sunday-saturday


    return <div className="calendar-heat-map-wrapper">
        <div className="calendar-title">{getMonthName(currentMonth, true)} {currentYear}</div>
        {renderMonth(currentYear, currentMonth)}
    </div>
}