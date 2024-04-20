"use client"
import { getTeamColorClass } from "@/app/lib/generic.mjs";
import Header from "../Header";
import InteractiveTable from "../InteractiveTable";
import PlayerLink from "../PlayerLink";

export default function Pings({data, totalTeams}){

    const headers = {
        "name": {"title": "Player"},
        "min": {"title": "Min"},
        "avg": {"title": "Average"},
        "max": {"title": "Max"},
    };

    const rows = data.map((d) =>{
        return {
            "name": {
                "value": d.name.toLowerCase(), 
                "displayValue": <PlayerLink id={d.player_id} country={d.country}>{d.name}</PlayerLink>,
                "className": `text-left player-name-td ${(totalTeams < 2) ? "" : getTeamColorClass(d.team)}`
            },
            "min": {"value": d.ping_min},
            "avg": {"value": d.ping_avg},
            "max": {"value": d.ping_max},
        };
    });

    return <>
        <Header>Ping Summary</Header>
        <InteractiveTable headers={headers} rows={rows}/>
    </>;
}