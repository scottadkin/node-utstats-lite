"use client"
import Header from "../Header";
import { useState } from "react";
import InteractiveTable from "../InteractiveTable";
import { getOrdinal, ignore0 } from "@/app/lib/generic.mjs";

function sortByName(a, b){
    a = a.name.toLowerCase();
    b = b.name.toLowerCase();

    if(a < b) return -1;
    if(a > b) return 1;
    return 0;
}

function getGametypeMapTotalMatches(data, targetGametype, targetMap){

    let total = 0;

    if(targetGametype === null && targetMap === null){
        return data.reduce((acc, cur) =>{
            return acc += cur.total_matches;
        },0);

    }

    for(let i = 0; i < data.length; i++){

        const d = data[i];
        
        if(targetGametype !== null && targetMap !== null){
            if(d.gametype_id === targetGametype && d.map_id === targetMap){
                return d.total_matches;
            }
        }

        if(targetGametype === null){

            if(d.map_id === targetMap){
                total += d.total_matches;
                continue;
            }
        }

        if(targetMap === null){
            if(d.gametype_id === targetGametype){
                total += d.total_matches;
                continue;
            }
        }

    }


    return total;
}

function renderTabs(data, selectedGametype, selectedMap, gametypeNames, mapNames, setGametype, setMap){

    const gametypeOptions = [];

    selectedGametype = parseInt(selectedGametype);
    selectedMap = parseInt(selectedMap);

    if(selectedGametype === 0) selectedGametype = null;
    if(selectedMap === 0) selectedMap = null;

    for(const [id, name] of Object.entries(gametypeNames)){

        const total = getGametypeMapTotalMatches(data, (name !== "All") ? parseInt(id) : null, null);

        gametypeOptions.push({"name": `${name} (${total})`, "value": id});
    }

    const mapOptions = [];

    for(const [id, name] of Object.entries(mapNames)){

        const total = getGametypeMapTotalMatches(data, selectedGametype, parseInt(id));
  
        mapOptions.push({"name": `${name} (${total})`, "value": id});
    }

    gametypeOptions.sort(sortByName);
    mapOptions.sort(sortByName);

    return <>

        <div className="form-row">
            <label>Gametype</label>
            <select className="default-select" onChange={(e) =>{
                setGametype(e.target.value);
            }}>
                {gametypeOptions.map((m, i) =>{
                    return <option key={i} value={m.value}>{m.name}</option>
                })}
            </select>
        </div>

        <div className="form-row">
            <label>Map</label>
            <select className="default-select" onChange={(e) =>{
                setMap(e.target.value);
            }}>
                <option value="0">All ({getGametypeMapTotalMatches(data, (selectedGametype !== 0) ? selectedGametype : null, null)})</option>
                {mapOptions.map((m, i) =>{
                    return <option key={i} value={m.value}>{m.name}</option>
                })}
            </select>
        </div>
    </>
}

function renderEntries(data, selectedGametype, selectedMap, gametypeNames, mapNames){

    const headers = {
        "place": {"title": "Place", "mouseOverBox": {"title": "Note", "content": "Place in this table is only based by points."}},
        "gametype": {"title": "Gametype"},
        "map": {"title": "Map"},
        "played": {"title": "Played"},
        "wins": {"title": "Wins"},
        "draws": {"title": "Draws"},
        "losses": {"title": "Losses"},
        "capFor": {"title": "Caps For"},
        "capAgainst": {"title": "Caps Against"},
        "capDiff": {"title": "Cap Diff"},
        "points": {"title": "Points"}
    };
    

    const rows = [];

    for(let i = 0; i < data.length; i++){

        const d = data[i];

        if(selectedGametype !== "0" && d.gametype_id != selectedGametype) continue;
        if(selectedMap !== "0" && d.map_id != selectedMap) continue;

        const gName = gametypeNames[d.gametype_id] ?? "Not Found";
        const mName = mapNames[d.map_id] ?? "Not Found";

        let pos = d.pos;

        if(pos === 0){
            pos = 1;
        }else if(pos > 1){
            pos++;
        }
        

        rows.push({
            "place": {"value": pos, "displayValue": `${pos}${getOrdinal(pos)}`, "className": "ordinal"},
            "gametype": {"value": gName.toLowerCase(), "displayValue": gName},
            "map": {"value": mName.toLowerCase(), "displayValue": mName},
            "played": {"value": d.total_matches},
            "wins": {"value": d.wins, "displayValue": ignore0(d.wins)},
            "draws": {"value": d.draws, "displayValue": ignore0(d.draws)},
            "losses": {"value": d.losses, "displayValue": ignore0(d.losses)},
            "capFor": {"value": d.cap_for, "displayValue": ignore0(d.cap_for)},
            "capAgainst": {"value": d.cap_against, "displayValue": ignore0(d.cap_against)},
            "capDiff": {"value": d.cap_offset, "displayValue": (d.cap_offset > 0) ? `+${d.cap_offset}` : ignore0(d.cap_offset)},
            "points": {"value": d.points, "displayValue": ignore0(d.points)},
        });
    }
    

    return <>
        <InteractiveTable width={2} rows={rows} headers={headers}/>
    </>
}

export default function CTFLeague({data, gametypeNames, mapNames}){

    const [selectedGametype, setSelectedGametype] = useState("0");
    const [selectedMap, setSelectedMap] = useState("0");

    if(data.length === 0) return null;
    
    return <>
        <Header>CTF League</Header>
        {renderTabs(data, selectedGametype, selectedMap, gametypeNames, mapNames, setSelectedGametype, setSelectedMap)}
        {renderEntries(data, selectedGametype, selectedMap, gametypeNames, mapNames)} 
    </>
}
