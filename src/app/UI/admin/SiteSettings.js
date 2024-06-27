"use client"
import Header from "../Header";
import { useEffect, useReducer } from "react";
import ErrorBox from "../ErrorBox";
import WarningBox from "../WarningBox";
import Tabs from "../Tabs";
import TrueFalseButton from "../TrueFalseButton";
import PerPageDropDown from "../PerPageDropDown";



async function loadData(dispatch){

    try{

        const req = await fetch("/api/admin?mode=get-site-settings");

        const res = await req.json();

        if(res.error !== undefined) throw new Error(res.error);

        const tabs = [... new Set(res.data.map((d) =>{
            return d.category;
        }))];

        tabs.sort((a, b) =>{

            a = a.toLowerCase();
            b = b.toLowerCase();

            if(a > b) return -1;
            if(a < b) return 1;
            return 0;
        });

        let selectedTab = "";

        if(tabs.length > 0){
            selectedTab = tabs[0];
        }

        dispatch({"type": "loaded", "data": res.data, "tabs": tabs, "selectedTab": selectedTab});

    }catch(err){
        console.trace(err);
        dispatch({"type": "error", "message": err.toString()});
    }
}

async function saveChanges(state, dispatch){

    try{

        const changes = [];

        for(let i = 0; i < state.settings.length; i++){

            const s = state.settings[i];

            if(s.bSettingChanged !== undefined){
                changes.push(s);
            }
        }

        if(changes.length === 0) return;

        const req = await fetch("/api/admin", {
            "headers": {"Content-type": "application/json"},
            "method": "POST",
            "body": JSON.stringify({"mode": "save-site-settings", "settings": changes})
        });

        const res = await req.json();

        if(res.error !== undefined) throw new Error(res.error);

        const passedIds = [];

        for(let i = 0; i < res.messages.length; i++){

            const m = res.messages[i];
            if(m.type === "pass") passedIds.push(m.id);
        }

        dispatch({"type": "remove-settings-changed", "passedIds": passedIds});

    }catch(err){
        console.trace(err);
        dispatch({"type": "error", "message": err.toString()});
    }
}

function reducer(state, action){

    switch(action.type){

        case "loaded": {
            return {
                ...state,
                "settings": action.data,
                "tabs": action.tabs,
                "selectedTab": action.selectedTab
            }
        }
        case "error": {
            return {
                ...state,
                "error": action.message
            }
        }
        case "change-tab": {
            return {
                ...state,
                "selectedTab": action.value
            }
        }
        case "change-setting-value": {

            const currentSettings = JSON.parse(JSON.stringify(state.settings));
        
            for(let i = 0; i < currentSettings.length; i++){

                const s = currentSettings[i];

                if(s.category === action.category && s.setting_name === action.key){

                    s.setting_value = action.value;

                    if(s.bSettingChanged === undefined){
                        s.bSettingChanged = true;
                    }
                    //}else{
                    //    s.bSettingChanged = !s.bSettingChanged;
                   // };
                }
            }

            return {
                ...state,
                "settings": currentSettings        
            }
        }
        case "remove-settings-changed":{

            const currentSettings = JSON.parse(JSON.stringify(state.settings));

            for(let i = 0; i < currentSettings.length; i++){

                const s = currentSettings[i];

                if(action.passedIds.indexOf(s.id) !== -1){
                    delete s.bSettingChanged;
                }
            }
            return {
                ...state,
                "settings": currentSettings
            }
        }
    }

    return state;
}


function renderSelectedOptions(state, dispatch){

    const rows = [];

    for(let i = 0; i < state.settings.length; i++){

        const s = state.settings[i];

        if(s.category !== state.selectedTab) continue;


        let valueElem = <td>{s.setting_value}</td>;

        if(s.setting_type === "bool"){

            valueElem = <TrueFalseButton 
                value={parseInt(s.setting_value)} 
                bTableElem={true}
                setValue={() =>{
                    
                    let value = parseInt(s.setting_value);

                    if(value === 1){
                        value = 0;
                    }else{
                        value = 1;
                    }

                    dispatch({
                        "type": "change-setting-value", 
                        "category": s.category, 
                        "key": s.setting_name, 
                        "value": value
                    });
                }}
            />

        }
        
        if(s.setting_type === "perPage"){

            valueElem = <td>
                <PerPageDropDown 
                    selectedValue={parseInt(s.setting_value)}
                    setValue={(value) =>{
                        dispatch({
                            "type": "change-setting-value", 
                            "category": s.category, 
                            "key": s.setting_name, 
                            "value": value
                        });
                    }}
                />
            </td>
        }

        if(s.setting_type === "string"){
            valueElem = <td>
                <input type="text" className="textbox" value={s.setting_value} onChange={(e) =>{
                    dispatch({
                        "type": "change-setting-value", 
                        "category": s.category, 
                        "key": s.setting_name, 
                        "value": e.target.value
                    });
                }}/>
            </td>
        }


        rows.push(<tr key={s.id}>
            <td className="text-left">{s.setting_name}</td>
            {valueElem}
        </tr>);

    }

    return <>
        <table className="t-width-4">
            <tbody>
                <tr>
                    <th>Name</th>
                    <th>Value</th>
                </tr>
                {rows}
            </tbody>
        </table>
    </>
}

function bAnyUnsavedChanges(state){

    for(let i = 0; i < state.settings.length; i++){

        const s = state.settings[i];

        if(s.bSettingChanged) return true;

    }
    return false;
}

export default function SiteSettings(){

    const [state, dispatch] = useReducer(reducer, {
        "error": null,
        "settings": [],
        "tabs": [],
        "selectedTab": "",
    });

    useEffect(() =>{
        loadData(dispatch);
    },[]);

    const tabOptions = state.tabs.map((t) =>{
        return {"name": t, "value": t}
    });

    return <>
        <Header>
            Site Settings
        </Header>
        <Tabs options={tabOptions} selectedValue={state.selectedTab} changeSelected={(value) =>{
            dispatch({"type": "change-tab", "value": value});
        }}/>
        <ErrorBox title="Error">{state.error}</ErrorBox>
        {renderSelectedOptions(state, dispatch)}
        <WarningBox>{(bAnyUnsavedChanges(state)) ? <>
            You have unsaved changes<br/><br/>
            <input type="button" className="submit-button" value="Save Changes" onClick={async () =>{
                saveChanges(state, dispatch);
            }}/>
        </> : null}</WarningBox>
    </>
}