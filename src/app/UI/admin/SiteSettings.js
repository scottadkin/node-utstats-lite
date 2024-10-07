"use client"
import Header from "../Header";
import { useEffect, useReducer } from "react";
import ErrorBox from "../ErrorBox";
import WarningBox from "../WarningBox";
import Tabs from "../Tabs";
import TrueFalseButton from "../TrueFalseButton";
import PerPageDropDown from "../PerPageDropDown";

function reducer(state, action){

    switch(action.type){

        case "loaded": {
            return {
                ...state,
                "settings": action.data,
                "tabs": action.tabs,
                "selectedTab": action.selectedTab,
                "pageLayouts": action.pageLayouts,
                "pendingLayouts": action.pageLayouts
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

        case "change-pending-layout": {

            const currentSettings = structuredClone(state.pendingLayouts);
            const item = action.item;
            const currentIndex = action.currentIndex;
            const bMoveUp = action.bMoveUp;

            if(bMoveUp && currentIndex === 1){

                //console.log(`cant move up, already first item`);

                return {...state};
            }

            const tab = state.selectedTab.toLowerCase();

            const newSettings = adjustPendingOrder(currentSettings, tab, item, bMoveUp);

            return {
                ...state,
                "pendingLayouts": newSettings
            }
        }

        case "saved-layout-changes": {

            return {
                ...state,
                "pageLayouts": state.pendingLayouts
            }
        }
    }

    return state;
}

function adjustPendingOrder(currentSettings, tab, targetItem, bMoveUp){

    const newSettings = [];
    const categorySettings = [];

    let targetCurrentIndex = null;

    for(let i = 0; i < currentSettings.length; i++){

        const c = currentSettings[i];

        if(c.page === tab){

            categorySettings.push(c);

            if(c.item === targetItem) targetCurrentIndex = c.page_order;

        }else{
            newSettings.push(c);
        }
    }

    for(let i = 0; i < categorySettings.length; i++){

        const c = categorySettings[i];

        if(bMoveUp){

            if(c.item !== targetItem && c.page_order === targetCurrentIndex - 1){
                c.page_order++;
            }else if(c.item === targetItem){
                c.page_order--;
            }

            continue;
        }

        if(c.item !== targetItem && c.page_order === targetCurrentIndex + 1){

            c.page_order--;

        }else if(c.item === targetItem){
            //can't move last time further down
            if(i === categorySettings.length - 1) break;
            c.page_order++
        }
        
    }

    //change this is just for testing
    return [...categorySettings, ...newSettings];
}

async function loadData(dispatch){

    try{

        const req = await fetch("/api/admin?mode=get-site-settings");

        const res = await req.json();

        console.log(res);

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

        dispatch({
            "type": "loaded", 
            "data": res.data, 
            "tabs": tabs, 
            "selectedTab": selectedTab,
            "pageLayouts": res.pageLayouts
        });

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

        await savePageLayouts(state, dispatch);

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

async function savePageLayouts(state, dispatch){

    try{

        const req = await fetch("/api/admin", {
            "headers": {"Content-type": "application/json"},
            "method": "POST",
            "body": JSON.stringify({"mode": "save-page-layouts", "settings": state.pendingLayouts})
        });

        const res = await req.json();

        if(res.error !== undefined) throw new Error(res.error);



        console.log(res);

        dispatch({"type": "saved-layout-changes"});

    }catch(err){
        console.trace(err);
        dispatch({"type": "error", "message": err.toString()});
    }
}

function getLayoutItems(state){

    const targetPage = state.selectedTab.toLowerCase();

    const found = [];

    for(let i = 0; i < state.pendingLayouts.length; i++){

        const p = state.pendingLayouts[i];

        if(p.page === targetPage) found.push(p);
    }


    found.sort((a, b) =>{

        a = a.page_order;
        b = b.page_order;

        if(a < b) return -1;
        if(a > b) return 1;
        return 0;
    });

    return found;
}


function renderLayoutEditor(state, dispatch){

    const elems = [];

    const layout = getLayoutItems(state);

    if(layout.length === 0) return null;

    for(let i = 0; i < layout.length; i++){

        const item = layout[i];

        elems.push(<tr key={i}><td className="text-left">
            {item.item}</td>
            <td>
                <button type="button" className="button b-down" onClick={() =>{

                    dispatch({
                        "type": "change-pending-layout",
                        "page": state.selectedTab.toLowerCase(),
                        "item": item.item,
                        "currentIndex": item.page_order,
                        "bMoveUp": false
                    });

                }}>Down</button>
                <button type="button" className="button b-up" onClick={() =>{
                    dispatch({
                        "type": "change-pending-layout",
                        "page": state.selectedTab.toLowerCase(),
                        "item": item.item,
                        "currentIndex": item.page_order,
                        "bMoveUp": true
                    });
                }}>UP</button>     
            </td>
        </tr>);
    }
        

    return <div className="margin-top-1">
        <Header>Page Layout Editor</Header>
        <table className="t-width-4">
            <tbody>
                <tr>
                    <th>Item</th>
                    <th>Change Position</th>
                </tr>
                {elems}
            </tbody>
        </table>
    </div>
}

function renderSelectedOptions(state, dispatch){

    const rows = [];

    const textAreaElems = [];

    for(let i = 0; i < state.settings.length; i++){

        const s = state.settings[i];

        if(s.category !== state.selectedTab) continue;

        let valueElem = null;

        const type = s.setting_type.toLowerCase();


        let bTextArea = false;

        switch(type){

            case "bool": {

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

            } break;
            case "perpage": {

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

            } break;

            case "string": {
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
            } break;

            case "integer": {

                valueElem = <td>
                    <input type="number" className="textbox" value={s.setting_value} onChange={(e) =>{
                        dispatch({
                            "type": "change-setting-value", 
                            "category": s.category, 
                            "key": s.setting_name, 
                            "value": e.target.value
                        });
                    }}/>
                </td>
            }   break;

            case "longtext": {

                valueElem = <textarea value={s.setting_value} onChange={(e) =>{
          
                    dispatch({
                        "type": "change-setting-value", 
                        "category": s.category, 
                        "key": s.setting_name, 
                        "value": e.target.value
                    });
                }}></textarea>;

                bTextArea = true;
            }
            break;

            default: {
                valueElem = <td>{s.setting_value}</td>;
            } break;

        }

        if(bTextArea){
            textAreaElems.push(<div className="admin-textarea-wrapper" key={i}>
                <div className="admin-textarea-title">{s.setting_name}</div>
                {valueElem}
            </div>);
            continue;
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
        <div className="text-center center">
            {textAreaElems}
        </div>
        {renderLayoutEditor(state, dispatch)}
    </>
}

function bAnyUnsavedPageLayouts(state){

    const current = state.pageLayouts;
    const pending = state.pendingLayouts;

    for(let i = 0; i < current.length; i++){

        const c = current[i];
        
        for(let x = 0; x < pending.length; x++){

            const p = pending[x];

            if(p.page === c.page && p.item === c.item){

                if(p.page_order !== c.page_order) return true;
            }
        }
    }

    return false;
}

function bAnyUnsavedChanges(state){

    if(bAnyUnsavedPageLayouts(state)) return true;

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
        "pageLayouts": [],
        "pendingLayouts": {}
    });

    useEffect(() =>{
        loadData(dispatch);
    },[]);

    const tabOptions = state.tabs.map((t) =>{
        return {"name": t, "value": t}
    });

    tabOptions.sort((a, b) =>{
        
        a = a.name.toLowerCase();
        b = b.name.toLowerCase();

        if(a < b) return -1;
        if(a > b) return 1;
        return 0;
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