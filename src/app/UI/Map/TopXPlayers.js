"use client"
import Header from "../Header";
import InteractiveTable from "../InteractiveTable";
import { getOrdinal, getPlayer, toPlaytime } from "@/app/lib/generic.mjs";
import PlayerLink from "../PlayerLink";
import { useReducer, useEffect } from "react";

const PER_PAGE = 10;

function reducer(state, action){

    switch(action.type){
        case "load-data": {
            return {
                ...state,
                "data": action.data,
                "players": action.players,
                "title": action.title,  
                "totalEntries": action.totalEntries,
                "totalPages": action.totalPages    
            }
        }
        case "change-page": {
            return {
                ...state,
                "page": action.page
            }
        }
        case "set-category": {
            return {
                ...state,
                "category": action.value
            }
        }
    }

    return state;
}


async function loadData(mapId, category, page, perPage, dispatch){

    console.log("load data");

    try{

        const url = `/api/maps?mode=avg&id=${mapId}&cat=${category}&pp=${PER_PAGE}&page=${page}`;

        const req = await fetch(url);
        const res = await req.json();

        if(res.error !== undefined) throw new Error(res.error);

        console.log(res);

        let totalPages = res.totalEntries / PER_PAGE;

        if(totalPages !== totalPages) totalPages = 1;

        totalPages = Math.ceil(totalPages);

        if(totalPages < 1) totalPages = 1;
        
        dispatch({
            "type": "load-data", 
            "data": res.data, 
            "players": res.players, 
            "title": res.title, 
            "totalEntries": res.totalEntries,
            "totalPages": totalPages
        });

        console.log(res);
    }catch(err){
        console.trace(err);
    }
}

function renderOptions(types, state, dispatch){


    const options = [];

    for(const [key, value] of Object.entries(types)){

        options.push(<option key={key} value={key}>{value}</option>);
    }

    return <>
        <select value={state.category} onChange={(e) =>{
            dispatch({"type": "set-category", "value": e.target.value});
        }}>
            {options}
        </select>
    </>
}

export default function TopXPlayers({mapId, data, category, perPage, validOptions}){

    console.log(data);
    console.log(validOptions);

    const [state, dispatch] = useReducer(reducer, {
        "data": data.data,
        "players": data.players,
        "category": "deaths",
        "perPage": perPage,
        "page": 1,
        "title": "Kills",
        "totalEntries": 0,
        "totalPages": 1
    });


    useEffect(() =>{

        loadData(mapId, state.category, state.page, state.perPage, dispatch);

        return () =>{

        }

    },[mapId, state.category, state.page, state.perPage]);

    const headers = {
        "place": {"title": " "},
        "player": {"title": "Player"},
        "playtime": {"title": "Playtime"},
        "value": {"title": state.title}
    };

    const rows = [];

    for(let i = 0; i < state.data.length; i++){

        const d = state.data[i];

        const player = getPlayer(state.players, d.player_id);

        const place = (state.page - 1) * state.perPage + i + 1;

        rows.push({
            "place": {
                "value": "",
                "displayValue": <>{place}{getOrdinal(place)}</>,
                "className": "ordinal"
            },
            "player": {
                "value": player.name.toLowerCase(), 
                "displayValue": <PlayerLink country={player.country} id={player.id}>{player.name}</PlayerLink>, 
                "className": "player-name-td"
            },
            "playtime": {
                "value": d.total_playtime,
                "displayValue": toPlaytime(d.total_playtime),
                "className": "date"
            },
            "value": {
                "value": d.target_value,  
                "displayValue": d.target_value.toFixed(2),  
            }
        });
    }
    return <>
        <Header>Top Player Averages</Header>
        <div className="form-row">
            <label>Data Type</label>
            {renderOptions(validOptions, state, dispatch)}
        </div>
        <div className="info">
            Averages based on per minute played.
        </div>
        <div className="text-center">
            <div className="top-players">
                <div className="top-players-info">Displaying Page {state.page} of {state.totalPages}</div>
                <div className="duo">
                    <div className="big-button" onClick={() =>{
                        let page = state.page-1;
                        if(page < 1) page = 1;
                        dispatch({"type": "change-page", "page": page});
                    }}>Previous</div>
                    <div className="big-button" onClick={() =>{
                        let page = state.page+1;
                        if(page > state.totalPages) page = state.totalPages;
                        dispatch({"type": "change-page", "page": page});
                    }}>Next</div>
                </div>
                <InteractiveTable headers={headers} rows={rows} sortBy={"value"} order="desc" bNoHeaderSorting={true}/>
            </div>
        </div>
    </>
}