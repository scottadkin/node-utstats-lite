"use client"
import Header from "../Header";
import Tabs from "../Tabs";
import { useReducer } from "react";

function reducer(state, action){

    switch(action.type){

        case "change-mode": {
            return {
                ...state,
                "mode": action.value
            }
        }
    }

    return state;
}

export default function BackupManager(){

    const [state, dispatch] = useReducer(reducer,{
        "mode": "0"
    });

    const tabOptions = [];

    return <>
        <Header>Backup Manager</Header>
        <Tabs options={tabOptions} selectedValue={state.mode} changeSelected={() => {}}/>
    </>
}