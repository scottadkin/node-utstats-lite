"use client"
import Header from "../Header";
import { useEffect, useReducer } from "react";
import InteractiveTable from "../InteractiveTable";
import { convertTimestamp, ignore0 } from "@/app/lib/generic.mjs";
import Tabs from "../Tabs";
import BasicPagination from "../BasicPagination";
import Link from "next/link";

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

async function loadPreviousImports(controller, page, perPage, dispatch){

    try{

        const req = await fetch(`/api/admin?mode=get-importer-history&page=${page}&perPage=${perPage}`, {
            "signal": controller.signal
        });

        const res = await req.json();


        if(res.error !== undefined) throw new Error(res.error);

        dispatch({"type": "loaded-previous", "data": res.data, "totals": res.totals});

    }catch(err){
        console.trace(err);
    }
}

async function loadRejected(page, perPage, dispatch){

    try{

        const req = await fetch(`/api/admin?mode=get-rejected-history&page=${page}&perPage=${perPage}`);

        const res = await req.json();

        if(res.error !== undefined) throw new Error(res.error);

        dispatch({"type": "loaded-rejected", "data": res.data, "totals": res.totals});

    }catch(err){
        console.trace(err);
    }
}

async function loadLogsHistory(page, perPage, dispatch){

    try{

        const req = await fetch(`/api/admin?mode=get-importer-logs&page=${page}&perPage=${perPage}`);

        const res = await req.json();

        if(res.error !== undefined) throw new Error(res.error);

        console.log(res);

        dispatch({"type": "loaded-logs-history", "data": res.data, "totals": res.totals});

    }catch(err){
        console.trace(err);
    }
}

function renderPreviousImports(state, dispatch){

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

        const date = Math.floor(new Date(d.date) * 0.001);

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
        <BasicPagination results={state.totalPreviousImports} perPage={state.perPage} page={state.page} setPage={(value) =>{
            dispatch({"type": "change-page", "value": value});
        }}/>
        <InteractiveTable width={1} headers={headers} rows={rows} bNoHeaderSorting={true} sortBy={"date"} order={"DESC"}/>
    </>
}


function renderRejectedImports(state, dispatch){

    if(state.mode !== "1") return null;

    const headers = {
        "importer": {"title": "Importer"},
        "file": {"title": "File"},
        "date": {"title": "Date"},
        "reason": {"title": "Rejected Reason"}
    };

    const rows = state.rejectedImports.map((d) =>{

        const date = Math.floor(new Date(d.date) * 0.001);

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
            "reason": {
                "value": d.reason.toLowerCase(),
                "displayValue": d.reason,
                "className": "font-small team-red"
            },
            "file": {
                "value": d.file_name.toLowerCase(),
                "displayValue": d.file_name,
                "className": "font-small"
            }
        }
    });

    return <>
        <BasicPagination results={state.totalRejected} perPage={state.perPage} page={state.page} setPage={(value) =>{
            dispatch({"type": "change-page", "value": value});
        }}/>
        <InteractiveTable width={1} headers={headers} rows={rows} bNoHeaderSorting={true} sortBy={"date"} order={"DESC"}/>
    </>
}


function renderLogsHistory(state, dispatch){

    if(state.mode !== "2") return null;

    const headers = {
        "importer": {"title": "Importer"},
        "file": {"title": "File"},
        "date": {"title": "Date"},
        "match": {"title": "Match Id"}
    };

    const rows = state.logsHistory.map((d) =>{

        const date = Math.floor(new Date(d.date) * 0.001);

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
            "file": {
                "value": d.file_name.toLowerCase(),
                "displayValue": d.file_name,
                "className": "font-small"
            },
            "match": {
                "value": d.match_id,
                "displayValue": <Link href={`/match/${d.match_id}`}>{d.match_id}</Link>
            }
        }
    });

    return <>
        <BasicPagination results={state.totalLogs} perPage={state.perPage} page={state.page} setPage={(value) =>{
            dispatch({"type": "change-page", "value": value});
        }}/>
        <InteractiveTable width={1} headers={headers} rows={rows} bNoHeaderSorting={true} sortBy={"date"} order={"DESC"}/>
    </>
}

function reducer(state, action){


    switch(action.type){
        case "loaded-previous": {
            return {
                ...state,
                "previousImports": action.data,
                "totalPreviousImports": action.totals
            }
        }
        case "loaded-rejected": {
            return {
                ...state,
                "rejectedImports": action.data,
                "totalRejected": action.totals
            }
        }
        case "loaded-logs-history": {
            return {
                ...state,
                "logsHistory": action.data,
                "totalLogs": action.totals
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
                "mode": action.value,
                "page": 1
            }
        }
        case "change-page": {
            return {
                ...state,
                "page": action.value
            }
        }
    }

    return state;
}

export default function ImporterHistory(){

    const [state, dispatch] = useReducer(reducer, {
        "previousImports": [],
        "totalPreviousImports": 0,
        "rejectedImports": [],
        "totalRejected": 0,
        "logsHistory": [],
        "totalLogs": 0,
        "names": {},
        "mode": "2",
        "page": 1,
        "perPage": 50
    });

    useEffect(() =>{

        const controller = new AbortController();

        loadNames(controller, dispatch);
        loadPreviousImports(controller, state.page, state.perPage, dispatch);
        loadLogsHistory(state.page, state.perPage, dispatch);

        return () =>{
           // controller.abort();
        }

    }, [state.page, state.perPage]);

    useEffect(() =>{

        if(state.mode === "0"){
            loadPreviousImports("controller", state.page, state.perPage, dispatch);
        }else if(state.mode === "1"){
            loadRejected(state.page, state.perPage, dispatch);
        }else if(state.mode === "2"){
            loadLogsHistory(state.page, state.perPage, dispatch);
        }

    }, [state.page, state.perPage, state.mode]);


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
        {renderPreviousImports(state, dispatch)}
        {renderRejectedImports(state, dispatch)}
        {renderLogsHistory(state, dispatch)}
    </>
}