import Header from "../Header";
import { useEffect, useReducer } from "react";

function reducer(state, action){

    switch(action.type){
        case "load-data": {

            return {
                ...state,
                "data": action.data
            }
        }
        case "change-progress": {

            return {
                ...state,
                "bInProgress": action.value
            };
        }
    }

    return state;
}


async function loadData(dispatch){

    try{

        const req = await fetch("/api/admin?mode=get-split-gametypes-by-teams-info");

        const res = await req.json();

        if(res.error !== undefined) throw new Error(res.error);
        console.log(res);
        dispatch({"type": "load-data", "data": res});

    }catch(err){
        console.trace(err);
    }
}

async function appendTeamSizes(state, dispatch){

    try{

        const req = await fetch("/api/admin?mode=append-team-sizes-to-gametypes");

        const res = await req.json();

        if(res.error !== undefined){

            throw new Error(res.error);
        }

        console.log(res);

        await loadData(dispatch);

        dispatch({"type": "change-progress", "value": false});
        

    }catch(err){
        console.trace(err);
    }
}


function renderButton(state, dispatch){

    if(state.bInProgress) return <><br/>In progress...</>

    return <><br/><div className="submit-button" onClick={() =>{
        dispatch({"type": "change-progress", "value": true});
        appendTeamSizes(state, dispatch);
    }}>Append Team Sizes To Gametype Names</div></>
}

export default function GametypesManager(){

    const [state, dispatch] = useReducer(reducer, {
        "data": {
            "totalMatches": 0,
            "change": 0,
            "alreadySet": 0,
            "keepName": 0,
            "gametypesCreated": 0
        },
        "bInProgress": false
    });

    useEffect(() =>{
        loadData(dispatch);
    },[]);

    return <>
        <Header>Gametype Manager</Header>
        <div className="info">
            Split gametypes by team size.<br/>
            By default gametypes are imported by just their name, but you can also set up importers to include the team sizes in brackets to keep records, rankings, and other stuff separate.<br/><br/>
            For example say you have a match that is a <b>Capture The Flag</b> gametype with 10 players, by default it will be imported as just <b>Capture The Flag</b>, but if you use split gametypes by team size it will be imported as <b>Capture The Flag (5 v 5)</b>.<br/>
            Note: Team sizes will not be appended if teams are of uneven size(5 players vs 4 players ect).<br/><br/><br/><br/>
            A total of <b>{state.data.totalMatches} matches</b> found.<br/> 
            <b>{state.data.change} matches</b> can have teams appended to gametype name.<br/>
            <b>{state.data.alreadySet} matches</b> already have team sizes appended.<br/> 
            <b>{state.data.keepName} matches</b> will keep their current name.<br/>
            <b>{state.data.gametypesCreated} new gametypes</b> will be created.
            {renderButton(state, dispatch)}
        </div>
    </>
}