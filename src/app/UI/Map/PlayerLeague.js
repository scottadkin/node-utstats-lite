"use client"
import Header from "../Header";
import { useEffect, useReducer } from "react";
import InteractiveTable from "../InteractiveTable";
import PlayerLink from "../PlayerLink";
import { ignore0, getOrdinal, setInt } from "@/app/lib/generic.mjs";
import BasicPagination from "../BasicPagination";

function reducer(state, action){

    switch(action.type){
        case "set-data": {
            return {
                ...state,
                "data": action.data.data,
                "results": action.data.totalResults
            }
        }
        case "set-gametype": {
            return {
                ...state,
                "gametypeId": action.value
            }
        }
        case "set-page": {
            return {
                ...state,
                "page": action.value
            }
        }
    }

    return state;
}

async function loadData(mapId, gametypeId, dispatch, page, perPage){

    try{

        page = setInt(page, 1);
        perPage = setInt(perPage, 25);

        const req = await fetch(`/api/ctfLeague?mode=map&mId=${parseInt(mapId)}&gId=${parseInt(gametypeId)}&perPage=${perPage}&page=${page}`);
        const res = await req.json();

        if(res.error !== undefined) throw new Error(res.error.message);

        dispatch({"type": "set-data", "data": res});

    }catch(err){
        console.trace(err);
    }
}


function renderTable(state, dispatch){

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

        const pos = state.perPage * (state.page - 1) + i + 1

        return {
            "place": {"value": i, "displayValue": `${pos}${getOrdinal(pos)}`, "className": "ordinal"},
            "player": {
                "value":d.playerName.toLowerCase(), 
                "displayValue": <PlayerLink country={d.playerCountry} id={d.player_id}>{d.playerName}</PlayerLink>,
                "className": "text-left"
            },
            "played": {"value": d.total_matches},
            "wins": {"value": d.wins, "displayValue": ignore0(d.wins)},
            "draws": {"value": d.draws, "displayValue": ignore0(d.draws)},
            "losses": {"value": d.losses, "displayValue": ignore0(d.losses)},
            "capFor": {"value": d.cap_for, "displayValue": ignore0(d.cap_for)},
            "capAgainst": {"value": d.cap_against, "displayValue": ignore0(d.cap_against)},
            "capDiff": {"value": d.cap_offset, "displayValue": (d.cap_offset > 0) ? `+${d.cap_offset}` : ignore0(d.cap_offset)},
            "points": {"value": d.points, "displayValue": ignore0(d.points)},
        };
    });

    let pagination = null;

    if(state.results > state.perPage){
        pagination = <BasicPagination results={state.results} perPage={state.perPage} page={state.page} setPage={(newPage) =>{
            dispatch({"type": "set-page", "value": newPage});
        }}/>
    }
    return <>
        {pagination}
        <InteractiveTable width={2} headers={headers} rows={rows} bNoHeaderSorting={true}/>
    </>
}


function renderGametypeDropDown(state, dispatch, gametypes){

    const optionArray = [];
    const options = [];

    for(const [id, name] of Object.entries(gametypes)){
       optionArray.push({id, name});
    }

    optionArray.sort((a, b) =>{
        a = a.name.toLowerCase();
        b = b.name.toLowerCase();

        if(a < b) return -1;
        if(a > b) return 1;
        return 0;
    });

    for(let i = 0; i < optionArray.length; i++){
        const {id,name} = optionArray[i];
        options.push(<option key={id} value={id}>{name}</option>);
    }

    return <div className="form-row">
        <label>Gametype</label>
        <select className="default-select" defaultValue={state.gametypeId} onChange={(e) =>{
            dispatch({"type": "set-gametype", "value": e.target.value});
        }}>
            {options}
        </select>
    </div>
}

function renderInfo(leagueSettings){

    let matchAgeElem = null;
    let maxMatchesElem = null;

    if(leagueSettings["Maximum Match Age In Days"].value > 0){
        matchAgeElem = <p>Only Matches played in the last <b>{leagueSettings["Maximum Match Age In Days"].value}</b> days are counted.</p>;
    }

    if(leagueSettings["Maximum Matches Per Player"].value > 0){
        maxMatchesElem = <p>Only the last <b>{leagueSettings["Maximum Matches Per Player"].value}</b> matches played by the player are counted towards the league</p>;
    }

    return <div className="info">
            {matchAgeElem}
            {maxMatchesElem}
            <b>3 points</b> per win, <b>1 point</b> per draw, <b>0 points</b> per loss.
        </div>
}

export default function PlayerLeague({mapId, gametypes, leagueSettings, lastPlayedGametypeId}){

    const [state, dispatch] = useReducer(reducer, {
        "data": [], 
        "gametypeId": (lastPlayedGametypeId !== null) ? lastPlayedGametypeId : -1,
        "page": 1,
        "perPage": 25,
        "results": 0
    });

    useEffect(()=>{

        loadData(mapId, state.gametypeId, dispatch, state.page, state.perPage);

    }, [mapId, state.gametypeId, state.page, state.perPage]);




    return <>
        <Header>CTF Player League</Header>
        {renderInfo(leagueSettings)}
        {renderGametypeDropDown(state, dispatch, gametypes)}
        {renderTable(state, dispatch)}
    </>
}