import Header from "../Header";
import { useReducer, useEffect } from "react";
import InteractiveTable from "../InteractiveTable";
import { convertTimestamp, toPlaytime, MMSS } from "@/app/lib/generic.mjs";
import MatchScoreBox from "../MatchScoreBox";
import Link from "next/link";
import BasicPagination from "../BasicPagination";

function reducer(state, action){

    switch(action.type){

        case "set-names": {
            return {
                ...state,
                "typeNames": action.data
            }
        }
        case "set-matches": {
            return {
                ...state,
                "matches": action.matches,
                "totalMatches": action.totalMatches
            }
        }
        case "set-selected-name": {

            const test = {...state};

            test[action.key] = action.value;

            return {
                ...test,
                "page": 1
            }
        }
        case "add-pending": {

            const pending = {...state.pending};

            pending[action.id] = 1;
            
            return {
                ...state,
                "pending": pending
            }
        }
        case "delete-match": {

            const matches = [];

            for(let i = 0; i < state.matches.length; i++){

                const m = state.matches[i];

                if(m.id !== action.id) matches.push(m);
            }

            return {
                ...state,
                "matches": matches,
                "totalMatches": matches.length 
            }
        }
        case "set-page": {
            return {
                ...state,
                "page": action.page
            }
        }
    }
    return state;
}

async function loadMatches(dispatch, page, map, gametype, server){

    try{

        const req = await fetch(`./api/admin?mode=get-match-list&s=${server}&g=${gametype}&m=${map}&page=${page}&perPage=25`);

        const res = await req.json();

        if(res.error !== undefined){
            throw new Error(res.error);
        }

        dispatch({"type": "set-matches", "matches": res.matches, "totalMatches": res.totalMatches});

        console.log(res);
    }catch(err){
        console.trace(err);
    }
}


async function loadNames(dispatch){

    try{

        const req = await fetch(`./api/admin?mode=get-all-type-names`);

        const res = await req.json();

        if(res.error !== undefined){
            throw new Error(res.error);
        }


        dispatch({"type": "set-names", "data": res});

        console.log(res);

    }catch(err){
        console.trace(err);
    }
}

async function deleteMatch(dispatch, id){

    
    try{

        //add match to pending delete list

        dispatch({"type": "add-pending", "id": id});

        const req = await fetch("./api/admin/", {
            "headers": {"Content-type": "application/json"},
            "method": "POST",
            "body": JSON.stringify({"mode": "delete-match", "id": id})
        });

        const res = await req.json();

        if(res.error !== undefined){

            throw new Error(res.error.toString());
        }

        dispatch({"type": "delete-match", "id": id});
        console.log(res);

    }catch(err){
        console.trace(err);
    }
}

function renderBasicTable(state, dispatch){

    const headers = {
        "date": {"title": "Date"},
        "map": {"title": "Map"},   
        "server": {"title": "Server"},
        "players": {"title": "Players"},    
        "result": {"title": "Result"},
        "select": {"title": "Action"},
    };

    const rows = state.matches.map((m) =>{

        const url = `/match/${m.id}`;

        let deleteButton = <span className="hover team-red font-small padding-2" key={`${m.id}_delete`} onClick={() =>{
            deleteMatch(dispatch, m.id);
        }}>Delete Match</span>;

        if(state.pending[m.id] !== undefined){

            deleteButton = <span>In progress...</span>
        }

        return {
            "date": {"value": m.date, "displayValue": <Link href={url} target="_blank">{convertTimestamp(new Date(m.date), true, false, true)}</Link>, "className": "date"},
            "map": {"value": m.mapName.toLowerCase(), "displayValue": <Link href={url} target="_blank">{m.mapName}</Link>, "className": "font-small"},
            "players": {"value": m.players, "className": "font-small"},
            "server": {"value": m.serverName, "displayValue": <Link href={url} target="_blank">{m.serverName}</Link>, "className": "font-small" },
            "result": {"bIgnoreTD": true, "value": "", "displayValue": <MatchScoreBox  key={m.id} data={m} small={true} bTableElem={true}/>},
            "select": {"value": null, 
                "displayValue": deleteButton},
        };
    });

    return <InteractiveTable width={1} headers={headers} rows={rows} bNoHeaderSorting={true} sortBy={"date"} order="DESC"/>
}

function sortByName(a, b){

    a = a.name.toLowerCase();
    b = b.name.toLowerCase();

    if(a < b) return -1;
    if(a > b) return 1;
    return 0;
}


function renderFilterForm(state, dispatch){

    const maps = [];
    const gametypes = [];
    const servers = [];

    for(const [id, name] of Object.entries(state.typeNames.maps)){
        if(id === "0") continue;
        maps.push({id, name});
    }

    for(const [id, name] of Object.entries(state.typeNames.gametypes)){
        if(id === "0") continue;
        gametypes.push({id, name});
    }

    for(const [id, name] of Object.entries(state.typeNames.servers)){
        if(id === "0") continue;
        servers.push({id, name});
    }

    maps.sort(sortByName);
    gametypes.sort(sortByName);
    servers.sort(sortByName);

    maps.unshift({"id": "0", "name": "Any"});
    gametypes.unshift({"id": "0", "name": "Any"});
    servers.unshift({"id": "0", "name": "Any"});

    return <div className="form">
        <div className="form-row">
            <label>Map</label>
            <select value={state.selectedMap} onChange={(e) =>{
                dispatch({"type": "set-selected-name", "key": "selectedMap", "value": e.target.value});
            }}>
                {maps.map((m) =>{
                    return <option key={m.id} value={m.id}>{m.name}</option>
                })}
            </select>
        </div>
        <div className="form-row">
            <label>Gametype</label>
            <select value={state.selectedGametype} onChange={(e) =>{
                dispatch({"type": "set-selected-name", "key": "selectedGametype", "value": e.target.value});
            }}>
                {gametypes.map((g) =>{
                    return <option key={g.id} value={g.id}>{g.name}</option>
                })}
            </select>
        </div>
        <div className="form-row">
            <label>Server</label>
            <select value={state.selectedServer} onChange={(e) =>{
                dispatch({"type": "set-selected-name", "key": "selectedServer", "value": e.target.value});
            }}>
                {servers.map((s) =>{
                    return <option key={s.id} value={s.id}>{s.name}</option>
                })}
            </select>
        </div>
        <div className="small-info">Total Matches Found {state.totalMatches}</div>
    </div>
}

export default function MatchesManager({}){

    const [state, dispatch] = useReducer(reducer, {
        "page": 1, 
        "selectedMap": 0,
        "selectedGametype": 0,
        "selectedServer": 0,
        "matches": [],
        "totalMatches": 0,
        "typeNames": {
            "gametypes": {},
            "servers": {},
            "maps": {}
        },
        "pending": {}
    });

    useEffect(() =>{
        loadNames(dispatch);
    },[]);

    useEffect(() =>{

        loadMatches(dispatch, state.page, state.selectedMap, state.selectedGametype, state.selectedServer);


    },[state.page, state.selectedMap, state.selectedGametype, state.selectedServer]);

    return <>
        <Header>Matches Manager</Header>
        {renderFilterForm(state, dispatch)}
        <BasicPagination results={state.totalMatches} page={state.page} perPage={25} setPage={(a) =>{
       
            dispatch({"type": "set-page", "page": a});
        }}/>
        {renderBasicTable(state, dispatch)}
    </>
}