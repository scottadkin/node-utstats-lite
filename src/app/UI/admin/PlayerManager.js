"use client"
import { useEffect, useReducer } from "react";
import { notificationReducer, initialNotificationState } from "../../reducers/notificationReducer";
import Header from "../Header";
import Tabs from "../Tabs";
import { plural } from "@/app/lib/generic.mjs";
import NotificationCluster from "../NotificationCluster";
import Loading from "../Loading";


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
        case "update-delete-form": {
            return {
                ...state,
                "deleteForm": {
                    "selectedPlayer": action.selectedPlayer
                }
            }
        }
        case "change-mode": {
            return {
                ...state,
                "mode": action.value,
                "message": null,
                "error": null
            }
        }
        case "message": {
            return {
                ...state,
                "message": action.message
            }
        }
        case "set-recalc-status": {
            return {
                ...state,
                "bRecalculatingTotals": action.value
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


async function renamePlayer(state, dispatch, nDispatch){

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


        await getPlayerNames(dispatch);
        nDispatch({"type": "add", "content": {"type": "pass", "message": `Player rename successful`}});
        dispatch({"type": "update-rename-form", "newName": "", "selectedPlayer": -1});

    }catch(err){
        console.trace(err);
        nDispatch({"type": "add", "content": {"type": "error", "message": err.toString()}});
    }
}

function renderRenameForm(state, dispatch, nDispatch){

    if(state.mode !== "rename") return null;

    const bNameTaken = bNameAlreadyTaken(state, state.renameForm.newName);

    return <>
        <Header>Rename Player</Header>
        <div className="form">
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
                        renamePlayer(state, dispatch, nDispatch);
                    }}/> 
                    : 
                    <div className="font-color-1">Name already taken!</div>}
            </div>
        </div>
    </>
}


async function deletePlayer(state, dispatch, nDispatch){

    try{

        const req = await fetch("/api/admin", {
            "headers": {"Content-type": "application/json"},
            "method": "POST",
            "body": JSON.stringify({"mode": "delete-player", "playerId": state.deleteForm.selectedPlayer})
        });

        const res = await req.json();


        if(res.error !== undefined) throw new Error(res.error);

        nDispatch({"type": "add", "content": {"type": "pass", "message": `Deleted ${res.rowsDeleted} ${plural(res.rowsDeleted, "row")}`}});
        dispatch({"type": "set-delete-form", "selectedPlayer": -1});
        await getPlayerNames(dispatch);

    }catch(err){
        console.trace(err);
        nDispatch({"type": "add", "content": {"type": "error", "message": err.toString()}});
    }
}


async function recaclTotals(state, dispatch, nDispatch){


    try{


        dispatch({"type": "set-recalc-status", "value": true});

        const req = await fetch("/api/admin?mode=recalculate-totals");

        const res = await req.json();

        if(res.error !== undefined) throw new Error(res.error);


        if(res.message === "done"){
            nDispatch({"type": "add", "content": {"type": "pass", "message": `Recalculated player totals.`}});
            dispatch({"type": "set-recalc-status", "value": false});
        }

        

    }catch(err){
        console.trace(err);
        nDispatch({"type": "add", "content": {"type": "error", "message": err.toString()}});
        dispatch({"type": "set-recalc-status", "value": false});
    }

    
}

function renderDeletePlayer(state, dispatch, nDispatch){

    if(state.mode !== "delete") return null;

    let buttonElem = null;

    if(state.deleteForm.selectedPlayer !== -1){

        buttonElem = <div className="text-center">     
            <input type="button" className="submit-button" value="Delete Player" onClick={() =>{  
                deletePlayer(state, dispatch, nDispatch);
            }}/>
        </div>
    }

    return <>
        <Header>Delete Player</Header>
        <div className="form">
        <div className="form-row">
            <label>Target Player</label>
            <select value={state.deleteForm.selectedPlayer} onChange={(e) =>{         
                    dispatch({"type": "update-delete-form", "selectedPlayer": e.target.value});
                }}>
                <option value="-1">Please select a player</option>
                {createPlayerOptions(state)}
            </select>
        </div>

        {buttonElem}
    </div>
    </>
}

function renderRecalculateTotals(state, dispatch, nDispatch){
    
    if(state.mode !== "recalc-totals") return null;

    return <>
        <Header>Recalculate Player Totals</Header>
        <div className="info">
            Recalculate all player totals from existing match data.
        </div>
        <Loading value={state.bRecalculatingTotals}>Recalculating Please Wait...</Loading>
        <div className={`text-center ${(state.bRecalculatingTotals) ? "hidden" : ""}`}>
            <input type="button" className="submit-button" value="Recalculate Totals" onClick={() =>{
                recaclTotals(state, dispatch, nDispatch);
            }}/>
        </div>
    </>
}

export default function PlayerManager(){

    const [state, dispatch] = useReducer(reducer,{
        "mode": "recalc-totals",
        "error": "null",
        "message": "null",
        "players": [],
        "renameForm": {
            "newName": "",
            "selectedPlayer": -1
        },
        "deleteForm": {
            "selectedPlayer": -1
        },
        "bRecalculatingTotals": false
    });

    const [nState, nDispatch] = useReducer(notificationReducer, initialNotificationState);

    useEffect(() =>{

        getPlayerNames(dispatch);

    }, []);

    const tabOptions = [
        {"value": "rename", "name": "Rename Player"},
        {"value": "delete", "name": "Delete Player"},
        {"value": "recalc-totals", "name": "Recalculate Totals"},
    ];
    return <>
        <Header>Player Manager</Header>
        <Tabs options={tabOptions} selectedValue={state.mode} changeSelected={(value) =>{
            console.log(value);
            dispatch({"type": "change-mode", "value": value});
        }}/>
        <NotificationCluster state={nState} dispatch={nDispatch}/>
        {renderRenameForm(state, dispatch, nDispatch)}
        {renderDeletePlayer(state, dispatch, nDispatch)}
        {renderRecalculateTotals(state, dispatch, nDispatch)}
    </>
}