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
    }

    return state;
}

function renderMapOptions(mode){

    if(mode !== "map") return null;

    return <>
    aaa</>
}

export default function CTFLeague({}){

    const [state, dispatch] = useReducer(reducer, {
        "mode": "map"
    });

    const tabOptions = [
        {"name": "Map", "value": "map"}
    ];

    return <>
        <Header>CTF League</Header>
        <Tabs options={tabOptions} selectedValue={state.mode} changeSelected={(value) =>{
            dispatch({"type": "change-mode", "mode": value});
        }}/>
        {renderMapOptions(state.mode)}
    </>
}