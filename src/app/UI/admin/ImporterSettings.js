"use client"
import Header from "../Header";
import TrueFalseButton from "../TrueFalseButton";
import { useReducer, useEffect } from "react";
import ErrorBox from "../ErrorBox";
import MessageBox from "../MessageBox";


async function saveChanges(state, dispatch){

    try{

        const req = await fetch("/api/admin/", {
            "headers": {"Content-type": "application/json"},
            "method": "POST",
            "body": JSON.stringify({
                "mode": "update-importer-settings",
                "ignoreBots": state.ignoreBots,
                "ignoreDuplicates": state.ignoreDuplicates,
                "minPlayers": state.minPlayers,
                "minPlaytime": state.minPlaytime,
                "appendTeamSizes": state.appendTeamSizes
            })
        });

        const res = await req.json();

        if(res.error !== undefined){
            dispatch({"type": "setError", "value": res.error.toString()});
            return;
        }

        dispatch({"type": "setMessage", "value": "Changes were saved successfully"});


    }catch(err){
        console.trace(err);
    }
}


async function loadSettings(dispatch){

    try{

        const req = await fetch("/api/admin?mode=get-log-settings");

        const res = await req.json();

        if(res.error !== undefined){
            dispatch({"type": "setError", "value": res.error.toString()});
            return;
        }

        dispatch({"type": "loadedSettings", "settings": res});

    }catch(err){
        dispatch({"type": "setError", "value": err.toString()});
    }
}


function reducer(state, action){

    switch(action.type){

        case "loadedSettings": {
            return {
                ...state,
                "ignoreBots": action.settings.ignore_bots,
                "ignoreDuplicates": action.settings.ignore_duplicates,
                "minPlaytime": action.settings.min_playtime,
                "minPlayers": action.settings.min_players,
                "appendTeamSizes": action.settings.append_team_sizes
            }
        }
        case "setError": {
            return {
                ...state,
                "error": action.value
            }
        }
        case "setMessage": {
            return {
                ...state,
                "message": action.value
            }
        }
        case "setIgnoreBots": {
            return {
                ...state,
                "ignoreBots": action.value
            }
        }
        case "setIgnoreDuplicates": {
            return {
                ...state,
                "ignoreDuplicates": action.value
            }
        }
        case "setMinPlayers": {
            return {
                ...state,
                "minPlayers": action.value
            }
        }
        case "setMinPlaytime": {
            return {
                ...state,
                "minPlaytime": action.value
            }
        }
        case "setAppendTeamSizes": {
            return {
                ...state,
                "appendTeamSizes": action.value
            }
        }
    }

    return state;
}

export default function ImporterSettings({}){


    const [state, dispatch] = useReducer(reducer, {
        "error": null,
        "message": null,
        "ignoreBots": 0,
        "ignoreDuplicates": 0,
        "minPlaytime": 0,
        "minPlayers": 0,
        "appendTeamSizes": 0
    });

    useEffect(() =>{
        loadSettings(dispatch);
    },[]);

    return <>
        <Header>Importer Settings</Header>
        <ErrorBox title="Failed To Save Changes">{state.error}</ErrorBox>
        <MessageBox title="Success">{state.message}</MessageBox>
        <div className="form">
            <div className="form-info">
                These settings are applied to logs that are left in the /Logs folder of the website.<br/>
            </div>
            <div className="form-row">
                <label>Ignore Bots</label>
                <TrueFalseButton value={state.ignoreBots} setValue={() =>{
                    dispatch({"type": "setIgnoreBots", "value": (state.ignoreBots === 0) ? 1 : 0});
                }}/>
            </div>
            <div className="form-row">
                <label>Ignore Duplicates</label>
                <TrueFalseButton value={state.ignoreDuplicates} setValue={() =>{
                    dispatch({"type": "setIgnoreDuplicates", "value": (state.ignoreDuplicates === 0) ? 1 : 0});
                }}/>
            </div>
            <div className="form-row">
                <label>Minimum Players</label>
                <input type="number" className="textbox" value={state.minPlayers} min={0} onChange={(e) =>{
                    dispatch({"type": "setMinPlayers", "value": e.target.value});
                }}/>
            </div>
            <div className="form-row">
                <label>Minimum Playtime(seconds)</label>
                <input type="number" className="textbox" value={state.minPlaytime} min={0} onChange={(e) =>{
                    dispatch({"type": "setMinPlaytime", "value": e.target.value});
                }}/>
            </div>
            <div className="form-row">
                <label>Append Team Sizes To Gametype Name</label>
                <TrueFalseButton value={state.appendTeamSizes} setValue={() =>{
                    dispatch({"type": "setAppendTeamSizes", "value": (state.appendTeamSizes === 0) ? 1 : 0});
                }}/>
            </div>
            <div className="text-center">
                <input type="button" className="submit-button" value="Save Changes" onClick={() =>{
                    saveChanges(state, dispatch);
                }}/>
            </div>
        </div>
    </>
}