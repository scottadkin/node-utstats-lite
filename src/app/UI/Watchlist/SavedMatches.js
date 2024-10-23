"use client"
import Header from "../Header";
import useLocalStorage from "@/app/hooks/useLocalStorage";
import { useEffect, useReducer } from "react";
import MatchesList from "../MatchList";

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

        //const local = useLocalStorage();

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


        console.log(res);

    }catch(err){
        console.trace(err);
    }
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

    return <>
        <Header>Saved Matches ({state.totalMatches})</Header>
        <MatchesList data={state.matchesData} bIgnoreMap={false}/>
    </>
}