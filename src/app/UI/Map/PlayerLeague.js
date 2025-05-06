"use client"
import Header from "../Header";
import { useEffect, useReducer } from "react";
import InteractiveTable from "../InteractiveTable";
import PlayerLink from "../PlayerLink";
import { ignore0, getOrdinal } from "@/app/lib/generic.mjs";

function reducer(state, action){

    switch(action.type){
        case "set-data": {
            return {
                ...state,
                "data": action.data
            }
        }
    }

    return state;
}

async function loadData(mapId, gametypeId, dispatch){

    try{

        const req = await fetch(`/api/ctfLeague?mode=map&mId=${parseInt(mapId)}&gId=${parseInt(gametypeId)}`);
        const res = await req.json();

        if(res.error !== undefined) throw new Error(res.error.message);

        console.log(res);

        dispatch({"type": "set-data", "data": res});

    }catch(err){
        console.trace(err);
    }
}


function renderTable(state){

    const headers = {
        "place": {"title": "Place"},
        "player": {"title": "Player"},
        "played": {"title": "Played"},
        "wins": {"title": "Wins"},
        "draws": {"title": "Draws"},
        "losses": {"title": "Losses"},
        "capFor": {"title": "Caps For"},
        "capAgainst": {"title": "Caps Against"},
        "capDiff": {"title": "Cap Diff"},
        "points": {"title": "Points"}
    };

    const rows = state.data.map((d, i) =>{
        return {
            "place": {"value": i, "displayValue": `${i+1}${getOrdinal(i+1)}`, "className": "ordinal"},
            "player": {"value":d.playerName.toLowerCase(), "displayValue": <PlayerLink country={d.playerCountry} id={d.player_id}>{d.playerName}</PlayerLink>},
            "played": {"value": d.total_matches},
            "wins": {"value": d.wins, "displayValue": ignore0(d.wins)},
            "draws": {"value": d.draws, "displayValue": ignore0(d.draws)},
            "losses": {"value": d.losses, "displayValue": ignore0(d.losses)},
            "capFor": {"value": d.cap_for, "displayValue": ignore0(d.cap_for)},
            "capAgainst": {"value": d.cap_against, "displayValue": ignore0(d.cap_against)},
            "capDiff": {"value": d.cap_offset, "displayValue": (d.cap_offset > 0) ? `+${d.cap_offset}` : d.cap_offset},
            "points": {"value": d.points, "displayValue": ignore0(d.points)},
        };
    });

    return <InteractiveTable width={2} headers={headers} rows={rows}/>
}

//get last played match gametype id then get league data for that gametype
export default function PlayerLeague({mapId}){

    const [state, dispatch] = useReducer(reducer, {"data": [], "gametypeId": -1});

    useEffect(()=>{

        loadData(18, 1, dispatch);
        //loadData(mapId, state.gametypeId, dispatch);

    }, [mapId, state.gametypeId]);

    return <>
        <Header>Player League</Header>
        GAMETYPE DROPDOWN HERE<br/>
        Active last X Here<br/>
        Per Page dropdown here<br/>
        {renderTable(state)}
    </>
}