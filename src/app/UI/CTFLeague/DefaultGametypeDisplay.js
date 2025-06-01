
"use client"
import Header from "../Header";
import GenericTable from "./GenericTable";
import { useSearchParams } from "next/navigation";
import { useEffect, useReducer } from "react";
import BasicPagination from "../BasicPagination";
import { setInt } from "@/app/lib/generic.mjs";

function reducer(state, action){

    switch(action.type){
        case "set-data": {
            return {
                ...state,
                "data": action.data,
                "totalRows": action.totalResults
            }
        }
        case "update-selected": {

            return {
                ...state,
                "selectedGametype": action.selectedGametype,
                "page": action.page
            }
        }
    }

    return state;
}

async function loadData(selectedGametype, page, perPage, dispatch){

    try{

        
        const req = await fetch(`/api/ctfLeague?mode=gametype&gId=${selectedGametype}&page=${page}&perPage=${perPage}`);

        const res = await req.json();

        if(res.error !== undefined) throw new Error(res.error);
        dispatch({"type": "set-data", "data": res.data, "totalResults": res.totalResults});

    }catch(err){
        console.trace(err);
    }
}

export default function DefaultGametypeDisplay({names, selectedGametype, page, perPage}){

    const [state, dispatch] = useReducer(reducer, {
        "selectedGametype": selectedGametype,
        "page": page,
        "data": [],
        "totalRows": 0
    });

    perPage = setInt(perPage, 25);

    useEffect(() =>{

        loadData(state.selectedGametype, state.page, perPage, dispatch);

    }, [state.selectedGametype, state.page, perPage]);

    const searchParams = useSearchParams();
    


    const options = [];

    for(const [id, name] of Object.entries(names)){

        options.push(<option key={id} value={id}>{name}</option>);
    }

    return <>
        <div className="form-row">
            <label>Gametype</label>
            <select value={state.selectedGametype} onChange={(e) =>{
                
                const params = new URLSearchParams(searchParams.toString());
                params.set('id', e.target.value);
                window.history.pushState(null, '', `?${params.toString()}`)

                let gametypeName = names?.[e.target.value] ?? "Not Found";
                document.title = `${gametypeName} - CTF League`;
                dispatch({"type": "update-selected", "selectedGametype": e.target.value, "page": 1});
            }}>
                {options}
            </select>
        </div>

        <Header>{names[state.selectedGametype] ?? "Not Found"}</Header>
        <BasicPagination setPage={(newPage) =>{
            const params = new URLSearchParams(searchParams.toString());
            params.set('page', newPage);
            window.history.pushState(null, '', `?${params.toString()}`)
            
            
           
            dispatch({"type": "update-selected", "selectedGametype": state.selectedGametype, "page": newPage});
        }} results={state.totalRows} perPage={perPage} page={state.page}/>
        <GenericTable title={names[state.selectedGametype] ?? "Not Found"} data={state.data} playerNames={null} page={state.page} perPage={perPage}/>
  
    </>
}