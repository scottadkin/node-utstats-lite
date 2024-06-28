"use client"
import Header from "../Header";
import { useEffect, useReducer } from "react";
import ErrorBox from "../ErrorBox";
import InteractiveTable from "../InteractiveTable";
import Tabs from "../Tabs";
import TrueFalseButton from "../TrueFalseButton";
import MessageBox from "../MessageBox";

// I really should clean up/remove duplicate code after initial testing

async function loadData(controller, dispatch){

    try{

        const req = await fetch("/api/admin?mode=load-ftp", {
            "headers": {"Content-type": "application/json"},
            "method": "GET",
            //"signal": controller.signal
        });

        const res = await req.json();

        if(res.error !== undefined){
            throw new Error(res.error);
        }

        dispatch({"type": "load-settings", "ftp": res.ftp, "logsFolder": res.logsFolder});


    }catch(err){
        if(err.name === "AbortError") return;
        dispatch({"type": "loadError", "message": err.toString()});
    }
}


async function addServer(state, dispatch){

    try{

        const req = await fetch("/api/admin/", {
            "headers": {"Content-type": "application/json"},
            "method": "POST",
            "body": JSON.stringify({"mode": "add-server",...state.createForm})
        });

        const res = await req.json();

        if(res.error !== undefined){
            dispatch({"type": "create-error", "message": res.error.toString()});
            return;
        }

        dispatch({"type": "clear-create-form"});

        await loadData("controller", dispatch);

    }catch(err){
        console.trace(err);
    }
}

async function deleteServer(state, dispatch){

    try{

        const req = await fetch("/api/admin/", {
            "headers": {"Content-type": "application/json"},
            "method": "POST",
            "body": JSON.stringify({"mode": "delete-server", "serverId": state.selectedServer})
        });

        const res = await req.json();

        if(res.error !== undefined){
            dispatch({"type": "delete-error", "message": res.error.toString()});
            return;
        }

        dispatch({"type": "clear-edit-form", "message": "Server Deleted Successfully"});
        dispatch({"type": "select-server", "value": null});

        await loadData("controller", dispatch);

    }catch(err){
        console.trace(err);
    }
}



async function updateServer(state, dispatch){

    try{

        const req = await fetch("/api/admin/", {
            "headers": {"Content-type": "application/json"},
            "method": "POST",
            "body": JSON.stringify({"mode": "update-server", ...state.editForm, "serverId": state.selectedServer})
        });

        const res = await req.json();

        if(res.error !== undefined){
            dispatch({"type": "edit-error", "message": res.error.toString()});
            return;
        }

        dispatch({"type": "update-edit-message", "message": `Server Updated Successfully`});

        await loadData("controller", dispatch);

    }catch(err){
        console.trace(err);
    }
}




const reducer = function (state, action){
    
    switch(action.type){

        case "load-settings":{
            return {
                ...state,
                "loading": false,
                "ftp": action.ftp,
                "logsFolder": action.logsFolder
            }
        }

        case "loadError": {
            return {
                ...state,
                "loadError": action.message
            }
        }

        case "create-error": {
            return {
                ...state,
                "createError": action.message
            }
        }

        case "select-server": {

            

            if(action.value === null){
                return {
                    ...state,
                    "selectedServer": null,
                };
            }

            const d = action.data;

            return {
                ...state,
                "selectedServer": action.value,
                "editForm": {
                    "name": d.name,
                    "host": d.host,
                    "port": d.port,
                    "user": d.user,
                    "password": d.password,
                    "folder": d.target_folder,
                    "bIgnoreBots": d.ignore_bots,
                    "bIgnoreDuplicates": d.ignore_duplicates,
                    "minPlayers": d.min_players,
                    "minPlaytime": d.min_playtime,
                    "bEnabled": d.enabled,
                    "bDeleteFromFTP": d.delete_after_import,
                    "sftp": d.sftp,
                    "bDeleteTmpFiles": d.delete_tmp_files
                }
            }
        }

        case "change-mode": {
            return {
                ...state,
                "mode": action.value,
                "createError": null,
                "createMessage": null,
                "editForm": {
                    "name": "",
                    "host": "",
                    "port": 21,
                    "user": "",
                    "password": "",
                    "folder": "",
                    "bIgnoreBots": 0,
                    "bIgnoreDuplicates": 0,
                    "minPlayers": 0,
                    "minPlaytime": 0,
                    "bEnabled": 1,
                    "bDeleteFromFTP": 1,
                    "sftp": 0,
                    "bDeleteTmpFiles": 0
                }
            }
        }

        case "update-create-form": {

            state.createForm[action.key] = action.value;
            return {
                ...state
            }
        }
        case "update-edit-form": {

            state.editForm[action.key] = action.value;
            return {
                ...state
            }
        }
        case "clear-create-form": {

            return {
                ...state,
                "createError": null,
                "createMessage": "Server added successfully",
                "createForm": {
                    "name": "",
                    "host": "",
                    "port": 21,
                    "user": "",
                    "password": "",
                    "folder": "",
                    "bIgnoreBots": 0,
                    "bIgnoreDuplicates": 0,
                    "minPlayers": 0,
                    "minPlaytime": 0,
                    "bEnabled": 1,
                    "bDeleteFromFTP": 1,
                    "sftp": 0,
                    "bDeleteTmpFiles": 0
                }
            }
        }

        case "clear-edit-form": {

            return {
                ...state,
                "mode": "0",
                "editError": null,
                "editMessage": action.message,
                "editForm": {
                    "name": "",
                    "host": "",
                    "port": 21,
                    "user": "",
                    "password": "",
                    "folder": "",
                    "bIgnoreBots": 0,
                    "bIgnoreDuplicates": 0,
                    "minPlayers": 0,
                    "minPlaytime": 0,
                    "bEnabled": 1,
                    "bDeleteFromFTP": 1,
                    "sftp": 0,
                    "bDeleteTmpFiles": 0
                }
            }
        }

        case "update-edit-message": {

            return {
                ...state,
                "editMessage": action.message
            }
        }
    }
    return state;
}

function renderServers(state, dispatch){

    if(state.mode !== "0") return null;
    if(state.ftp === null && state.logsFolder === null) return null;

    const headers = {
        "active": {"title": "Enabled"},
        "method": {"title": "Protocol"},
        "name": {"title": "Name"},
        "host": {"title": "Host"},
        "port": {"title": "Port"},
        "user": {"title": "User"},
        "password": {"title": "Password"},
        "target": {"title": "Target Folder"}
    };

    const rows = [];

    for(let i = 0; i < state.ftp.length; i++){

        const f = state.ftp[i];

        rows.push({
            "active": {"value": <TrueFalseButton key={i} value={f.enabled} bTableElem={true}/>, "bIgnoreTD": true},
            "method": {"value": (f.sftp === 0) ? "FTP" : "SFTP"},
            "name": {"value": f.name.toLowerCase(), "displayValue": f.name},
            "host": {"value": f.host, "displayValue": f.host},
            "port": {"value": f.port },
            "user": {"value": f.user.toLowerCase(), "displayValue": f.user},
            "password": {"value": f.password.toLowerCase(), "displayValue": f.password},
            "target": {"value": f.target_folder.toLowerCase(), "displayValue": f.target_folder}
   
        });
    }

    return <>
        <Header>Current FTP Servers</Header>
        <InteractiveTable width={1} headers={headers} rows={rows} bNoHeaderSorting={true}/>
    </>
}


function getServerData(ftpServers, selectedId){

    for(let i = 0; i < ftpServers.length; i++){

        const f = ftpServers[i];

        if(f.id === selectedId){
            return f;
        }
    }

    return null;
}

function renderDeleteServerButton(state, dispatch){

    if(state.selectedServer === null) return null;
    
    return <>
        <Header>Delete Selected Server</Header>
        <input type="button" className="warning-button margin-bottom-1" value="Delete Server" onClick={async () =>{
        await deleteServer(state, dispatch);
        }}/>
    </>
}

function renderEditServers(state, dispatch){

    if(state.mode !== "1") return null;

    const serverOptions = [];

    if(state.ftp !== null){

        for(let i = 0; i < state.ftp.length; i++){
            
            const f = state.ftp[i];
            serverOptions.push(<option key={f.id} value={f.id}>{f.name} ({f.host}:{f.port})</option>);
        }
    }

    return <>
        <Header>Edit FTP Server</Header>
        <MessageBox title="Server Added">{state.editMessage}</MessageBox>
        <div className="form-row">
            <div className="form-label">Selected Server</div>
            <select onChange={(e) =>{
                if(e.target.value === "0") return;
                dispatch({"type": "select-server", "value": e.target.value, "data": getServerData(state.ftp, parseInt(e.target.value))});
            }}>
                <option value="0">Please select an ftp server to edit</option>
                {serverOptions}
            </select>
        </div>
        <div className="form text-center">
            <div className="form-row">
                <label htmlFor="name">Name</label>
                <input className="textbox" type="text" name="name" placeholder="name..." value={state.editForm.name} onChange={(e) =>{
                    dispatch({"type": "update-edit-form", "key": "name", "value": e.target.value});
                }}
                />
            </div>
            <div className="form-row">
                <label htmlFor="host">Host</label>
                <input className="textbox" type="text" name="host" placeholder="127.0.0.1..." value={state.editForm.host} onChange={(e) =>{
                    dispatch({"type": "update-edit-form", "key": "host", "value": e.target.value});
                }}/>
            </div>
            <div className="form-row">
                <label htmlFor="port">Port</label>
                <input className="textbox" type="number" name="port" placeholder="21" min={0} max={65535} value={state.editForm.port} onChange={(e) =>{
                    dispatch({"type": "update-edit-form", "key": "port", "value": e.target.value});
                }}/>
            </div>
            <div className="form-row">
                <label>Use SFTP</label>
                <TrueFalseButton value={state.editForm.sftp} setValue={() =>{
                    
                    let newValue = 1;

                    if(state.editForm.sftp){
                        newValue = 0;
                    }

                    dispatch({"type": "update-edit-form", "key": "sftp", "value": newValue});
                }}/>
            </div>
            <div className="form-row">
                <label htmlFor="user">User</label>
                <input className="textbox" type="text" name="user" placeholder="FTP username" value={state.editForm.user} onChange={(e) =>{
                    dispatch({"type": "update-edit-form", "key": "user", "value": e.target.value});
                }}/>
            </div>
            <div className="form-row">
                <label htmlFor="password">Password</label>
                <input className="textbox" type="password" name="password" placeholder="password..." value={state.editForm.password} onChange={(e) =>{
                    dispatch({"type": "update-edit-form", "key": "password", "value": e.target.value});
                }}/>
            </div>
            <div className="form-row">
                <label htmlFor="folder">Target Folder</label>
                <input className="textbox" type="text" name="folder" placeholder="/UTServer/..." value={state.editForm.folder} onChange={(e) =>{
                    dispatch({"type": "update-edit-form", "key": "folder", "value": e.target.value});
                }}/>
            </div>
            <div className="form-row">
                <label htmlFor="min-players">Min Players</label>
                <input className="textbox" type="number" name="min-players" placeholder="0" min="0" value={state.editForm.minPlayers}
                    onChange={(e) =>{
                        dispatch({"type": "update-edit-form", "key": "minPlayers", "value": e.target.value});
                    }}
                />
            </div>
            <div className="form-row">
                <label htmlFor="min-playtime">Min Playtime(Seconds)</label>
                <input className="textbox" type="number" name="min-playtime" placeholder="0" min="0" value={state.editForm.minPlaytime}
                    onChange={(e) =>{
                        dispatch({"type": "update-edit-form", "key": "minPlaytime", "value":e.target.value});
                    }}
                />
            </div>
            <div className="form-row">
                <label>Ignore Bots</label>
                <TrueFalseButton value={state.editForm.bIgnoreBots} setValue={() =>{
        
                    let newValue = 1;

                    if(state.editForm.bIgnoreBots){
                        newValue = 0;
                    }

                    dispatch({"type": "update-edit-form", "key": "bIgnoreBots", "value": newValue});
                }}/>
            </div>
            <div className="form-row">
                <label>Ignore Duplicates</label>
                <TrueFalseButton value={state.editForm.bIgnoreDuplicates} setValue={() =>{
                    
                    let newValue = 1;

                    if(state.editForm.bIgnoreDuplicates){
                        newValue = 0;
                    }

                    dispatch({"type": "update-edit-form", "key": "bIgnoreDuplicates", "value": newValue});
                }}/>
            </div>
            <div className="form-row">
                <label>Delete Logs From FTP Server</label>
                <TrueFalseButton value={state.editForm.bDeleteFromFTP} setValue={() =>{
                    
                    let newValue = 1;

                    if(state.editForm.bDeleteFromFTP){
                        newValue = 0;
                    }

                    dispatch({"type": "update-edit-form", "key": "bDeleteFromFTP", "value": newValue});
                }}/>
            </div>
            <div className="form-row">
                <label>Delete TMP Files</label>
                <TrueFalseButton value={state.editForm.bDeleteTmpFiles} setValue={() =>{
                    
                    let newValue = 1;

                    if(state.editForm.bDeleteTmpFiles){
                        newValue = 0;
                    }

                    dispatch({"type": "update-edit-form", "key": "bDeleteTmpFiles", "value": newValue});
                }}/>
            </div>
            <div className="form-row">
                <label>Enabled</label>
                <TrueFalseButton value={state.editForm.bEnabled} setValue={() =>{
                    
                    let newValue = 1;

                    if(state.editForm.bEnabled){
                        newValue = 0;
                    }

                    dispatch({"type": "update-edit-form", "key": "bEnabled", "value": newValue});
                }}/>
            </div>
            <input type="button" className="submit-button margin-bottom-1" value="Update Server" onClick={async () =>{
               await updateServer(state, dispatch);
            }}/>

            {renderDeleteServerButton(state, dispatch)}
        </div>
    </>
}

function renderAddServer(state, dispatch){

    if(state.mode !== "2") return null;

    return <>
        <Header>Add FTP Server</Header>
        <MessageBox title="Server Added">{state.createMessage}</MessageBox>
        <div className="form text-center">
            <div className="form-row">
                <label htmlFor="name">Name</label>
                <input className="textbox" type="text" name="name" placeholder="name..." value={state.createForm.name} onChange={(e) =>{
                        dispatch({"type": "update-create-form", "key": "name", "value": e.target.value});
                    }}
                />
            </div>
            <div className="form-row">
                <label htmlFor="host">Host</label>
                <input className="textbox" type="text" name="host" placeholder="127.0.0.1..." value={state.createForm.host} onChange={(e) =>{
                        dispatch({"type": "update-create-form", "key": "host", "value": e.target.value});
                    }}/>
            </div>
            <div className="form-row">
                <label htmlFor="port">Port</label>
                <input className="textbox" type="number" name="port" placeholder="21" min={0} max={65535} value={state.createForm.port} onChange={(e) =>{
                        dispatch({"type": "update-create-form", "key": "port", "value": e.target.value});
                    }}/>
            </div>
            <div className="form-row">
                <label>Use SFTP</label>
                <TrueFalseButton value={state.createForm.sftp} setValue={() =>{
                    
                    let newValue = 1;

                    if(state.createForm.sftp){
                        newValue = 0;
                    }

                    dispatch({"type": "update-create-form", "key": "sftp", "value": newValue});
                }}/>
            </div>
            <div className="form-row">
                <label htmlFor="user">User</label>
                <input className="textbox" type="text" name="user" placeholder="FTP username" value={state.createForm.user} onChange={(e) =>{
                        dispatch({"type": "update-create-form", "key": "user", "value": e.target.value});
                    }}/>
            </div>
            <div className="form-row">
                <label htmlFor="password">Password</label>
                <input className="textbox" type="password" name="password" placeholder="password..." value={state.createForm.password} onChange={(e) =>{
                        dispatch({"type": "update-create-form", "key": "password", "value": e.target.value});
                    }}/>
            </div>
            <div className="form-row">
                <label htmlFor="folder">Target Folder</label>
                <input className="textbox" type="text" name="folder" placeholder="/UTServer/..." value={state.createForm.folder} onChange={(e) =>{
                        dispatch({"type": "update-create-form", "key": "folder", "value": e.target.value});
                    }}/>
            </div>
            <div className="form-row">
                <label htmlFor="min-players">Min Players</label>
                <input className="textbox" type="number" name="min-players" placeholder="0" min="0" value={state.createForm.minPlayers}
                    onChange={(e) =>{
                        dispatch({"type": "update-create-form", "key": "minPlayers", "value": e.target.value});
                    }}
                />
            </div>
            <div className="form-row">
                <label htmlFor="min-playtime">Min Playtime(Seconds)</label>
                <input className="textbox" type="number" name="min-playtime" placeholder="0" min="0" value={state.createForm.minPlaytime}
                    onChange={(e) =>{
                        dispatch({"type": "update-create-form", "key": "minPlaytime", "value":e.target.value});
                    }}
                />
            </div>
            <div className="form-row">
                <label>Ignore Bots</label>
                <TrueFalseButton value={state.createForm.bIgnoreBots} setValue={() =>{
        
                    let newValue = 1;

                    if(state.createForm.bIgnoreBots){
                        newValue = 0;
                    }

                    dispatch({"type": "update-create-form", "key": "bIgnoreBots", "value": newValue});
                }}/>
            </div>
            <div className="form-row">
                <label>Ignore Duplicates</label>
                <TrueFalseButton value={state.createForm.bIgnoreDuplicates} setValue={() =>{
                    
                    let newValue = 1;

                    if(state.createForm.bIgnoreDuplicates){
                        newValue = 0;
                    }

                    dispatch({"type": "update-create-form", "key": "bIgnoreDuplicates", "value": newValue});
                }}/>
            </div>
            <div className="form-row">
                <label>Delete Logs From FTP Server</label>
                <TrueFalseButton value={state.createForm.bDeleteFromFTP} setValue={() =>{
                    
                    let newValue = 1;

                    if(state.createForm.bDeleteFromFTP){
                        newValue = 0;
                    }

                    dispatch({"type": "update-create-form", "key": "bDeleteFromFTP", "value": newValue});
                }}/>
            </div>
            <div className="form-row">
                <label>Delete TMP Files</label>
                <TrueFalseButton value={state.createForm.bDeleteTmpFiles} setValue={() =>{
                    
                    let newValue = 1;

                    if(state.createForm.bDeleteTmpFiles){
                        newValue = 0;
                    }

                    dispatch({"type": "update-create-form", "key": "bDeleteTmpFiles", "value": newValue});
                }}/>
            </div>
            <div className="form-row">
                <label>Enabled</label>
                <TrueFalseButton value={state.createForm.bEnabled} setValue={() =>{
                    
                    let newValue = 1;

                    if(state.createForm.bEnabled){
                        newValue = 0;
                    }

                    dispatch({"type": "update-create-form", "key": "bEnabled", "value": newValue});
                }}/>
            </div>
            <input type="button" className="submit-button margin-bottom-1" value="Add Server" onClick={async () =>{
               await addServer(state, dispatch);

            }}/>
        </div>
    </>
}

export default function FTPManager(){


    const [state, dispatch] = useReducer(reducer, {
        "loading": true,
        "ftp": null,
        "logsFolder": null,
        "loadError": null,
        "createError": null,
        "createMessage": null,
        "editError": null,
        "editMessage": null,
        "selectedServer": null,
        "mode": "1",
        "createForm": {
            "name": "",
            "host": "",
            "port": 21,
            "user": "",
            "password": "",
            "folder": "",
            "bIgnoreBots": 0,
            "bIgnoreDuplicates": 0,
            "minPlayers": 0,
            "minPlaytime": 0,
            "bEnabled": 1,
            "bDeleteFromFTP": 1,
            "sftp": 0
        },
        "editForm": {
            "name": "",
            "host": "",
            "port": 21,
            "user": "",
            "password": "",
            "folder": "",
            "bIgnoreBots": 0,
            "bIgnoreDuplicates": 0,
            "minPlayers": 0,
            "minPlaytime": 0,
            "bEnabled": 1,
            "bDeleteFromFTP": 1
        }
    });

    useEffect(() =>{

        const controller = new AbortController();

        loadData(controller, dispatch);

        return () =>{
            controller.abort();
        }

    },[]);



    return <div>
        <Header>FTP Manager</Header>
        <Tabs 
            options={[
                {"name": "Server List", "value": "0"},
                {"name": "Edit Servers", "value": "1"},
                {"name": "Add Server", "value": "2"},
            ]} 
            selectedValue={state.mode} 
            changeSelected={(value)=>{
                dispatch({"type": "change-mode", "value": value});
            }
        }/>
        
        <ErrorBox title="There was a problem loading FTP settings">{state.loadError}</ErrorBox>
        <ErrorBox title="There was a problem adding the ftp server">{state.createError}</ErrorBox>
        {renderServers(state)}
        {renderEditServers(state, dispatch)}
        {renderAddServer(state, dispatch)}
    </div>
}