"use client"
import CalendarHeatMap from "../CalendarHeatMap";
import { useState } from "react";
import Header from "../Header";


export default function ActivityHeatMap(){

    const now = new Date(Date.now());
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);



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
        
            <CalendarHeatMap year={selectedYear} month={selectedMonth + 1}/>
        </div>
    </div>

}