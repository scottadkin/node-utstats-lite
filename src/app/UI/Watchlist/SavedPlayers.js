"use client"
import Header from "../Header";
import { useReducer, useEffect } from "react";
import InteractiveTable from "../InteractiveTable";
import PlayerLink from "../PlayerLink";
import { convertTimestamp, toPlaytime } from "@/app/lib/generic.mjs";

function reducer(state, action){

    switch(action.type){
        case "loaded-players": {
            return {
                ...state,
                "players": action.players,
                "totalPlayers": action.totalPlayers,
                "savedPlayers": action.savedPlayers
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


        dispatch({
            "type": "loaded-players", 
            "players": res.players, 
            "totalPlayers": hashes.length,
            "savedPlayers": hashes
        });

    }catch(err){
        console.trace(err);
    }
}

function removeFromWatchlist(hash, dispatch){

    let currentPlayers = localStorage.getItem("saved-players");

    if(currentPlayers === null) return;

    currentPlayers = JSON.parse(currentPlayers);
    
    const newPlayers = [...currentPlayers];

    const index = newPlayers.indexOf(hash);

    if(index === -1) return;
    newPlayers.splice(index, 1);

    localStorage.setItem("saved-players", JSON.stringify(newPlayers));

    dispatch({"type": "remove-player", "totalPlayers": newPlayers.length});
    
}

function getPlayerByHash(targetHash, state){

    for(let i = 0; i < state.players.length; i++){

        const p = state.players[i];
        if(targetHash === p.hash) return p;
    }

    return null;
}

function createRows(state, dispatch){

    const rows = [];

    for(let i = 0; i < state.savedPlayers.length; i++){

        const hash = state.savedPlayers[i];
        const p = getPlayerByHash(hash, state);
 
        if(p === null){

            rows.push({
                "name": {
                    "value": "", 
                    "displayValue": "Deleted Player",
                    "className": "text-left"
                },
                "last": {
                    "value": 0, 
                    "displayValue": convertTimestamp(0),
                    "className": "date"
                },
                "matches": {"value": 0},
                "playtime": {"value": 0},
                "remove": {
                    "value": null,
                    "displayValue": "Remove",
                    "className": "team-red hover",
                    "onClick": () =>{
                        removeFromWatchlist(hash, dispatch);
                        loadPlayers(dispatch);
                    }
                }
            });
            continue;
        }

        rows.push({
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
                    removeFromWatchlist(hash, dispatch);
                    loadPlayers(dispatch);
                }
            }
        });
    }

    return rows;
}

export default function SavedPlayers(){

    const [state, dispatch] = useReducer(reducer, {
        "players": [],
        "totalPlayers": 0,
        "savedPlayers": []
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

        const rows = createRows(state, dispatch);
    

    return <>
        <Header>Saved Players ({state.totalPlayers})</Header>

        <InteractiveTable headers={headers} rows={rows} width={1} sortBy={"name"}/>
    </>
}