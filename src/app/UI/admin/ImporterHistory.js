"use client"
import Header from "../Header";
import { useEffect, useReducer } from "react";
import InteractiveTable from "../InteractiveTable";
import { convertTimestamp, ignore0, toPlaytime } from "@/app/lib/generic.mjs";

async function loadData(controller, dispatch){

    try{

        const req = await fetch("/api/admin?mode=get-importer-history&page=1&perPage=50", {
            "signal": controller.signal
        });

        const res = await req.json();

        console.log(res);

        if(res.error !== undefined) throw new Error(res.error);

        dispatch({"type": "loaded", "data": res.data});

    }catch(err){
        console.trace(err);
    }
}

function reducer(state, action){


    switch(action.type){
        case "loaded": {
            return {
                ...state,
                "data": action.data
            }
        }
    }

    return state;
}

export default function ImporterHistory(){

    const [state, dispatch] = useReducer(reducer, {
        "data": []
    });

    useEffect(() =>{

        const controller = new AbortController();

        loadData(controller, dispatch);

    }, []);


    const headers = {
        "date": {"title": "Date"},
        "importer": {"title": "Importer"},
        "found": {"title": "Logs Found"},
        "passed": {"title": "Logs Imported"},
        "failed": {"title": "Logs Rejected"},
        "time": {"title": "Import Time"}
    };

    const rows = state.data.map((d) =>{
        const date = Math.floor(new Date() * 0.001);
        return {
            "date": {
                "value": date, 
                "displayValue": convertTimestamp(date, true),
                "className": "text-left"
            },
            "importer": {
                "value": d.importer_id
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
                "displayValue": toPlaytime(d.total_time)
            }
        }
    });

    return <>
        <Header>Importer History</Header>
        <InteractiveTable width={1} headers={headers} rows={rows}/>
    </>
}