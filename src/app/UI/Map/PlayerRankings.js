"use client"
import Header from "../Header";
import { useEffect, useReducer } from "react";

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

        const req = await fetch(`/api/map?mode=get-rankings&id=${id}&tf=28`);

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
        "perPage": 25,
        "totalResults": 0,
        "data": []
    });

    useEffect(() =>{

        loadData(state, dispatch, id);

    }, []);

    return <>
        <Header>Player Rankings</Header>

        Found {state.totalResults} entries for this map
    </>

}