"use client"
import Header from "../Header";
import Tabs from "../Tabs";
import {useEffect, useReducer } from "react";

function reducer(state, action){

    switch(action.type){
        case "change-mode": {
            return {
                ...state,
                "mode": action.mode
            }
        }
        case "load-settings": {
            return {
                ...state,
                "settings": action.settings
            }
        }
    }

    return state;
}

function renderMapOptions(state){

    if(state.mode !== "map") return null;

    const rows = [];

    for(const [key, value] of Object.entries(state.settings)){

        rows.push(<tr key={rows.length}>
            <td className="text-left">{key}</td>
            <td>{value.value}</td>
        </tr>);
    }

    if(rows.length === 0) return null;

    return <>
        <div className="info">
            - Maximum matches per player refers to the maximum number of matches that can be counted in a league table.<br/> 
            - If a player is over the maximum number of matches only their latest games are counted towards the league table.
        </div>
        <table className="t-width-3">
            <tbody>
                <tr>
                    <th>Setting</th>
                    <th>Value</th>
                </tr>
                {rows}
            </tbody>
        </table>
    </>
}

async function loadSettings(dispatch){

    try{

        const req = await fetch("./api/ctfLeague?mode=get-settings");

        const res = await req.json();

        if(res.error !== undefined) throw new Error(res.error.message);

        dispatch({"type": "load-settings", "settings": res});

        console.log(res);
    }catch(err){
        console.trace(err);
    }
}

export default function CTFLeague({}){

    const [state, dispatch] = useReducer(reducer, {
        "mode": "map",
        "settings": {}
    });

    useEffect(() =>{
        loadSettings(dispatch);
    },[]);

    const tabOptions = [
        {"name": "Map", "value": "map"}
    ];

    return <>
        <Header>CTF League</Header>
        <Tabs options={tabOptions} selectedValue={state.mode} changeSelected={(value) =>{
            dispatch({"type": "change-mode", "mode": value});
        }}/>
        {renderMapOptions(state)}
    </>
}