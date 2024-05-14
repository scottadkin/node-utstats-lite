"use client"
import { useEffect, useReducer } from "react";
import Header from "../Header";
import Tabs from "../Tabs";
import ErrorBox from "../ErrorBox";


function reducer(state, action){

    switch(action.type){

        case "error": {
            return {
                ...state,
                "error": action.message
            }
        }
        case "loaded-players": {
            return {
                ...state,
                "players": action.data
            }
        }
        case "update-rename-form": {
            return {
                ...state,
                "renameForm": {
                    "newName": action.newName,
                    "selectedPlayer": action.selectedPlayer
                }
            }
        }
    }

    return state;
}


async function getPlayerNames(dispatch){

    try{

        const req = await fetch("/api/admin?mode=get-all-player-names");

        const res = await req.json();

        if(res.error !== undefined) throw new Error(res.error);

        dispatch({"type": "loaded-players", "data": res.playerNames});

    }catch(err){
        console.trace(err);

        dispatch({"type": "error", "message": err.toString()});
    }
}


function bNameAlreadyTaken(state, targetName){

    targetName = targetName.toLowerCase();

    for(let i = 0; i < state.players.length; i++){

        const p = state.players[i];

        if(p.name.toLowerCase() === targetName) return true;
    }

    return false;
}

function createPlayerOptions(state){

    return state.players.map((p) =>{
        return <option key={p.id} value={p.id}>{p.name}</option>
    });
}


async function renamePlayer(state, dispatch){

    try{

        const req = await fetch("/api/admin", {
            "headers": {"content-type": "application/json"},
            "method": "POST",
            "body": JSON.stringify({
                "mode": "rename-player", 
                "playerId": state.renameForm.selectedPlayer,
                "playerName": state.renameForm.newName
            })
        });

        const res = await req.json();

        if(res.error !== undefined) throw new Error(res.error);

        console.log(res);

        await getPlayerNames(dispatch);

        dispatch({"type": "update-rename-form", "newName": "", "selectedPlayer": -1});

    }catch(err){
        console.trace(err);
        dispatch({"type": "error", "message": err.toString()});
    }
}

function renderRenameForm(state, dispatch){

    if(state.mode !== "rename") return null;

    const bNameTaken = bNameAlreadyTaken(state, state.renameForm.newName);

    return <div className="form">
        <div className="form-row">
            <label>Target Player</label>
            <select value={state.renameForm.selectedPlayer} onChange={(e) =>{
                    dispatch({"type": "update-rename-form", "newName": state.renameForm.newName, "selectedPlayer": e.target.value});
                }}>
                <option value="-1">Please select a player</option>
                {createPlayerOptions(state)}
            </select>
        </div>
        <div className="form-row">
            <label>New Name</label>
            <input type="text" value={state.renameForm.newName} className="textbox" placeholder="new name..." onChange={(e) =>{
                dispatch({"type": "update-rename-form", "newName": e.target.value, "selectedPlayer": state.renameForm.selectedPlayer});
            }}/>
        </div>
        <div className="text-center">
            {(!bNameTaken) ? 
                <input type="button" className="submit-button" value="Rename Player" onClick={() =>{
                    renamePlayer(state, dispatch);
                }}/> 
                : 
                <div className="font-color-1">Name already taken!</div>}
        </div>
    </div>
}

export default function PlayerManager(){

    const [state, dispatch] = useReducer(reducer,{
        "mode": "rename",
        "error": null,
        "players": [],
        "renameForm": {
            "newName": "",
            "selectedPlayer": -1
        }
    });

    useEffect(() =>{

        getPlayerNames(dispatch);

    }, []);

    const tabOptions = [
        {"value": "rename", "name": "Rename Player"}
    ];
    return <>
        <Header>Player Manager</Header>
        <Tabs options={tabOptions} selectedValue={state.mode}/>
        <ErrorBox title="Error">{state.error}</ErrorBox>
        {renderRenameForm(state, dispatch)}
    </>
}