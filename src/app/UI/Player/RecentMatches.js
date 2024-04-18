"use client"
import Header from "../Header";
import InteractiveTable from "../InteractiveTable";
import { useEffect } from "react";
import { useReducer } from "react";
import ErrorBox from "../ErrorBox";
import { MMSS, convertTimestamp } from "@/app/lib/generic.mjs";
import MatchResult from "./MatchResult";
import Link from "next/link";


async function loadData(playerId, page, perPage, dispatch){

    try{

        const req = await fetch(`/api/player/recentMatches?id=${playerId}&page=${page}&perPage=${perPage}`);

        const res = await req.json();

        if(res.error !== undefined){
            throw new Error(res.error);
        }

        console.log(res);

        dispatch({"type": "set-data", "matches": res.matches, "serverNames": res.serverNames, "gametypeNames": res.gametypeNames, "mapNames": res.mapNames});


    }catch(err){
        console.trace(err);
        dispatch({"type": "set-error", "error": err.toString()});
    }
}


function reducer(state, action){

    switch(action.type){

        case "set-data":{

            console.log(action);
            return {
                ...state,
                "data": {
                    "matches": action.matches,
                    "serverNames": action.serverNames,
                    "gametypeNames": action.gametypeNames,
                    "mapNames": action.mapNames,
                    "bLoading": false
                }
            }
        }

        case "set-error": {
            return {
                ...state,
                "error": action.error
            }
        }
    }

    return state;
}

export default function RecentMatches({playerId}){

    const [state, dispatch] = useReducer(reducer, {
        "error": null,
        "bLoading": true,
        "page": 1,
        "perPage": 50,
        "data": {"matches":[], "serverNames": {}, "gametypeNames": {}, "mapNames": {}}
    });

    useEffect(() =>{

        const controller = new AbortController();

        loadData(playerId, state.page, state.perPage, dispatch);

        return () =>{
            controller.abort();
        }

    },[playerId, state.page, state.perPage]);

    const headers = {
        "date": {"title": "Date"},
        "gametype": {"title": "Gametype"},
        "map": {"title": "Map"},
        "playtime": {"title": "Playtime"},
        "result": {"title": "Match Result"}
    };

    const rows = [];

    console.log(state);

    for(let i = 0; i < state.data.matches.length; i++){

        const m = state.data.matches[i];

        const date = new Date(m.date) * 0.001;
        const gametype = state.data.gametypeNames[m.gametype_id] ?? "Not Found";
        const map = state.data.mapNames[m.map_id] ?? "Not Found";

        const url = `/match/${m.id}`;

        rows.push({
            "date": {
                "value": date,
                "displayValue": <Link href={url}>{convertTimestamp(date, true)}</Link>
            },
            "gametype": {
                "value": gametype.toLowerCase(),
                "displayValue": <Link href={url}>{gametype}</Link>
            },
            "map": {
                "value": map.toLowerCase(),
                "displayValue": <Link href={url}>{map}</Link>
            },
            "playtime": {
                "value": m.playtime,
                "displayValue": <Link href={url}>{MMSS(m.playtime)}</Link>
            },
            "result": {
                "value": "",
                "displayValue": <Link href={url}><MatchResult playerId={playerId} data={m}/></Link>
            }
        });

    }

    return <>
        <Header>Recent Matches</Header>
        <ErrorBox title="Failed to load recent matches">{state.error}</ErrorBox>
        <InteractiveTable width={1} headers={headers} rows={rows} srotBy={"date"} order={"DESC"} bNoHeaderSorting={true}/>
    </>
}