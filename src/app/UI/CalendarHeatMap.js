"use client"
import { getMonthName, getOrdinal, toPlaytime } from "../lib/generic.mjs";
import BasicMouseOver from "./BasicMouseOver";


function CalendarBlock({children, date, value, maxValue, playtime}){

    const initialDate = date;

    if(date !== null){
        date = getOrdinal(date);
    }else{
        date = <>&nbsp;</>;
    }

    if(value === undefined) value = 0;
    if(maxValue === undefined) maxValue = 0;

    let a = 0;

    if(maxValue !== 0 && value !== 0){

        const percent = 100 / maxValue;
        a = percent * value * 0.01;
    }


    let inner = null;


    if(initialDate === null){
        inner = <>{children}<span className="tiny-font">{date}</span></>
    }else{
        inner = <BasicMouseOver title="Date Stats" content={<>
            <b>Matches Played</b>: {value}<br/>
            <b>Playtime</b>: {toPlaytime(playtime)}

        </>}>
            {children}<span className="tiny-font">{date}</span>
        </BasicMouseOver>;
    }

    return <div className="calendar-block" style={{"backgroundColor": `rgba(255,0,0,${a})`}}>
        {inner}
    </div>
}

function calcMaxValues(targetKeys, data){

    const maxValues = {};

    if(data === undefined){

        const dummy = {};

        for(let i = 0; i < targetKeys.length; i++){

            const k = targetKeys[i];
            dummy[k] = 0;
        }

        return dummy;
    }

    for(const value of Object.values(data)){


        for(let i = 0; i < targetKeys.length; i++){

            const k = targetKeys[i];

            if(maxValues[k] === undefined){
                maxValues[k] = value[k];
                continue;
            }      

            if(maxValues[k] < value[k]) maxValues[k] = value[k];
        }   
    }

    return maxValues;
}

function renderMonth(year, month, data){

    month++;
    const originalMonth = month;


    if(month < 10){
        month = `0${month}`;
    }

    const date = new Date(year, month);
    const lastDay = new Date(year, originalMonth, 0);

    //don't need to 0 now if single digit
    month = originalMonth;

    const firstDay = date.getDay();
    const lastDate = lastDay.getDate();

    const rows = [<div key={"day-names"} className="calendar-row">
            <CalendarBlock key={`01`} date={null}><BasicMouseOver title="Sunday">S</BasicMouseOver></CalendarBlock>
            <CalendarBlock key={`02`} date={null}><BasicMouseOver title="Monday">M</BasicMouseOver></CalendarBlock>
            <CalendarBlock key={`03`} date={null}><BasicMouseOver title="Tuesday">T</BasicMouseOver></CalendarBlock>
            <CalendarBlock key={`04`} date={null}><BasicMouseOver title="Wednesday">W</BasicMouseOver></CalendarBlock>
            <CalendarBlock key={`05`} date={null}><BasicMouseOver title="Thursday">T</BasicMouseOver></CalendarBlock>
            <CalendarBlock key={`06`} date={null}><BasicMouseOver title="Friday">F</BasicMouseOver></CalendarBlock>
            <CalendarBlock key={`07`} date={null}><BasicMouseOver title="Saturday">S</BasicMouseOver></CalendarBlock>
        </div>
    ];

    let currentRow = [];

    for(let i = 0; i < firstDay; i++){
        currentRow.push(<CalendarBlock key={`i-${i}`} date={null}>&nbsp;</CalendarBlock>);
    }


    const maxValues = calcMaxValues(["total", "playtime"], data);

    let currentDay = firstDay;
    let currentDate = 1;

    for(let i = 1; i <= lastDate; i++){


        let currentValue = {"total": 0, "playtime": 0};

        if(data !== undefined && data[`${year}-${originalMonth}-${currentDate}`] !== undefined){
            //console.log(data[`${year}-${originalMonth}-${currentDate}`],`${year}-${originalMonth}-${currentDate}`);

            currentValue = data[`${year}-${originalMonth}-${currentDate}`];
        }


        currentRow.push(<CalendarBlock key={i} playtime={currentValue.playtime} value={currentValue.total} maxValue={maxValues.total} date={currentDate}>
            {currentDate}
        </CalendarBlock>);

        //console.log(currentValue,`${year}-${originalMonth}-${currentDate}`);
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
            currentRow.push(<CalendarBlock key={`last-${i}`} date={null}>&nbsp;</CalendarBlock>);
        }
        
        rows.push(<div key={"end"} className="calendar-row">{currentRow}</div>);
    }

    return <>
        {rows}
    </>
}

export default function CalendarHeatMap({year, month, data}){
    
    //convert from 1-12 to 0-11
    month = month - 1;

    const currentDate = new Date(year, month);

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); //0-11
    //const date = currentDate.getDate(); //1-31
    //const day = currentDate.getDay(); //0-6 sunday-saturday

    return <div className="calendar-heat-map-wrapper">
        <div className="calendar-title">{getMonthName(currentMonth, true)} {currentYear}</div>
        {renderMonth(currentYear, currentMonth, data)}
    </div>
}