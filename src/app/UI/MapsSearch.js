"use client"
import MapRichBoxes from "../UI/MapRichBoxes";
import { useReducer } from "react";
import InteractiveTable from "./InteractiveTable";
import { convertTimestamp, toPlaytime } from "../lib/generic.mjs";
import Link from "next/link";


function reducer(state, action){

    switch(action.type){
        case "load": {
            return {
                ...state
            }
        }
        case "update-name": {
            return {
                ...state,
                "name": action.value
            }
        }
        case "change-display": {
            return {
                ...state,
                "displayType": action.value
            }
        }
    }

    return state;
}

function filterMaps(maps, name){

    const matches = [];

    const reg = new RegExp(`${name}`,"i");

    for(let i = 0; i < maps.length; i++){

        const m = maps[i];

        if(reg.test(m.name)) matches.push(m);
    }


    return matches;
}


function renderBasicTable(maps){

    const headers = {
        "name": {"title": "Name"},
        "first": {"title": "First"},
        "last": {"title": "Last"},
        "matches": {"title": "Matches"},
        "playtime": {"title": "Playtime"},
    };

    const totals = {
        "first": null,
        "last": null,
        "matches": 0,
        "playtime": 0
    };

    const rows = maps.map((m) =>{

        const url = `/map/${m.id}`;

        if(totals.first === null || m.first_match < totals.first) totals.first = m.first_match;
        if(totals.last === null || m.last_match > totals.last) totals.last = m.last_match;
        totals.matches += m.matches;
        totals.playtime += m.playtime;

        return {
            "name": {"value": m.name.toLowerCase(), "displayValue": <Link href={url}>{m.name}</Link>},
            "first": {"value": m.first_match, "displayValue": <Link href={url}>{convertTimestamp(new Date(m.first_match), true, false, true)}</Link>, "className": "date"},
            "last": {"value": m.last_match, "displayValue": <Link href={url}>{convertTimestamp(new Date(m.last_match), true, false, true)}</Link>, "className": "date"},
            "matches": {"value": m.matches, "displayValue": <Link href={url}>{m.matches}</Link>},
            "playtime": {"value": m.playtime, "displayValue": <Link href={url}>{toPlaytime(m.playtime)}</Link>, "className": "date"},
        }
    });

    if(rows.length > 0){

        rows.push({
            "bAlwaysLast": true,
            "name": {"value": "Totals", "className": "team-none"},
            "first": {"value": totals.first, "displayValue": convertTimestamp(new Date(totals.first), true, false, true), "className": "date team-none"},
            "last": {"value": totals.last, "displayValue": convertTimestamp(new Date(totals.last), true, false, true), "className": "date team-none"},
            "matches": {"value": totals.matches, "displayValue":totals.matches, "className": "team-none"},
            "playtime": {"value": totals.playtime, "displayValue": toPlaytime(totals.playtime), "className": "date team-none"},
        });
    }

    return <InteractiveTable width={1} headers={headers} rows={rows}/>
}

function renderData(filteredMaps, images, displayType){


    if(displayType === "table"){

        return renderBasicTable(filteredMaps);
    }

    return <div className="rich-outter">
        <MapRichBoxes data={filteredMaps} images={images}/>
    </div> 

}

export default function MapsSearch({maps, images, search}){

    //console.log(maps);
    const [state, dispatch] = useReducer(reducer, {
        "name": search,
        "displayType": "default"
    });

    const filteredMaps = filterMaps(maps, state.name);

    return <>
        <div className="form-row">
            <label>Search</label>
            <input type="text" className="textbox" placeholder="Search for a map..." value={state.name} onChange={(e) =>{
                dispatch({"type": "update-name", "value": e.target.value});
            }}/>
        </div>
        <div className="form-row">
            <label>Display Type</label>
            <select onChange={(e) =>{
                dispatch({"type": "change-display", "value": e.target.value});
            }}>
                <option value="default">Default</option>
                <option value="table">Table</option>
            </select>
        </div>
        {renderData(filteredMaps, images, state.displayType)}
    </>
}