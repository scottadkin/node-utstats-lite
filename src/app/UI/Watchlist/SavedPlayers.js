"use client"
import Header from "../Header";
import { useReducer, useEffect } from "react";
import InteractiveTable from "../InteractiveTable";
import PlayerLink from "../PlayerLink";
import { convertTimestamp, toPlaytime } from "@/app/lib/generic.mjs";
import useLocalStorage from "@/app/hooks/useLocalStorage";

function reducer(state, action){

    switch(action.type){
        case "loaded-players": {
            return {
                ...state,
                "players": action.players,
                "totalPlayers": action.totalPlayers
            }
        }
        case "remove-player": {
            return {
                ...state,
                "totalPlayers": action.totalPlayers
            }
        }
    }

    return state;
}


async function loadPlayers(dispatch){

    try{

        let hashes = localStorage.getItem("saved-players");

        if(hashes === null) return;
        hashes = JSON.parse(hashes);

        const req = await fetch("/api/players", {
            "headers": {"Content-type": "application/json"},
            "method": "POST",
            "body": JSON.stringify({"mode": "get-players-by-hashes", "hashes": hashes})
        });

        const res = await req.json();

        if(res.error !== undefined) throw new Error(res.error);


        dispatch({"type": "loaded-players", "players": res.players, "totalPlayers": hashes.length});

    }catch(err){
        console.trace(err);
    }
}

function removeFromWatchlist(hash, local, dispatch){

    let currentPlayers = local.getItem("saved-players");

    if(currentPlayers === null) return;
    
    const newPlayers = [...currentPlayers];

    const index = newPlayers.indexOf(hash);

    if(index === -1) return;
    newPlayers.splice(index, 1);

    local.setItem("saved-players", newPlayers);

    dispatch({"type": "remove-player", "totalPlayers": newPlayers.length});
    
}

export default function SavedPlayers(){

    const local = useLocalStorage();

    const [state, dispatch] = useReducer(reducer, {
        "players": [],
        "totalPlayers": 0
    });

    useEffect(() =>{

        loadPlayers(dispatch);

    }, [state.totalPlayers]);


    const headers = {
        "name": {"title": "Name"},
        "last": {"title": "Last Active"},
        "matches": {"title": "Matches Played"},
        "playtime": {"title": "Playtime"},
        "remove": {"title": "Remove"}
    };

    const rows = state.players.map((p) =>{

        return {
            "name": {
                "value": p.name.toLowerCase(), 
                "displayValue": <PlayerLink id={p.hash} country={p.country} bNewTab={true}>{p.name}</PlayerLink>,
                "className": "text-left"
            },
            "last": {
                "value": p.last_active, 
                "displayValue": convertTimestamp(Date.now(p.last_active), true, false, true),
                "className": "date"
            },
            "matches": {"value": p.matches},
            "playtime": {"value": p.playtime, "displayValue": toPlaytime(p.playtime)},
            "remove": {
                "value": null,
                "displayValue": "Remove",
                "className": "team-red hover",
                "onClick": () =>{
                    removeFromWatchlist(p.hash, local, dispatch);
                }
            }
        };
    });

    return <>
        <Header>Saved Players ({state.totalPlayers})</Header>

        <InteractiveTable headers={headers} rows={rows} width={1} sortBy={"name"}/>
    </>
}