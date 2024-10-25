"use client"
import Header from "../Header";
import useLocalStorage from "@/app/hooks/useLocalStorage";
import { useEffect, useReducer } from "react";
import MatchesList from "../MatchList";
import InteractiveTable from "../InteractiveTable";
import { convertTimestamp, MMSS, toPlaytime } from "@/app/lib/generic.mjs";

function reducer(state, action){


    switch(action.type){
        case "set-total-matches": {
            return {
                ...state,
                "totalMatches": action.value
            }
        }
        case "set-matches-data": {
            return {
                ...state,
                "matchesData": action.data
            }
        }
    }

    return state;
}

async function loadMatches(dispatch){

    try{

        const matches = localStorage.getItem("saved-matches");

        if(matches === null) throw new Error(`Saved matches is null`);

        const hashes = JSON.parse(matches);

        const req = await fetch("/api/matches/", {
            "headers": {"Content-type": "application/json"},
            "method": "POST",
            "body": JSON.stringify({"mode": "get-matches-by-hashes", "hashes": hashes})
        });

        const res = await req.json();

        if(res.error !== undefined){
            throw new Error(res.error);
        }

        dispatch({"type": "set-matches-data", "data": res});


    }catch(err){
        console.trace(err);
    }
}


function removeFromFavourites(local, matches, removeHash){


    const index = matches.indexOf(removeHash);

    if(index === -1){
        console.log(`Match is not in favourites`);
        return;
    }

    matches.splice(index, 1);

    local.setItem("saved-matches", matches);
}



export default function SavedMatches({}){

    const local = useLocalStorage();
    const matches = local.getItem("saved-matches");
    const totalMatches = (matches != null) ? matches.length : 0;

    const [state, dispatch] = useReducer(reducer, {
        "totalMatches": 0,
        "matchesData": []
    });

    useEffect(() =>{

        dispatch({"type": "set-total-matches", "value": totalMatches});
        loadMatches(dispatch);

    },[totalMatches]);


    const headers = {
        "map": {"title": "Map"},
        "gametype": {"title": "Gametype"},
        "date": {"title": "Date"},
        "players": {"title": "Players"},
        "playtime": {"title": "Playtime"},
        "remove": {"title": "Remove"},
    };


    const rows = state.matchesData.map((m) =>{
        return {
            "map": {"value": m.mapName.toLowerCase(), "displayValue": m.mapName},
            "gametype": {"value": m.gametypeName.toLowerCase(), "displayValue": m.gametypeName},
            "date": {
                "value": m.date, 
                "displayValue": convertTimestamp(new Date(m.date), true, false, true),
                "className": "date"
            },
            "players": {"value": m.players},
            "playtime": {"value": m.playtime, "displayValue": MMSS(m.playtime)},
            "remove": {
                "value": null,
                "displayValue": "Remove",
                "className": "team-red hover",
                "onClick": () =>{
                    removeFromFavourites(local, matches, m.hash);
                    loadMatches(dispatch);
                }
            }
        };
    });


    return <>
        <Header>Saved Matches ({state.totalMatches})</Header>
        <InteractiveTable headers={headers} rows={rows} width={1}/>
    </>
}
