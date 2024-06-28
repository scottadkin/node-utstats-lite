"use client"
import Header from "../Header";
import TrueFalseButton from "../TrueFalseButton";
import { useReducer } from "react";
import Loading from "../Loading";
import ErrorBox from "../ErrorBox";
import MessageBox from "../MessageBox";

function reducer(state, action){

    switch(action.type){

        case "toggle-check": {

            const data = {...state};

            const currentValue = data[`check${action.id}`];

            let newValue = (currentValue === 0) ? 1 : 0;

            data[`check${action.id}`] = newValue;
            
            return {
                ...data      
            }
        }
        case "set-loading": {
            return {
                ...state,
                "bLoading": action.value
            }
        }
        case "set-error": {
            return {
                ...state,
                "error": action.value
            }
        }
        case "set-message": {
            return {
                ...state,
                "message": action.value
            }
        }

        case "reset-all-checks": {
            return {
                ...state,
                "check1": 0,
                "check2": 0,
                "check3": 0,
                "check4": 0,
                "check5": 0
            }
        }
    }

    return state;
}

async function deleteData(dispatch){

    try{


        dispatch({"type": "set-loading", "value": true});
        dispatch({"type": "set-error", "value": null});
        dispatch({"type": "set-message", "value": null});

        const req = await fetch("/api/admin", {
            "headers": {"Content-type": "application/json"},
            "method": "POST",
            "body": JSON.stringify({"mode": "clear-tables"})
        });


        const res = await req.json();

        if(res.error !== undefined){
            dispatch({"type": "set-error", "value":  res.error});
        }else{
            dispatch({"type": "reset-all-checks"});
            dispatch({"type": "set-message", "value": `Tables cleared`});
        }

        dispatch({"type": "set-loading", "value": false});

    }catch(err){
        console.trace(err);
    }
}

function renderButton(state, dispatch){

    if(state.bLoading){

        return <Loading value={state.bLoading}>Deleting data please wait...</Loading>
    }

    for(let i = 1; i < 6; i++){

        if(state[`check${i}`] === 0){
            return null;
        }
    }

    return <div className="text-center">
        <input type="button" className="submit-button" value="Clear Tables" onClick={() =>{
            deleteData(dispatch);
        }}/>
    </div>

}

export default function ClearDatabase(){

    const [state, dispatch] = useReducer(reducer, {
        "check1": 0,
        "check2": 0,
        "check3": 0,
        "check4": 0,
        "check5": 0,
        "bLoading": false,
        "error": null,
        "message": null
    });

    return <>
        <Header>Clear Database Tables</Header>
        <div className="info">
            Clear all data tables, this will not delete site settings, ftp settings, importer settings, users, sessions.
        </div>
        <div className="form-row">
            <label>Do you want to clear all data tables.</label>
            <TrueFalseButton value={state.check1} setValue={() =>{
                dispatch({"type": "toggle-check", "id": 1});
            }}/>
        </div>
        
        <div className="form-row">
            <label>Are you sure?</label>
            <TrueFalseButton value={state.check2} setValue={() =>{
                dispatch({"type": "toggle-check", "id": 2});
            }}/>
        </div>

        <div className="form-row">
            <label>Are you sure?</label>
            <TrueFalseButton value={state.check3} setValue={() =>{
                dispatch({"type": "toggle-check", "id": 3});
            }}/>
        </div>

        <div className="form-row">
            <label>Are you sure?</label>
            <TrueFalseButton value={state.check4} setValue={() =>{
                dispatch({"type": "toggle-check", "id": 4});
            }}/>
        </div>

        <div className="form-row">
            <label>One last time, are you sure?</label>
            <TrueFalseButton value={state.check5} setValue={() =>{
                dispatch({"type": "toggle-check", "id": 5});
            }}/>
        </div>

        <ErrorBox title="Failed to empty database tables">{state.error}</ErrorBox>
        <MessageBox title="Tables cleared successfully">{state.message}</MessageBox>
        {renderButton(state, dispatch)}
    </>
}