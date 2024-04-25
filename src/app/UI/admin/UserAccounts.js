"use client"
import Header from "../Header";
import { useEffect, useReducer } from "react";
import ErrorBox from "../ErrorBox";
import InteractiveTable from "../InteractiveTable";
import TrueFalseButton from "../TrueFalseButton";
import Tabs from "../Tabs";

async function loadData(dispatch, controller){

    try{

        const req = await fetch("/api/admin",{
            "headers": {"Content-type": "application/json"},
            "signal": controller.signal,
            "method": "POST",
            "body": JSON.stringify({"mode": "get-users"})
        });

        const res = await req.json();

        if(res.error !== undefined) throw new Error(res.error);

        dispatch({"type": "loaded", "data": res.data});

    }catch(err){
        console.trace(err);
        console.log(err.name);

        if(err.name === "AbortError") return;

        dispatch({"type": "error", "message": err.toString()});
    }
}




function renderUserList(state){

    if(state.mode !== "0") return null;

    const headers = {
        "name": {"title": "Name"},
        "activated": {"title": "Account Enabled", "bIgnoreTD": true}
    };

    const rows = state.users.map((d) =>{
        return {
            "name": {"value": d.name.toLowerCase(), "displayValue": d.name},
            "activated": {
                "value": d.activated, 
                "displayValue": <TrueFalseButton value={d.activated} />
            }
        }
    });

    return <InteractiveTable headers={headers} rows={rows} width={3}/>
}

function getUser(state, targetId){

    targetId = parseInt(targetId);

    for(let i = 0; i < state.users.length; i++){

        const u = state.users[i];
        if(u.id === targetId) return u;
    }

    return null;
}


function renderEditUser(state, dispatch){

    if(state.mode !== "1") return null;
    
    return <div className="form">
        <div className="form-row">
            <label htmlFor="user">User</label>
            <select name="user" value={state.editForm.selectedId} onChange={(e) =>{

                    const user = getUser(state, e.target.value);
 
                    const currentActivated = (user !== null) ? user.activated : 0;
                    //set the activated value to what is the correct value for the user that is selected
                    dispatch({"type": "set-edit-id", "id": e.target.value, "activated": currentActivated});
                }}>
                <option value="-1">Please select a user</option>

                {state.users.map((u) =>{
                    return <option key={u.id} value={u.id}>{u.name}</option>
                })}

            </select>
        </div>
        <div className="form-row">
            <label htmlFor="active">Enable Account</label>
            <TrueFalseButton value={state.editForm.enabledAccount} setValue={() =>{

                let currentValue = state.editForm.enabledAccount;
                let newValue = 0;

                if(currentValue === 0){
                    newValue = 1;
                }

                dispatch({"type": "set-edit-enabled", "value": newValue});
            }}/>
        </div>
        <div className="text-center">
            <input type="button" className="submit-button" value="Apply Changes" onClick={() =>{
                dispatch();
            }}/>
        </div>
    </div>
}

function reducer(state, action){

    switch(action.type){
        case "loaded": {
            return {
                ...state,
                "users": action.data
            }
        }
        case "error": {
            return {
                ...state,
                "error": action.message
            }
        }
        case "change-mode": {
            return {
                ...state,
                "mode": action.value
            }
        }
        case "set-edit-id": {
            return {
                ...state,
                "editForm": {
                    ...state.editForm,
                    "selectedId": action.id,
                    "enabledAccount": action.activated
                }
            }
        }
        case "set-edit-enabled": {
            return {
                ...state,
                "editForm": {
                    ...state.editForm,
                    "enabledAccount": action.value
                }
            }
        }
    }

    return state;
}

export default function UserAccounts(){

    const [state, dispatch] = useReducer(reducer, {
        "mode": "1",
        "users": [],
        "error": null,
        "bActionInProgress": false,
        "editForm": {
            "selectedId": -1,
            "enableAccount": false
        }
    });

    useEffect(()=>{

        const controller = new AbortController();

        loadData(dispatch, controller);

        return () =>{
            controller.abort();
        }
    },[]);

    const tabOptions = [
        {"name": "User List", "value": "0"},
        {"name": "Edit User", "value": "1"}
    ];

    return <>
        <Header>User Accounts</Header>
        <Tabs options={tabOptions} selectedValue={state.mode} changeSelected={(value) =>{
            dispatch({"type": "change-mode", "value": value});
        }}/>
        <ErrorBox title="Error">{state.error}</ErrorBox>
        {renderUserList(state)}
        {renderEditUser(state, dispatch)}
    </>
}