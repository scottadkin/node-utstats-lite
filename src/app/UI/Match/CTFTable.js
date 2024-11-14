"use client"
import InteractiveTable from "../InteractiveTable";
import { getTeamColorClass, getPlayer, ignore0 } from "@/app/lib/generic.mjs";
import Header from "../Header";
import Tabs from "../Tabs";
import { useState } from "react";
import PlayerLink from "../PlayerLink";


function createGeneralRow(player, d){

    return {
        "player": {
            "value": player.name.toLowerCase(), 
            "displayValue": <PlayerLink id={d.player_id} country={player.country}>{player.name}</PlayerLink>,
            "className": `player-name-td text-left ${getTeamColorClass(player.team)}`
        },
        "taken": {"value": d.flag_taken, "displayValue": ignore0(d.flag_taken)},
        "pickup": {"value": d.flag_pickup, "displayValue": ignore0(d.flag_pickup)},
        "drop": {"value": d.flag_drop, "displayValue": ignore0(d.flag_drop)},
        "assist": {"value": d.flag_assist, "displayValue": ignore0(d.flag_assist)},
        "cover": {"value": d.flag_cover, "displayValue": ignore0(d.flag_cover)},
        "seal": {"value": d.flag_seal, "displayValue": ignore0(d.flag_seal)},
        "cap": {"value": d.flag_assist, "displayValue": ignore0(d.flag_cap)},
        "kill": {"value": d.flag_kill, "displayValue": ignore0(d.flag_kill)},
        "return": {"value": d.flag_return, "displayValue": ignore0(d.flag_return)},
    };
}


function createReturnRow(player, d){

    return {
        "player": {
            "value": player.name.toLowerCase(), 
            "displayValue": <PlayerLink id={d.player_id} country={player.country}>{player.name}</PlayerLink>,
            "className": `player-name-td text-left ${getTeamColorClass(player.team)}`
        },
        "return": {"value": d.flag_return, "displayValue": ignore0(d.flag_return)},
        "returnBase": {"value": d.flag_return_base, "displayValue": ignore0(d.flag_return_base)},
        "returnMid": {"value": d.flag_return_mid, "displayValue": ignore0(d.flag_return_mid)},
        "returnEnemyBase": {"value": d.flag_return_enemybase, "displayValue": ignore0(d.flag_return_enemybase)},
        "returnSave": {"value": d.flag_save, "displayValue": ignore0(d.flag_save)},
    };
}

export default function CTFTable({players, data}){

    const [selectedTab, setSelectedTab] = useState("general");

    if(data.length === 0) return null;

    const rows = {};

    const tableHeaders = {
        "general": {
            "player": {"title": "Player"},
            "taken": {"title": "Taken", "mouseOverBox": {"title": "Flag Taken", "content": "Player took the flag from the enemy flag stand."}},
            "pickup": {"title": "Pickup", "mouseOverBox": {"title": "Flag Picked Up", "content": "Player picked up a dropped enemy flag."}},
            "drop": {"title": "Drop", "mouseOverBox": {"title": "Flag Dropped", "content": "Player dropped the enemy flag."}},
            "assist": {"title": "Assist", "mouseOverBox": {"title": "Flag Assist", "content": "Player had some flag carry time but another played capped the flag."}},
            "cover": {"title": "Cover", "mouseOverBox": {"title": "Flag Cover", "content": "Player killed an enemy close to a teammate carrying the enemy flag."}},
            "seal": {"title": "Seal", "mouseOverBox": {"title": "Flag Seal", "content": "Player sealed off their base when a teammate had the enemy flag."}},
            "cap": {"title": "Capture", "mouseOverBox": {"title": "Flag Capture", "content": "Player captured the enemy flag."}},
            "kill": {"title": "Kill", "mouseOverBox": {"title": "Flag Kill", "content": "Player killed an enemy carrying their flag."}},
            "return": {"title": "Return", "mouseOverBox": {"title": "Flag Return", "content": "Player returned their flag."}},

        }, "returns": {
            "player": {"title": "Player"},
            "return": {"title": "Return", "mouseOverBox": {"title": "Flag Return", "content": "Player returned their flag."}},
            "returnBase": {"title": "Return Base", "mouseOverBox": {"title": "Flag Return Home Base", "content": "Player returned their flag from their base."}},
            "returnMid": {"title": "Return Mid", "mouseOverBox": {"title": "Flag Return Mid", "content": "Player returned their flag from the middle of the map."}},
            "returnEnemyBase": {"title": "Return Enemy Base", "mouseOverBox": {"title": "Flag Return Enemy Base", "content": "Player returned their flag from the enemy base."}},
            "returnSave": {"title": "Return Close Save", "mouseOverBox": {"title": "Flag Return Close Save", "content": "Player returned their flag from near the enemy flag."}},
        }
    };


    for(let i = 0; i < data.length; i++){

        const d = data[i];

        const player = getPlayer(players, d.player_id); 

        if(player.bSpectator !== 0) continue;


        if(rows[player.team] === undefined){
            rows[player.team] = [];
        }

        if(selectedTab === "general"){
            rows[player.team].push(createGeneralRow(player, d));
        }else{
            rows[player.team].push(createReturnRow(player, d));
        }
    }

    const tables = [];

    for(const [teamId, tableRows] of Object.entries(rows)){

        const headers = (selectedTab === "general") ? tableHeaders.general : tableHeaders.returns;

        tables.push(<InteractiveTable width={1} key={teamId} headers={headers} rows={tableRows}/>);
    }

    const tabs = [
        {"name": "General", "value": "general"},
        {"name": "Returns", "value": "returns"},
    ];

    return <>
        <Header>CTF Summary</Header>
        <Tabs options={tabs} selectedValue={selectedTab} changeSelected={setSelectedTab}/>
        {tables}
    </>
}