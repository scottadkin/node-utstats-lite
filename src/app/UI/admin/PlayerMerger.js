"use client"
import Header from "../Header";
import Tabs from "../Tabs";
import { useEffect, useReducer } from "react";
import ErrorBox from "../ErrorBox";
import InteractiveTable from "../InteractiveTable";
import CountryFlag from "../CountryFlag";
import { convertTimestamp, toPlaytime } from "@/app/lib/generic.mjs";

function reducer(state, action){

    switch(action.type){

        case "change-mode": {
            return {
                ...state,
                "mode": action.value
            }
        }
        case "set-history": {
            return {
                ...state,
                "history": action.data
            }
        }
        case "error": {
            return {
                ...state,
                "error": action.message
            }
        }
        case "update-history-form": {

            const historyForm = JSON.parse(JSON.stringify(state.historyForm));

            historyForm[action.key] = action.value; 

            return {
                ...state,
                "historyForm": historyForm
            }
        }
    }

    return state;
}

async function loadData(dispatch){

    try{

        const req = await fetch("/api/admin?mode=get-all-player-history");
        const res = await req.json();

        if(res.error !== undefined) throw new Error(res.error);

        dispatch({"type": "set-history", "data": res.history});

    }catch(err){
      
        dispatch({"type": "error", "message": err.toString()});
    }
}

function renderHistoryTable(state, dispatch){

    if(state.mode !== "history") return;

    const headers = {
        "name": {"title": "Name"},
        "hwid": {"title": "HWID"},
        "mac1": {"title": "MAC1"},
        "mac2": {"title": "MAC2"},
        "first": {"title": "First Seen"},
        "last": {"title": "Last Seen"},
        "playtime": {"title": "Playtime"},
    };

    const username = state.historyForm.username.toLowerCase();
    const hwid = state.historyForm.hwid;
    const mac1 = state.historyForm.mac1;
    const mac2 = state.historyForm.mac2;


    const rows = [];

    for(let i = 0; i < state.history.length; i++){

        const h = state.history[i];

       // if(h.name.toLowerCase() !== username) continue;
       
        const name = h.name.toLowerCase();

        if(name.indexOf(username) === -1) continue;
        if(h.hwid.indexOf(hwid) === -1) continue;
        if(h.mac1.indexOf(mac1) === -1) continue;
        if(h.mac2.indexOf(mac2) === -1) continue;

        rows.push({
            "name": {
                "value": h.name.toLowerCase(), 
                "displayValue": <><CountryFlag code={h.country}/>{h.name}</>,
                "className": "text-left",
                "onClick": () =>{
                    dispatch({"type": "update-history-form", "key": "username", "value": h.name});
                }
            },
            "hwid": {
                "value": h.hwid, 
                "className": "font-small",
                "onClick": () =>{
                    dispatch({"type": "update-history-form", "key": "hwid", "value": h.hwid});
                }
            },
            "mac1": {
                "value": h.mac1, 
                "className": "font-small",
                "onClick": () =>{
                    dispatch({"type": "update-history-form", "key": "mac1", "value": h.mac1});
                }
            },
            "mac2": {
                "value": h.mac2, 
                "className": "font-small",
                "onClick": () =>{
                    dispatch({"type": "update-history-form", "key": "mac2", "value": h.mac2});
                }
            },
            "first": {
                "value": h.first_match, 
                "displayValue": convertTimestamp(Math.floor(new Date(h.first_match) * 0.001), true, true),
                "className": "date"
            },
            "last": {
                "value": h.last_match, 
                "displayValue": convertTimestamp(Math.floor(new Date(h.last_match) * 0.001), true, true),
                "className": "date"
            },
            "playtime": {
                "value": h.playtime,
                "displayValue": toPlaytime(h.playtime),
                "className": "font-small"
            }
        });
    }

    return <>
        <div className="info">
            The data displayed below is taken from the player match table.<br/>
            Use the form below to filter results.
        </div>
        <div className="form">
            <div className="form-row">
                <label>Name</label>
                <input type="text" className="textbox" name="name" placeholder="Username..."
                    value={state.historyForm.username}
                    onChange={(e) =>{
                        dispatch({"type": "update-history-form", "key": "username", "value": e.target.value});
                    }}
                />
            </div>
            <div className="form-row">
                <label>HWID</label>
                <input type="text" className="textbox" name="hwid" placeholder="HWID..."     
                    value={state.historyForm.hwid}
                    onChange={(e) =>{
                        dispatch({"type": "update-history-form", "key": "hwid", "value": e.target.value});
                    }}
                />
            </div>
            <div className="form-row">
                <label>MAC1</label>
                <input type="text" className="textbox" name="mac1" placeholder="MAC1..."
                    value={state.historyForm.mac1}
                    onChange={(e) =>{
                        dispatch({"type": "update-history-form", "key": "mac1", "value": e.target.value});
                    }}
                />
            </div>
            <div className="form-row">
                <label>MAC2</label>
                <input type="text" className="textbox" name="mac2" placeholder="MAC2..."
                    value={state.historyForm.mac2}
                    onChange={(e) =>{
                        dispatch({"type": "update-history-form", "key": "mac2", "value": e.target.value});
                    }}
                 />
            </div>
        </div>
        <InteractiveTable width={1} headers={headers} rows={rows}/>
    </>
}

export default function PlayerMerger(){

    const [state, dispatch] = useReducer(reducer, {
        "mode": "history",
        "history": [],
        "error": null,
        "historyForm":{
            "username": "",
            "hwid": "",
            "mac1": "",
            "mac2": ""
        }
    });

    const tabOptions = [
        { "name": "Player History", "value": "history"},
        { "name": "Merge By HWID", "value": "hwid"}
    ];

    useEffect(() =>{

        loadData(dispatch);

    }, []);

    return <>
        <Header>Player Merger</Header>
        <Tabs options={tabOptions} selectedValue={state.mode} changeSelected={(value) =>{
            dispatch({"type": "change-mode", "value": value});
        }}/>
        <ErrorBox title="Error">{state.error}</ErrorBox>
        {renderHistoryTable(state, dispatch)}
    </>
}