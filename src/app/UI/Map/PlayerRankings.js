"use client"
import Header from "../Header";
import { useEffect, useReducer } from "react";
import InteractiveTable from "../InteractiveTable";
import { convertTimestamp, getOrdinal, toPlaytime } from "@/app/lib/generic.mjs";
import PlayerLink from "../PlayerLink";

function reducer(state, action){

    switch(action.type){

        case "change-page": {
            return {
                ...state,
                "page": action.value
            }
        }
        case "set-data": {

            return {
                ...state,
                "data": action.data,
                "totalResults": action.totalResults
            }
        }
    }

    return state;
}


async function loadData(state, dispatch, id){

    try{

        const req = await fetch(`/api/map?mode=get-rankings&id=${id}&pp=${state.perPage}&tf=28`);

        const res = await req.json();

        if(res.error !== undefined) throw new Error(res.error);
        
        dispatch({"type": "set-data", "data": res.data, "totalResults": res.totalResults});

    }catch(err){
        console.trace(err);
    }
}

export default function PlayerRankings({id}){


    const [state, dispatch] = useReducer(reducer, {
        "page": 1,
        "perPage": 5,
        "totalResults": 0,
        "data": []
    });

    useEffect(() =>{

        loadData(state, dispatch, id);

    }, []);

    const headers = {
        "place": {"title": "Place"},
        "player": {"title": "Player"},
        "last": {"title": "Last Active"},
        "playtime": {"title": "Playtime"},
        "matches": {"title": "Matches"},
        "score": {"title": "Score"},

    };

    return <>
        <Header>Player Rankings</Header>

        <div className="info">Ranking based on players who have been active in the last 28 days.</div>
        <InteractiveTable width={3} bNoHeaderSorting={true} headers={headers} rows={
            state.data.map((d, i) =>{
                return {
                    "place": {"displayValue": `${i + 1}${getOrdinal(i + 1)}`, "className": "ordinal"},
                    "player": {"displayValue": <><PlayerLink id={d.player_id} country={d.country} bNewTab={true}>{d.name}</PlayerLink></>},
                    "last": {"displayValue": convertTimestamp(new Date(d.last_active), true, false, true), "className": "date"},
                    "playtime": {"displayValue": toPlaytime(d.playtime), "className": "date"},
                    "matches": {"displayValue": d.matches},
                    "score": {"displayValue": d.score},
                };
            })
        }/>
    </>

}