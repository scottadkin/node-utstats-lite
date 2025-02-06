"use client"
import Header from "../Header";
import InteractiveTable from "../InteractiveTable";
import { getOrdinal, toPlaytime, convertTimestamp } from "@/app/lib/generic.mjs";
import Tabs from "../Tabs";
import { useState } from "react";


function createRows(mode, data, names){

    return data.map((d) =>{

        const id = (mode === "gametypes") ? d.gametype_id : d.map_id;

        const name = (names[id] !== undefined) ? names[id] : "Not Found";

        return {
            "pos": {"value": d.position, "displayValue": `${d.position}${getOrdinal(d.position)}`, "className": "ordinal"},
            "name": {"value": name.toLowerCase(), "displayValue": name},
            "last": {
                "value": d.last_active, 
                "displayValue": convertTimestamp(Math.floor(new Date(d.last_active) * 0.001), true),
                "className": "date"
            },
            "matches": {"value": d.matches},
            "playtime": {"value": d.playtime, "displayValue": toPlaytime(d.playtime), "className": "date"},
            "score": {"value": d.score, "displayValue": d.score.toFixed(2)}
        };
    });
}

export default function Rankings({gametypesData, gametypeNames, mapsData, mapNames}){

    const [mode, setMode] = useState("gametypes");

    const headers = {
        "pos": {"title": "Place"},
        "name": {"title": "Gametype"},
        "last": {"title":"Last Active"},
        "matches": {"title":"Matches"},
        "playtime": {"title":"Playtime"},
        "score": {"title":"Points"}
    };

    

    const tabOptions = [
        {"name": "Gametypes", "value": "gametypes"},
        {"name": "Maps", "value": "maps"},
    ];

    const data = (mode === "gametypes") ? gametypesData : mapsData;
    const names = (mode === "gametypes") ? gametypeNames : mapNames;

    const rows = createRows(mode, data, names);

   
    return <>
        <Header>Rankings</Header>
        <div className="info">
            Ranking positions based on {mode} where player has been active in the last 28 days.
        </div>
        <Tabs options={tabOptions} selectedValue={mode} changeSelected={(value) =>{
            setMode(value);
        }}/>
        <InteractiveTable width={3} headers={headers} rows={rows} sortBy="position" order="ASC"/>
    </>
}