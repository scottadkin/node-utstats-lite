"use client"
import Header from "../Header";
import Tabs from "../Tabs";
import {useEffect, useReducer } from "react";
import WarningBox from "../WarningBox";
import TrueFalseButton from "../TrueFalseButton";
import ErrorBox from "../ErrorBox";

function reducer(state, action){

    switch(action.type){
        case "change-mode": {
            return {
                ...state,
                "mode": action.mode
            }
        }
        case "load-settings": {

            return {
                ...state,
                "settings": action.settings,
                "savedSettings": action.settings
            }
        }
        case "update-settings": {

            const s = JSON.parse(JSON.stringify(state.settings));

            if(s[action.category] === undefined) throw new Error(`Setting category doesn't exist.`);
            if(s[action.category][action.key] === undefined) throw new Error("Setting does not exist!");

            s[action.category][action.key].value = action.value;
            
            return {
                ...state,
                "settings": {...s}
            }
        }
        case "set-map-recalc": {
            return {
                ...state,
                "bMapRecalcInProgress": action.value
            }
        }
        case "set-error": {
            return {
                ...state,
                "error": action.value
            }
        }
    }

    return state;
}


function getChangesSettings(state){

    const saved = state.savedSettings;
    const current = state.settings;

    const changed = {
        "totalChanges": 0
    };

    for(const [category, settings] of Object.entries(saved)){

        for(const [setting, data] of Object.entries(settings)){

            if(current[category][setting].value !== data.value){

                if(changed[category] === undefined){
                    changed[category] = {};
                }

                changed[category][setting] = current[category][setting];
                changed.totalChanges++;
            }
        }   
    }

    return changed;
}


async function saveChanges(changes, dispatch){

    try{


        const req = await fetch("./api/ctfLeague", {
            "headers": {"Content-type": "application/json"},
            "method": "POST",
            "body": JSON.stringify({
                "mode": "save-settings",
                "changes": changes
            })
        });

        const res = await req.json();

        if(res.error !== undefined) throw new Error(res.error);

        await loadSettings(dispatch);


    }catch(err){
        console.trace(err);
    }
}


async function recalcTables(state, dispatch){

    try{
        dispatch({"type": "set-map-recalc", "value": true});

        const req = await fetch(`./api/admin?mode=recalculate-player-ctf-league&cat=${state.mode}`);

        const res = await req.json();

        if(res.error !== undefined) throw new Error(res.error);

        dispatch({"type": "set-map-recalc", "value": false});

    }catch(err){
        console.trace(err);
        dispatch({"type": "set-error", "value": err.toString()});
    }
}

function renderRecalculate(state, dispatch){

    let button = <div className="info">Recalculating in progress....<br/>You can leave this area while the data is being processed.</div>;

    if(!state.bMapRecalcInProgress){
        button = <div className="text-center p-bottom-1">
            <button className="submit-button" onClick={() =>{
                recalcTables(state, dispatch);
            }}>Recalculate Tables</button>
        </div>;
    }

    let title = "";

    if(state.mode === "maps"){
        title = "Map";
    }else if(state.mode === "gametypes"){
        title = "Gametype";
    }

    return <>
        <Header>Recalculate {title} Leagues</Header>
        <div className="info">
            Recalculate all player {title.toLowerCase()} CTF league tables, it is recommended to do this after modifying {title.toLowerCase()} league settings.
            
        </div>
        {button}
    </>
}


function renderOptions(state, dispatch){


    const targetCategory = state.mode;

    const rows = [];

    if(state.settings[targetCategory] === undefined){
        return null;
    }

    for(const [key, value] of Object.entries(state.settings[targetCategory])){

        let elem = null;

        if(value.type === "integer"){

            elem = <td><input className="textbox" type="number" value={value.value} onChange={(e) =>{
                dispatch({"type": "update-settings","dataType": "integer", "category": targetCategory, "key": key, "value": e.target.value});
            }}/></td>;

        }else if(value.type === "bool"){

            elem = <TrueFalseButton bTableElem={true} value={value.value} setValue={() =>{  
                dispatch({"type": "update-settings", "dataType": "bool", "category": targetCategory, "key": key, "value":!value.value});
            }}/>;

        }else if(value.type === "datetime"){

            elem = <td>{value.value}</td>
        }

        rows.push(<tr key={rows.length}>
            <td className="text-left">{key}</td>
            {elem}
        </tr>);
    }

    if(rows.length === 0) return null;

    let warn = null;

    const changes = getChangesSettings(state);

    if(changes.totalChanges > 0){
        warn = <WarningBox>
            You have unsaved changes!<br/>
            <button className="submit-button" onClick={() =>{
                saveChanges(changes, dispatch);
            }}>Save Changes</button>
        </WarningBox>
    }
    return <>
        {warn}
        <div className="info">
            <ul>
                <li>Maximum matches per player refers to the maximum number of matches that can be counted towards a league table.
                If a player is over the maximum number of matches only their latest games are counted towards the league table.</li>
                <li>Maximum match age is the limit of how old a match is compared to the current date, if you set it to 90 only matches 
                    that where in the previous 90 days will count towards the league table.
                </li>
                <li>Update Whole League End Of Import will refresh all league tables at the end of the import process when the last refresh was more than 24 hours ago.</li>
            </ul>
        </div>
        <table className="t-width-3">
            <tbody>
                <tr>
                    <th>Setting</th>
                    <th>Value</th>
                </tr>
                {rows}
            </tbody>
        </table>
        {renderRecalculate(state, dispatch)}
    </>
}

async function loadSettings(dispatch){

    try{

        const req = await fetch("./api/ctfLeague?mode=get-settings");

        const res = await req.json();

        if(res.error !== undefined) throw new Error(res.error.message);

        dispatch({"type": "load-settings", "settings": res});

    }catch(err){
        console.trace(err);
    }
}

export default function CTFLeague({}){

    const [state, dispatch] = useReducer(reducer, {
        "mode": "maps",
        "settings": {},
        "savedSettings": {},
        "bMapRecalcInProgress": false,
        "error": null
    });

    useEffect(() =>{
        loadSettings(dispatch);
    },[]);

    const tabOptions = [
        {"name": "Maps", "value": "maps"},
        {"name": "Gametypes", "value": "gametypes"},
    ];

    return <>
        <Header>CTF League</Header>
        <Tabs options={tabOptions} selectedValue={state.mode} changeSelected={(value) =>{
            dispatch({"type": "change-mode", "mode": value});
        }}/>
        {(state.error !== null) ? <ErrorBox title="Error">{state.error}</ErrorBox> : null}
        {renderOptions(state, dispatch)}
        
    </>
}