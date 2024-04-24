"use client"
import Header from "../Header";
import { useEffect, useReducer } from "react";
import InteractiveTable from "../InteractiveTable";
import { convertTimestamp, ignore0, toPlaytime } from "@/app/lib/generic.mjs";
import Tabs from "../Tabs";

async function loadNames(controller, dispatch){

    try{

        const req = await fetch("/api/admin?mode=get-importer-names", {
            "signal": controller.signal
        });

        const res = await req.json();


        if(res.error !== undefined) throw new Error(res.error);

        dispatch({"type": "set-names", "data": res.data});

    }catch(err){
        console.trace(err);
    }
}

async function loadPreviousImports(controller, dispatch){

    try{

        const req = await fetch("/api/admin?mode=get-importer-history&page=1&perPage=50", {
            "signal": controller.signal
        });

        const res = await req.json();


        if(res.error !== undefined) throw new Error(res.error);

        dispatch({"type": "loaded-previous", "data": res.data});

    }catch(err){
        console.trace(err);
    }
}


function renderPreviousImports(state){

    if(state.mode !== "0") return null;

    const headers = {
        "importer": {"title": "Importer"},
        "date": {"title": "Date"},
        "found": {"title": "Logs Found"},
        "passed": {"title": "Logs Imported"},
        "failed": {"title": "Logs Rejected"},
        "time": {"title": "Import Time"}
    };

    const rows = state.previousImports.map((d) =>{

        const date = Math.floor(new Date() * 0.001);

        const importerInfo = state.names[d.importer_id] ?? {"name": "Not Found", "host": "", "port": ""};

        let hostString = (d.importer_id === -1) ? "" : ` (${importerInfo.host}:${importerInfo.port})`;

        return {
            "date": {
                "value": date, 
                "displayValue": convertTimestamp(date, true),
                "className": "font-small"
            },
            "importer": {
                "value": importerInfo.name.toLowerCase(),
                "displayValue": <>{importerInfo.name}{hostString}</>,
                "className": "text-left"
            },
            "found": {
                "value": ignore0(d.logs_found)
            },
            "passed": {
                "value": ignore0(d.imported)
            },
            "failed": {
                "value": ignore0(d.failed)
            },
            "time": {
                "value": d.total_time,
                "displayValue": `${d.total_time.toFixed(4)} Seconds`,
                "className": "font-small"
            }
        }
    });

    return <>
        <InteractiveTable width={1} headers={headers} rows={rows}/>
    </>
}

function reducer(state, action){


    switch(action.type){
        case "loaded-previous": {
            return {
                ...state,
                "previousImports": action.data
            }
        }
        case "set-names": {
            return {
                ...state,
                "names": action.data
            }
        }
        case "change-mode": {
            return {
                ...state,
                "mode": action.value
            }
        }
    }

    return state;
}

export default function ImporterHistory(){

    const [state, dispatch] = useReducer(reducer, {
        "previousImports": [],
        "names": {},
        "mode": "0"
    });

    useEffect(() =>{

        const controller = new AbortController();

        loadNames(controller, dispatch);
        loadPreviousImports(controller, dispatch);

        return () =>{
           // controller.abort();
        }
    }, []);


    const tabOptions = [
        {"name": "Previous Imports", "value": "0"},
        {"name": "Rejected Logs", "value": "1"},
        {"name": "Imported Logs", "value": "2"},
    ];


    return <>
        <Header>Importer History</Header>
        <Tabs options={tabOptions} selectedValue={state.mode} changeSelected={(value) =>{
            dispatch({"type": "change-mode", "value": value});
        }}/>
        {renderPreviousImports(state)}
    </>
}