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


function createPlayerOptions(state){

    return state.players.map((p) =>{
        return <option key={p.id} value={p.id}>{p.name}</option>
    });
}

function renderRenameForm(state){

    if(state.mode !== "rename") return null;

    return <div className="form">
        <div className="form-row">
            <label>Target Player</label>
            <select>
                <option value="-1">Please select a player</option>
                {createPlayerOptions(state)}
            </select>
        </div>
        <div className="form-row">
            <label>New Name</label>
            <input type="text" className="textbox" placeholder="new name..."/>
        </div>
        <div className="text-center">
            <input type="button" className="submit-button" value="Rename Player"/>
        </div>
    </div>
}

export default function PlayerManager(){

    const [state, dispatch] = useReducer(reducer,{
        "mode": "rename",
        "error": null,
        "players": []
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
        {renderRenameForm(state)}
    </>
}