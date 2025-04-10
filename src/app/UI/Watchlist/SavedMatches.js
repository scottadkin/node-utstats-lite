"use client"
import Header from "../Header";
import { useEffect, useReducer, useState } from "react";
import InteractiveTable from "../InteractiveTable";
import { convertTimestamp, MMSS, toPlaytime } from "@/app/lib/generic.mjs";
import MatchScoreBox from "../MatchScoreBox";
import Link from "next/link";

function reducer(state, action){


    switch(action.type){
        case "set-total-matches": {
            return {
                ...state,
                "totalMatches": action.value
            }
        }
        case "set-matches-data": {

            return {
                ...state,
                "matchesData": action.data,
                "missingMatches": action.missingMatches
            }
        }
    }

    return state;
}

function bMatchExists(targetHash, matches){

    for(let i = 0; i < matches.length; i++){
        if(matches[i].hash === targetHash) return true;
    }
    return false;
}

async function loadMatches(dispatch){

    try{

        const matches = localStorage.getItem("saved-matches");

        if(matches === null) throw new Error(`Saved matches is null`);

        const hashes = JSON.parse(matches);

        const req = await fetch("/api/matches/", {
            "headers": {"Content-type": "application/json"},
            "method": "POST",
            "body": JSON.stringify({"mode": "get-matches-by-hashes", "hashes": hashes})
        });

        const res = await req.json();

        if(res.error !== undefined){
            throw new Error(res.error);
        }


        let missingMatches = 0;
        
        for(let i = 0; i < hashes.length; i++){
            if(!bMatchExists(hashes[i], res)) missingMatches++;
        }


        dispatch({"type": "set-matches-data", "data": res, "missingMatches": missingMatches});


    }catch(err){
        console.trace(err);
    }
}

function getMatchDataByHash(state, hash){

    for(let i = 0; i < state.matchesData.length; i++){

        const m = state.matchesData[i];
        if(m.hash === hash) return m;
    }

    return null;
}


function removeFromFavourites(matches, removeHash){


    const index = matches.indexOf(removeHash);

    if(index === -1){
        console.log(`Match is not in favourites`);
        return;
    }

    matches.splice(index, 1);
    if(matches.length === 0) matches = [];

    localStorage.setItem("saved-matches", JSON.stringify(matches));

}



function renderTable(state, dispatch, matches){

    const headers = {
        "map": {"title": "Map"},
        "gametype": {"title": "Gametype"},
        "date": {"title": "Date"},
        "players": {"title": "Players"},
        "playtime": {"title": "Playtime"},
        "result": {"title": "Result"},
        "remove": {"title": "Remove"},
    };

    const rows = [];

    for(let i = 0; i < matches.length; i++){

        const hash = matches[i];

        const matchData = getMatchDataByHash(state, hash);

        if(matchData === null){

            rows.push({
                "map": {
                    "value": "N/A", 
                    "displayValue": "N/A",
                    "className": "text-left"
                },
                    
                "gametype": {"value": "", "displayValue": "N/A"},
                "date": {
                    "value": 0, 
                    "displayValue": convertTimestamp(0),
                    "className": "date"
                },
                "players": {"value": 0},
                "playtime": {"value": "N/A"},
                "result": {
                    "value": null,
                    "displayValue": <>Match Deleted</>,
                },
                "remove": {
                    "value": null,
                    "displayValue": "Remove",
                    "className": "team-red hover",
                    "onClick": () =>{
                        removeFromFavourites(matches, hash);
                        loadMatches(dispatch);
                    }
                }
            });
            continue;
        }

        const m = matchData;

        rows.push({
            "map": {
                "value": m.mapName.toLowerCase(), 
                "displayValue": <Link href={`/match/${m.hash}`} target="_blank">{m.mapName}</Link>,
                "className": "text-left"
            },
                
            "gametype": {"value": m.gametypeName.toLowerCase(), "displayValue": m.gametypeName},
            "date": {
                "value": m.date, 
                "displayValue": convertTimestamp(new Date(m.date), true, false, true),
                "className": "date"
            },
            "players": {"value": m.players},
            "playtime": {"value": m.playtime, "displayValue": MMSS(m.playtime)},
            "result": {
                "value": null,
                "displayValue": <MatchScoreBox data={m} small={true} bTableElem={false}/>,
                "bIgnoreTd": true
            },
            "remove": {
                "value": null,
                "displayValue": "Remove",
                "className": "team-red hover",
                "onClick": () =>{
                    removeFromFavourites(matches, m.hash);
                    loadMatches(dispatch);
                }
            }
        });
    }

    if(rows.length === 0){
        return <div className="form">
            <div className="form-info">
                You have no matches added to your watchlist.
            </div>
        </div>
    }

    return <InteractiveTable headers={headers} rows={rows} width={1}/>;
}

function deleteMissingMatches(state, dispatch){

    let data = localStorage.getItem("saved-matches");
    if(data === null) return;

    data = JSON.parse(data);

    const validMatches = [];

    for(let i = 0; i < data.length; i++){

        const d = data[i];
        const player = getMatchDataByHash(state, d);
        if(player === null) continue;
        validMatches.push(d);
    }

    localStorage.setItem("saved-matches", JSON.stringify(validMatches));
    dispatch({"type": "set-total-matches", "value": validMatches.length});
    loadMatches(dispatch);
}


function renderDeleteMissingMatches(state, dispatch){


    if(state.missingMatches === 0) return null;

    return <div className="form">
        <div className="form-info">
            Would you like to remove all the matches that no longer exist from your watchlist?<br/><br/>
            <button onClick={() =>{
                deleteMissingMatches(state, dispatch);
            }} className="small-button" style={{"backgroundColor": "var(--team-color-red)"}}>
                Delete
            </button>
        </div>
        
    </div>
}


export default function SavedMatches({}){

    const [matches, setMatches] = useState([]);

    const [state, dispatch] = useReducer(reducer, {
        "totalMatches": 0,
        "matchesData": [],
        "missingMatches": 0
    });

    useEffect(() =>{

        
        const data = localStorage.getItem("saved-matches");

        if(data !== null){
            try{
                setMatches(JSON.parse(data));
                dispatch({"type": "set-total-matches", "value": JSON.parse(data).length});
            }catch(err){}
        }
        loadMatches(dispatch);

    },[state.totalMatches]);


    if(matches == null) return null;

    


    return <>
        <Header>Saved Matches ({state.totalMatches})</Header>
        {renderDeleteMissingMatches(state, dispatch)}
        {renderTable(state, dispatch, matches)}
    </>
}
