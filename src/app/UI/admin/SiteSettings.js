"use client"
import Header from "../Header";
import { useEffect, useReducer } from "react";
import ErrorBox from "../ErrorBox";
import WarningBox from "../WarningBox";
import Tabs from "../Tabs";
import TrueFalseButton from "../TrueFalseButton";


async function loadData(dispatch){

    try{

        const req = await fetch("/api/admin?mode=get-site-settings");

        const res = await req.json();

        if(res.error !== undefined) throw new Error(res.error);

        console.log(res.data);

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

                if(s.category === action.category && s.setting_type === action.key){

                    s.setting_value = action.value;

                    if(s.bSettingChanged === undefined){
                        s.bSettingChanged = true;
                    }else{
                        s.bSettingChanged = !s.bSettingChanged;
                    };
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

        if(s.setting_value === "True" || s.setting_value === "False"){
            valueElem = <TrueFalseButton 
                value={(s.setting_value === "True") ? 1 : 0} 
                bTableElem={true}
                setValue={() =>{
                    let value = s.setting_value;

                    if(value === "False"){
                        value = "True";
                    }else{
                        value = "False";
                    }

                    dispatch({
                        "type": "change-setting-value", 
                        "category": s.category, 
                        "key": s.setting_type, 
                        "value": value
                    });
                }}
            />
        }


        rows.push(<tr key={s.id}>
            <td>{s.setting_type}</td>
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
            dispatch({"type": "selectedTab", "value": value});
        }}/>
        <ErrorBox title="Error">{state.error}</ErrorBox>
        {renderSelectedOptions(state, dispatch)}
        <WarningBox>{(bAnyUnsavedChanges(state)) ? <>You have unsaved changes</> : null}</WarningBox>
    </>
}