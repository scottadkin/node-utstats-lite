"use client"
import Header from "../Header";
import InteractiveTable from "../InteractiveTable";
import { useEffect, useReducer } from "react";
import ErrorBox from "../ErrorBox";
import { MMSS, convertTimestamp } from "@/app/lib/generic.mjs";
import MatchResult from "./MatchResult";
import Link from "next/link";
import BasicPagination from "../BasicPagination";


async function loadData(playerId, page, perPage, selectedGametype, selectedMap, dispatch){

    try{

        const req = await fetch(`/api/player/recentMatches?id=${playerId}&g=${selectedGametype}&m=${selectedMap}&page=${page}&perPage=${perPage}`);

        const res = await req.json();

        if(res.error !== undefined){
            throw new Error(res.error);
        }

        dispatch({
            "type": "set-data", 
            "matches": res.matches, 
            "serverNames": res.serverNames, 
            "gametypeNames": res.gametypeNames, 
            "mapNames": res.mapNames,
            "totalMatches": res.totalMatches
        });


    }catch(err){
        console.trace(err);
        dispatch({"type": "set-error", "error": err.toString()});
    }
}


function reducer(state, action){

    switch(action.type){

        case "set-data":{

            return {
                ...state,
                "totalMatches": action.totalMatches,
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

        case "set-page": {
            return {
                ...state,
                "page": action.page
            }
        }

        case "set-gametype": {
            return {
                ...state,
                "selectedGametype": action.value,
                "page": 1
            }
        }

        case "set-map": {
            return {
                ...state,
                "selectedMap": action.value,
                "page": 1
            }
        }
    }

    return state;
}


function byName(a, b){

    a = a.name.toLowerCase();
    b = b.name.toLowerCase();

    if(a < b) return -1;
    if(a > b) return 1;
    return 0;
}


function getPlayedMatches(data, targetKey, targetId){

    targetId = parseInt(targetId);

    for(let i = 0; i < data.length; i++){

        const d = data[i];
        if(d[targetKey] === targetId) return d.total_matches;
    }

    return 0;
}

function renderOptions(state, dispatch, playedMaps, playedGametypes, mapNames, gametypeNames){

    const gametypeOptions = [];
    const mapOptions = [];

    for(let [id, name] of Object.entries(gametypeNames)){

        gametypeOptions.push({"id": parseInt(id), "name": name});
    }

    for(let [id, name] of Object.entries(mapNames)){

        mapOptions.push({"id": parseInt(id), "name": name});
    }

    gametypeOptions.sort(byName)

    return <>
        <div className="form-row">
            <label>Gametype</label>
            <select value={state.selectedGametype} onChange={(e) =>{
                dispatch({"type": "set-gametype", "value": e.target.value});
            }}>
                {gametypeOptions.map((g, i) =>{
           
                    return <option key={i} value={g.id}>{g.name}</option>
                })}
            </select>
        </div>
        <div className="form-row">
            <label>Map</label>
            <select value={state.selectedMap} onChange={(e) =>{
                dispatch({"type": "set-map", "value": e.target.value});
            }}>
                <option value="0">All</option>
            {mapOptions.map((m, i) =>{
                    return <option key={i} value={m.id}>{m.name}</option>
                })}
            </select>
        </div>
    </>
}

function createRows(state, playerId){

    const rows = [];


    for(let i = 0; i < state.data.matches.length; i++){

        const m = state.data.matches[i];

        const date = new Date(m.date) * 0.001;
        const gametype = state.data.gametypeNames[m.gametype_id] ?? "Not Found";
        const map = state.data.mapNames[m.map_id] ?? "Not Found";

        const url = `/match/${m.id}`;

        rows.push({
            "date": {
                "value": date,
                "displayValue": <Link href={url}>{convertTimestamp(date, true)}</Link>,
                "className": "date"
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

    return rows;
}

export default function RecentMatches({playerId, mapNames, gametypeNames, playedGametypes, playedMaps}){

    const [state, dispatch] = useReducer(reducer, {
        "error": null,
        "bLoading": true,
        "page": 1,
        "perPage": 50,
        "totalMatches": 0,
        "selectedGametype": 0,
        "selectedMap": 0,
        "data": {"matches":[], "serverNames": {}, "gametypeNames": {}, "mapNames": {}}
    });

    useEffect(() =>{

        const controller = new AbortController();

        loadData(playerId, state.page, state.perPage, state.selectedGametype, state.selectedMap, dispatch);

        return () =>{
            controller.abort();
        }

    },[playerId, state.page, state.perPage, state.selectedGametype, state.selectedMap]);

    const headers = {
        "date": {"title": "Date"},
        "gametype": {"title": "Gametype"},
        "map": {"title": "Map"},
        "playtime": {"title": "Playtime"},
        "result": {"title": "Match Result"}
    };

    const rows = createRows(state, playerId);


    return <>
        <Header>Recent Matches</Header>
        <ErrorBox title="Failed to load recent matches">{state.error}</ErrorBox>
        {renderOptions(state, dispatch, playedMaps, playedGametypes, mapNames, gametypeNames)}
        <BasicPagination results={state.totalMatches} page={state.page} perPage={state.perPage} setPage={(page) =>{

            dispatch({"type": "set-page", "page": page});
        }}/>
        <InteractiveTable width={1} headers={headers} rows={rows} sortBy={"date"} order={"DESC"} bNoHeaderSorting={true}/>
    </>
}