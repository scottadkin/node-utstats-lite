"use client"
import { useSearchParams } from "next/navigation";
import {useEffect, useReducer} from "react";
import Header from "../Header";
import GenericTable from "./GenericTable";
import { setInt } from "@/app/lib/generic.mjs";
import BasicPagination from "../BasicPagination";


function reducer(state, action){

    switch(action.type){

        case "set-selected":{
            return {
                ...state,
                "selectedMap": action.map,
                "selectedGametype": action.gametype,
                "page": 1
            }
        }
        case "set-gametype-info": {
            return {
                ...state,
                "gametypeInfo": action.valid,
                "data": action.data,
                "totalRows": action.totalRows
            }
        }
        case "set-page": {
            return {
                ...state,
                "page": action.value
            }
        }
    }
    return state;
}

async function loadData(selectedMap, selectedGametype, dispatch, page, perPage){

    try{

        const req = await fetch(`/api/ctfLeague/?mode=get-map-valid-gametypes&mId=${selectedMap}&gId=${selectedGametype}&page=${page}&perPage=${perPage}`);

        const res = await req.json();

        if(res.error !== undefined) throw new Error(res.error);

        if(res.validOptions[selectedGametype] === undefined){

            const keys = Object.keys(res.validOptions);

            if(keys.length > 0){             
                dispatch({"type": "set-selected", "gametype": keys[0], "map": selectedMap});
            }else{
                dispatch({"type": "set-selected", "gametype": 0, "map": selectedMap});
            }
        }

        dispatch({"type": "set-gametype-info", "valid": res.validOptions, "data": res.data.data, "totalRows": res.data.totalRows});

    }catch(err){
        console.trace(err);
    }
}

function sortByName(a, b){
    a = a.display.toLowerCase();
    b = b.display.toLowerCase();

    if(a < b) return -1;
    if(a > b) return 1;
    return 0;
}

export default function MapDisplay({mapNames, gametypeNames, selectedGametype, selectedMap, latestGametypeMapCombo, perPage}){
    

    const [state, dispatch] = useReducer(reducer, {
       // "selectedMap": (latestGametypeMapCombo !== null) ? latestGametypeMapCombo.map_id :0,
        "selectedMap": (selectedMap !== 0) ? selectedMap : (latestGametypeMapCombo !== null) ? latestGametypeMapCombo.map_id :0,
        "selectedGametype": (selectedGametype !== 0) ? selectedGametype : (latestGametypeMapCombo !== null) ?latestGametypeMapCombo.gametype_id :0,
       // "selectedGametype": (latestGametypeMapCombo !== null) ? latestGametypeMapCombo.gametype_id :0,
        "data": [],
        "gametypeInfo": {},
        "totalRows": 0,
        "page": 1
    });

    perPage = setInt(perPage, 25);

    useEffect(() =>{
        loadData(state.selectedMap, state.selectedGametype, dispatch, state.page, perPage);
    },[state.selectedGametype, state.selectedMap, state.page, perPage]);


    useEffect(() =>{
        let mapName = mapNames?.[state.selectedMap] ?? "Not Found";
        let gametypeName = gametypeNames?.[state.selectedGametype] ?? "Not Found";

        document.title = `${mapName} (${gametypeName}) - CTF League`;
    },[state.selectedGametype, state.selectedMap, gametypeNames, mapNames]);

    const searchParams = useSearchParams();
    const mapOptions = [{"display": "-", "value": 0}];

    for(const [key, value] of Object.entries(mapNames)){
        mapOptions.push({"display": value, "value": key});
    }

    mapOptions.sort(sortByName);

    const gametypeOptions = [{"display": "-", "value": 0}];

    for(const [gametypeId, totalMatches] of Object.entries(state.gametypeInfo)){
        gametypeOptions.push({"display": `${gametypeNames[gametypeId]} (${totalMatches})`, "value": gametypeId});
    }

    gametypeOptions.sort(sortByName);


    return <>
    
        <div className="form">
            <div className="form-row">
                <label>Map</label>
                <select value={state.selectedMap} onChange={(e) =>{
   
                    const params = new URLSearchParams(searchParams.toString());
                    params.set('id', e.target.value);
                    dispatch({"type": "set-selected", "gametype": state.selectedGametype, "map": e.target.value});
                    window.history.pushState(null, '', `?${params.toString()}`)

                    let mapName = mapNames?.[e.target.value] ?? "Not Found";
                    let gametypeName = gametypeNames?.[state.selectedGametype] ?? "Not Found";

                    document.title = `${mapName} (${gametypeName}) - CTF League`;
                }}>
                    {mapOptions.map((m, i) =>{
                        return <option value={m.value} key={`m-${i}`}>{m.display}</option>
                    })}
                </select>
            </div>
            <div className="form-row">
                <label>Gametype</label>
                <select value={state.selectedGametype} onChange={(e) =>{
                    const params = new URLSearchParams(searchParams.toString());
                    params.set('gid', e.target.value);
                    dispatch({"type": "set-selected", "gametype": e.target.value, "map": state.selectedMap});
                    window.history.pushState(null, '', `?${params.toString()}`)

                    let mapName = mapNames?.[state.selectedMap] ?? "Not Found";
                    let gametypeName = gametypeNames?.[e.target.value] ?? "Not Found";

                    document.title = `${mapName} (${gametypeName}) - CTF League`;
                }}>

                    {gametypeOptions.map((g, i) =>{
                        return <option value={g.value} key={`g-${i}`}>{g.display}</option>
                    })}
                </select>
            </div>
            
            <Header>{mapNames[state.selectedMap]} ({gametypeNames[state.selectedGametype]}) Player League</Header>
            <BasicPagination results={state.totalRows} perPage={perPage} page={state.page} setPage={(newPage) =>{
                dispatch({"type": "set-page", "value": newPage});
            }}/>
            <GenericTable 
                page={state.page} 
                perPage={perPage} 
                title={`${mapNames[state.selectedMap]} (${gametypeNames[state.selectedGametype]})`} 
                data={state.data} playerNames={null}
            />

            
        </div>
    </>
}