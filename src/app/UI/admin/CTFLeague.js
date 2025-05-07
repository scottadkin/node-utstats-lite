"use client"
import Header from "../Header";
import Tabs from "../Tabs";
import {useEffect, useReducer } from "react";
import WarningBox from "../WarningBox";
import TrueFalseButton from "../TrueFalseButton";

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

            if(s[action.key] === undefined) throw new Error("Setting does not exist!");

            s[action.key].value = action.value;
            
            return {
                ...state,
                "settings": {...s}
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

    for(const [key, setting] of Object.entries(saved)){

        if(setting.value !== current[key].value){
            
            if(changed[setting.category] === undefined){
                changed[setting.category] = {};
            }

            changed[setting.category][key] = current[key];
            changed.totalChanges++;
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

function renderMapOptions(state, dispatch){

    if(state.mode !== "map") return null;

    const rows = [];

    for(const [key, value] of Object.entries(state.settings)){

        if(value.category !== "maps") continue;
        let elem = null;

        if(value.type === "integer"){

            elem = <td><input className="textbox" type="number" defaultValue={value.value} onChange={(e) =>{
                dispatch({"type": "update-settings","dataType": "integer", "category": value.category, "key": key, "value": e.target.value});
            }}/></td>;

        }else if(value.type === "bool"){

            elem = <TrueFalseButton bTableElem={true} value={value.value} setValue={() =>{  

                dispatch({"type": "update-settings", "dataType": "bool", "category": value.category, "key": key, "value":!value.value});
            }}/>;
        }

        rows.push(<tr key={rows.length}>
            <td className="text-left">{key}</td>
            {elem}
        </tr>);
    }

    if(rows.length === 0) return null;

    let warn = null;

    const changes = getChangesSettings(state)

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
                    that where in the previous 90 days will count towards the league table.</li>
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
    </>
}

async function loadSettings(dispatch){

    try{

        const req = await fetch("./api/ctfLeague?mode=get-settings");

        const res = await req.json();

        if(res.error !== undefined) throw new Error(res.error.message);

        dispatch({"type": "load-settings", "settings": res});

        console.log(res);
    }catch(err){
        console.trace(err);
    }
}

export default function CTFLeague({}){

    const [state, dispatch] = useReducer(reducer, {
        "mode": "map",
        "settings": {},
        "savedSettings": {}
    });

    useEffect(() =>{
        loadSettings(dispatch);
    },[]);

    const tabOptions = [
        {"name": "Maps", "value": "map"}
    ];

    return <>
        <Header>CTF League</Header>
        <Tabs options={tabOptions} selectedValue={state.mode} changeSelected={(value) =>{
            dispatch({"type": "change-mode", "mode": value});
        }}/>
        {renderMapOptions(state, dispatch)}
    </>
}