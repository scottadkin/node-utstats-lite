"use client"
import Header from "../Header";
import ErrorBox from "../ErrorBox";
import Tabs from "../Tabs";
import WarningBox from "../WarningBox";
import MessageBox from "../MessageBox";
import { useReducer, useEffect } from "react";

function reducer(state, action){

    switch(action.type){
        case "loaded-data": {

            let cat = "";

            if(action.data.length > 0){
                cat = action.data[0].category;
            }
            return {
                ...state,
                "data": action.data,
                "selectedTab": cat
            }
        }
        case "error": {
            return {
                ...state,
                "error": action.message,
                "message": null
            }
        }
        case "message": {
            return {
                ...state,
                "error": null,
                "message": action.message
            }
        }
        case "change-tab": {
            return {
                ...state,
                "selectedTab": action.value
            }
        }
        case "update-setting": {

            const updatedData = JSON.parse(JSON.stringify(state.data));

            for(let i = 0; i < updatedData.length; i++){

                const u = updatedData[i];

                if(u.category === action.category && u.name === action.name){

                    u.points = action.value;
                    u.bChanged = true;
                }
            }
            return {
                ...state,
                "data": updatedData
            }
        }
    }

    return state;
}

async function loadData(dispatch){

    try{

        const req = await fetch("/api/admin/?mode=get-ranking-settings");

        const res = await req.json();

        dispatch({"type": "loaded-data", "data": res.data});


    }catch(err){

        if(err.name === "AbortError") return;
        dispatch({"type": "error", "message": err.toString()});
        
    }
}


function renderData(state, dispatch){

    const filter = function (a){
        return a.category === state.selectedTab;
    };

    return <table>
        <tbody>
            <tr>
                <th>Name</th>
                <th>Value</th>
            </tr>
            {
                state.data.filter(filter).map((d, i) =>{

                    return <tr key={`${d.category}-${i}`}>
                        <td className="text-left">{d.display_name}</td>
                        <td>
                            <input 
                                type={(d.category === "penalty") ? "textbox" : "number"} 
                                className="textbox" 
                                value={d.points}
                                onChange={(e) =>{
                                    dispatch({
                                        "type": "update-setting", 
                                        "category": d.category, 
                                        "name": d.name, 
                                        "value": e.target.value
                                    });
                                }}
                            />
                        </td>
                    </tr>
                })
            }
        </tbody>
    </table>
}

function bAnyUnsavedChanges(state){

    for(let i = 0; i < state.data.length; i++){

        const d = state.data[i];

        if(d.bChanged !== undefined) return true;
    }

    return false;
}



async function saveChanges(state, dispatch){

    try{

        const changed = [];

        for(let i = 0; i < state.data.length; i++){

            const d = state.data[i];

            if(d.bChanged !== undefined){

                let points = d.points;

                if(d.category === "penalty"){
                    points = parseFloat(points);
                }else{
                    points = parseInt(points);
                }

                if(points !== points){

                    dispatch({
                        "type": "error", 
                        "message": `${d.category}.${d.name} must be a valid ${(d.category === "penalty") ? "Float" : "Integer"}`
                    });

                    continue;
                }

                changed.push({
                    "id": d.id,
                    "points": points
                });
            }
        }

        if(changed.length === 0) return;

        const req = await fetch("/api/admin", {
            "headers": {"Content-type": "application/json"},
            "method": "POST",
            "body": JSON.stringify({"mode": "save-ranking-settings", "data": changed})
        });

        const res = await req.json();

        if(res.error !== undefined){
            throw new Error(res.error);
        }


        await loadData(dispatch);
        dispatch({"type": "error", "message": null});
        dispatch({"type": "message", "message": res.message});


    }catch(err){
        console.trace(err);

        dispatch({"type": "error", "message": err.toString()});
    }
}


function displayInfo(state){

    const info = {
        "general": <>Basic frag related events, kills, deaths, and so on.</>,
        "ctf":  <>CTF specific events.</>,
        "penalty": 
            <>
                Penalties that are applied to players ranking scores if they have played under a certain time frame.<br/>
                A value of 0.1 means the players total score will be 10&#37; of the players inital score.
            </>
    };


    return <div className="info">
        {info[state.selectedTab]}
    </div>
}

export default function RankingSettings({}){

    const [state, dispatch] = useReducer(reducer, {
        "data": [],
        "error": null,
        "selectedTab": "",
        "message": null
    });

    useEffect(() =>{

        loadData(dispatch);


    },[]);

    const categoryNames = [... new Set(state.data.map((d) =>{
        return d.category.toUpperCase();
    }))];

    const tabOptions = categoryNames.map((c) =>{
        return {"value": c.toLowerCase(), "name": c};
    });

    const saveElem = <>
        You have unsaved changes!<br/><br/>
        <input type="button" className="submit-button" value="Save Changes" onClick={() =>{
            saveChanges(state, dispatch);
        }}/>
    </>

    return <>
        <Header>Ranking Settings</Header>
        <ErrorBox title="Failed to load ranking settings">{state.error}</ErrorBox>
        <WarningBox>{(bAnyUnsavedChanges(state)) ? saveElem : null}</WarningBox>
        <MessageBox title="Save successful">{state.message}</MessageBox>
        <Tabs options={tabOptions} selectedValue={state.selectedTab} changeSelected={(value) =>{
            dispatch({"type": "change-tab", "value": value});
        }}/>
        {displayInfo(state)}
        {renderData(state, dispatch)}
    </>
}