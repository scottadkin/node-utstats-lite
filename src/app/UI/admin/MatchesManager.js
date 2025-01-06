import Header from "../Header";
import { useReducer, useEffect } from "react";
import InteractiveTable from "../InteractiveTable";
import { convertTimestamp, toPlaytime, MMSS } from "@/app/lib/generic.mjs";
import MatchScoreBox from "../MatchScoreBox";
import Link from "next/link";

function reducer(state, action){

    switch(action.type){

        case "set-matches": {
            return {
                ...state,
                "matches": action.matches
            }
        }
    }
    return state;
}

async function loadData(dispatch, page){

    try{

        const req = await fetch(`./api/admin?mode=get-match-list&page=${page}&perPage=25`);

        const res = await req.json();

        if(res.error !== undefined){
            throw new Error(res.error);
        }

        dispatch({"type": "set-matches", "matches": res.matches});

        console.log(res);
    }catch(err){
        console.trace(err);
    }
}


function renderBasicTable(state){

    const headers = {
        "map": {"title": "Map"},
        "date": {"title": "Date"},
        "players": {"title": "Players"},
        "playtime": {"title": "Playtime"},
        "result": {"title": "Result"},
        "action": {"title": "Action"},
    };

    const rows = state.matches.map((m) =>{

        const url = `/match/${m.id}`;

        return {
            "date": {"value": m.date, "displayValue": convertTimestamp(new Date(m.date), true, false, true), "className": "date"},
            "map": {"value": m.mapName.toLowerCase(), "displayValue": <Link href={url} target="_blank">{m.mapName}</Link>, "className": "font-small"},
            "players": {"value": m.players, "className": "font-small"},
            "playtime": {"value": m.playtime, "displayValue": MMSS(m.playtime), "className": "date"},
            "result": {"bIgnoreTD": true, "value": "", "displayValue": <MatchScoreBox  key={m.id} data={m} small={true} bTableElem={true}/>},
            "action": {"value": null, "displayValue": <td className="hover team-red font-small" key={`${m.id}_delete`}>Delete Match</td>, "bIgnoreTD":  true},
        };
    });

    return <InteractiveTable width={1} headers={headers} rows={rows} bNoHeaderSorting={true} sortBy={"date"} order="DESC"/>
}

export default function MatchesManager({}){

    const [state, dispatch] = useReducer(reducer, {
        "page": 1, 
        "selectedMap": -1,
        "selectedGametype": -1,
        "selectedServer": -1,
        "matches": []
    });

    useEffect(() =>{
        loadData(dispatch, state.page);
    },[state.page]);

    return <>
        <Header>Matches Manager</Header>
        <div className="form">
            <div className="form-row">
                <label>Map</label>
                <select>
                    <option value="-1">Any</option>
                </select>
            </div>
            <div className="form-row">
                <label>Gametype</label>
                <select>
                    <option value="-1">Any</option>
                </select>
            </div>
            <div className="form-row">
                <label>Server</label>
                <select>
                    <option value="-1">Any</option>
                </select>
            </div>
        </div>
        {renderBasicTable(state)}
    </>
}