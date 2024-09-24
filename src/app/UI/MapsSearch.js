"use client"
import MapRichBoxes from "../UI/MapRichBoxes";
import { useReducer } from "react";


function reducer(state, action){

    switch(action.type){
        case "load": {
            return {
                ...state
            }
        }
        case "update-name": {
            return {
                ...state,
                "name": action.value
            }
        }
    }

    return state;
}

function filterMaps(maps, name){

    const matches = [];

    const reg = new RegExp(`${name}`,"i");

    for(let i = 0; i < maps.length; i++){

        const m = maps[i];

        if(reg.test(m.name)) matches.push(m);
    }


    return matches;
}

export default function MapsSearch({maps, images, search}){

    //console.log(maps);
    const [state, dispatch] = useReducer(reducer, {
        "name": search
    });

    const filteredMaps = filterMaps(maps, state.name);

    return <>
        <div className="form-row">
            <label>Search</label>
            <input type="text" className="textbox" placeholder="Search for a map..." value={state.name} onChange={(e) =>{
                dispatch({"type": "update-name", "value": e.target.value});
            }}/>
        </div>
        <div className="rich-outter">
            <MapRichBoxes data={filteredMaps} images={images}/>
        </div> 
    </>
}