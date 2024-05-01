"use client"
import Header from "../Header";
import { useReducer } from "react";
import Loading from "../Loading";
import ErrorBox from "../ErrorBox";
import MessageBox from "../MessageBox";

function reducer(state, action){

    switch(action.type){
        case "loaded-gametypes": {
            return {
                ...state,
                "gametypes": action.data
            }
        }
        case "set-in-progress": {
            return {
                ...state,
                "bInProgress": action.value
            }
        }
        case "error": {
            return {
                ...state,
                "error": action.message,
            }
        }
        case "message": {
            return {
                ...state,
                "message": action.message
            }
        }
    }

    return state;
}


async function loadData(dispatch){

    try{

        const req = await fetch("/api/gametypes/?mode=get-all-names");

        const res = await req.json();

        if(res.error !== undefined) throw new Error(res.error);

        console.log(res);

        dispatch({"type": "loaded-gametypes", "data": res.data});

    }catch(err){
        console.trace(err);

       
    }
}


async function recalculate(dispatch){

    try{

        dispatch({"type": "set-in-progress", "value": true});
        dispatch({"type": "error", "message": null});

        const req = await fetch("/api/admin?mode=recalculate-rankings");

        const res = await req.json();

        if(res.error !== undefined) throw new Error(res.error);

        dispatch({"type": "set-in-progress", "value": false});

        dispatch({"type": "message", "message": `Recalculating completed.`});

    }catch(err){
        console.trace(err);
        dispatch({"type": "error", "message": err.toString()});
        dispatch({"type": "set-in-progress", "value": false});

    }
}

export default function RecalculateRankings(){

    const [state, dispatch] = useReducer(reducer, {
        "bInProgress": false,
        "gametypes": {},
        "error": null,
        "message": null
    });

    /*useEffect(() =>{

        loadData(dispatch);
    },[]);*/

    const button = (state.bInProgress) ? null : <div className="text-center">
        <input type="button" className="submit-button" value="Recalculate Rankings" onClick={() =>{
            recalculate(dispatch);
        }}/>
    </div>;
    
    return <>
        <Header>
            Recaclulate All Rankings
        </Header>
        <div className="info">
            Use this tool to recalculate all player rankings, you may want to do this after changing ranking setting values or after merging players.
        </div>
        <ErrorBox title="Failed to recalculate rankings">{state.error}</ErrorBox>
        <MessageBox title="Success">{state.message}</MessageBox>
        <Loading value={state.bInProgress}>Recalculating rankings in progress...</Loading>
        {button}
    </>
}