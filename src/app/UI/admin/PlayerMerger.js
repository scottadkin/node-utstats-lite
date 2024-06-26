"use client"
import Header from "../Header";
import Tabs from "../Tabs";
import { useEffect, useReducer } from "react";
import ErrorBox from "../ErrorBox";
import MessageBox from "../MessageBox";
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
                "history": action.data,
                "playerNames": action.playerNames
            }
        }
        case "error": {
            return {
                ...state,
                "error": action.message
            }
        }
        case "set-message": {
            return {
                ...state,
                "message": action.message
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
        case "update-hwid-merge-form": {

            const data = JSON.parse(JSON.stringify(state.hwidMergeForm));

            data[action.key] = action.value;

            return {
                ...state,
                "hwidMergeForm": data
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

        dispatch({"type": "set-history", "data": res.history, "playerNames": res.playerNames});

    }catch(err){
      
        dispatch({"type": "error", "message": err.toString()});
    }
}


async function mergeHWIDUsage(state, dispatch){

    try{

        dispatch({"type": "set-message", "message": null});
        dispatch({"type": "error", "message": null});

        const req = await fetch("/api/admin", {
            "headers": {"Content-type": "application/json"},
            "method": "POST",
            "body": JSON.stringify({
                "mode": "merge-hwid-usage-to-player",
                "playerId": state.hwidMergeForm.selectedPlayer,
                "hwid": state.historyForm.hwid
            })
        });

        const res = await req.json();

        if(res.error) throw new Error(res.error);

        dispatch({"type": "set-message", "message": `${res.changedRows} rows updated.`});

    }catch(err){
        console.trace(err);
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
        <Header>Player History</Header>
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


function renderHWIDInfo(state){

    const headers = {
        "name": {"title": "Name"},
        "mac": {"title": "Mac Addresses"},
        "dates": {"title": "First & Last Seen"},
        "playtime": {"title": "Playtime & Matches Played"}
    };
    const rows = [];

    for(let i = 0; i < state.history.length; i++){

        const h = state.history[i];

        if(h.hwid === state.historyForm.hwid && state.historyForm.hwid !== ""){
            rows.push({
                "name": {
                    "value": h.name.toLowerCase(), 
                    "displayValue": <><CountryFlag code={h.country}/>{h.name}</>,
                    "className": "text-left"
                },
                "mac": {
                    "value": `${h.mac1}_${h.mac2}`,
                    "displayValue": <>
                        <span className="dull">MAC1:</span> {h.mac1}<br/>
                        <span className="dull">MAC2:</span> {h.mac2}
                    </>
                },
                "dates": {
                    "value": `${h.first_match}_${h.last_match}`,
                    "displayValue": <>
                        <span className="dull">First Seen:</span> {convertTimestamp(Math.floor(new Date(h.first_match) * 0.001), true)}<br/>
                        <span className="dull">Last Seen:</span> {convertTimestamp(Math.floor(new Date(h.last_match) * 0.001), true)}
                    </>
                },
                "playtime": {
                    "value": h.playtime,
                    "displayValue": <>
                        <span className="dull">Playtime:</span> {toPlaytime(h.playtime)}<br/>
                        <span className="dull">Matches:</span> {h.total_matches}
                    </>
                }
            });
        }
    }

    return <>
        <Header>HWID Usage</Header>
        <InteractiveTable width={1} headers={headers} rows={rows}/>
    </>
}

function renderHWIDMerger(state, dispatch){

    if(state.mode !== "hwid") return null;

    return <>
        <Header>Merge Player By HWID</Header>
        <div className="info">
            Merge all match data with a target HWID into a single player profile.
        </div>
        <div className="form">
            <div className="form-row">
                <label>HWID</label>
                <input type="text" 
                    className="textbox" 
                    placeholder="hwid..." 
                    value={state.historyForm.hwid}
                    onChange={(e) =>{
                        dispatch({"type": "update-history-form", "key": "hwid", "value": e.target.value});
                    }}
                />
            </div>
            <div className="form-row">
                <label>Target Profile</label>
                <select value={state.hwidMergeForm.selectedPlayer} onChange={(e) =>{
                    console.log(e.target.value);
                    dispatch({"type": "update-hwid-merge-form", "key": "selectedPlayer", "value": e.target.value});
                }}> 
                    <option value="-1" key="-1">Select a player</option>
                    {state.playerNames.map((p) =>{
                        return <option key={p.id} value={p.id}>{p.name}</option>
                    })}
                </select>
            </div>
            <div className="text-center margin-bottom-1">
                <input type="button" className="submit-button" value="Merge HWID Into Single Player Profile"
                    onClick={() =>{
                        mergeHWIDUsage(state, dispatch);
                    }}
                />
            </div>
        </div>
        {renderHWIDInfo(state)}
    </>
}

export default function PlayerMerger(){

    const [state, dispatch] = useReducer(reducer, {
        "mode": "hwid",
        "history": [],
        "error": null,
        "historyForm":{
            "username": "",
            "hwid": "",
            "mac1": "",
            "mac2": ""
        },
        "playerNames": [],
        "hwidMergeForm": {
            "selectedPlayer": -1
        },
        "message": null
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
        <MessageBox title="Merge Successful">{state.message}</MessageBox>
        {renderHistoryTable(state, dispatch)}
        {renderHWIDMerger(state, dispatch)}
    </>
}