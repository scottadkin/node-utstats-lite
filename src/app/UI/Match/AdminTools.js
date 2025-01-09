"use client"
import { convertTimestamp } from "@/app/lib/generic.mjs";
import Header from "../Header";
import { useEffect, useReducer } from "react";

function reducer(state, action){

    switch(action.type){

        case "loaded-data": {
            return {
                ...state,
                "logInfo": action.data
            }
        }
    }

    return {...state};
}

async function loadData(dispatch, id){

    try{

        const req = await fetch(`/api/admin?mode=admin-get-match-details&id=${id}`);
        const res = await req.json();

        console.log(res);

        if(res.fileName !== undefined){
            dispatch({"type": "loaded-data", "data": {...res}});
        }

    }catch(err){
        console.trace(err);
    }
}


async function deleteMatch(dispatch, id){

    try{

        const req = await fetch("/api/admin", {
            "headers": {"Content-type": "application/json"},
            "method": "POST",
            "body": JSON.stringify({"mode": "delete-match", "id": id})
        });

        const res = await req.json();


    }catch(err){
        console.trace(err);
    }
}

export default function AdminTools({matchId}){

    const [state, dispatch] = useReducer(reducer, {
        "logInfo": {"fileName": "Not Found", "date": ""}
    });

    useEffect(() =>{

        loadData(dispatch, matchId);
    }, [matchId]);
    return <>
        <Header>Admin Tools</Header>
        <div className="box">
            <b>LogFile</b>: {state.logInfo.fileName}<br/>
            <b>Imported</b>: {convertTimestamp(new Date(state.logInfo.date), true, false, true)}<br/>
            <div className="delete-button hover" onClick={() =>{
                deleteMatch(dispatch, matchId);
            }}>
                Delete Match
            </div>
        </div>
        
    </>
}