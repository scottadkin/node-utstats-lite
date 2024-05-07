"use client"
import Header from "../Header";
import InteractiveTable from "../InteractiveTable";
import { getOrdinal, toPlaytime, convertTimestamp } from "@/app/lib/generic.mjs";

export default function Rankings({data, gametypeNames}){

    const headers = {
        "pos": {"title": "Place"},
        "name": {"title": "Gametype"},
        "last": {"title":"Last Active"},
        "matches": {"title":"Matches"},
        "playtime": {"title":"Playtime"},
        "score": {"title":"Points"}
    };

    const rows = data.map((d) =>{

        const name = (gametypeNames[d.gametype_id] !== undefined) ? gametypeNames[d.gametype_id] : "Not Found";

        return {
            "pos": {"value": d.position, "displayValue": `${d.position}${getOrdinal(d.position)}`},
            "name": {"value": name.toLowerCase(), "displayValue": name},
            "last": {
                "value": d.last_active, 
                "displayValue": convertTimestamp(Math.floor(new Date(d.last_active) * 0.001), true),
                "className": "date"
            },
            "matches": {"value": d.matches},
            "playtime": {"value": d.playtime, "displayValue": toPlaytime(d.playtime)},
            "score": {"value": d.score, "displayValue": d.score.toFixed(2)}
        };
    });
   
    return <>
        <Header>Rankings</Header>
        <div className="info">
            Ranking positions based on gametypes where player has been active in the last 28 days.
        </div>
        <InteractiveTable width={3} headers={headers} rows={rows}/>
    </>
}