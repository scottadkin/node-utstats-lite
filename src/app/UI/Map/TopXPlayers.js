"use client"
import Header from "../Header";
import InteractiveTable from "../InteractiveTable";
import { getPlayer, toPlaytime } from "@/app/lib/generic.mjs";
import PlayerLink from "../PlayerLink";
import { useReducer, useEffect } from "react";

function reducer(state, action){

    switch(action.type){
        case "load-data": {
            return {
                "data": action.data,
                "players": action.players,
                ...state
            }
        }
    }

    return state;
}


async function loadData(mapId, category, page, perPage){

    console.log("load data");

    try{

        const url = `/api/maps?mode=avg&id=${mapId}&category=${category}`;

        console.log(url);

        const req = await fetch(url);
        const res = await req.json();

        console.log(res);
    }catch(err){
        console.trace(err);
    }
}

export default function TopXPlayers({mapId, data, category, perPage}){

    console.log(data);

    const [state, dispatch] = useReducer(reducer, {
        "data": data.data,
        "players": data.players,
        "category": "deaths",
        "perPage": perPage,
        "page": 1,
        "title": "Title"
    });


    useEffect(() =>{

        loadData(mapId, state.category, state.page, state.perPage);

        return () =>{

        }

    },[mapId, state.category, state.page, state.perPage]);

    const headers = {
        "player": {"title": "Player"},
        "playtime": {"title": "Playtime"},
        "value": {"title": "VALUE"}
    };

    const rows = [];

    for(let i = 0; i < state.data.length; i++){

        const d = state.data[i];

        const player = getPlayer(state.players, d.player_id);

        rows.push({
            "player": {
                "value": player.name.toLowerCase(), 
                "displayValue": <PlayerLink country={player.country} id={player.id}>{player.name}</PlayerLink>, 
                "className": "player-name-td"
            },
            "playtime": {
                "value": d.total_playtime,
                "displayValue": toPlaytime(d.total_playtime)  ,
                "className": "date"
            },
            "value": {
                "value": d.target_value,  
            }
        });
    }
    return <>
        <Header>Top {state.title} Players</Header>
        <div className="info">
            Averages based on per minute played.
        </div>
        <InteractiveTable width={4} headers={headers} rows={rows} sortBy={"value"} order="desc"/>
    </>
}