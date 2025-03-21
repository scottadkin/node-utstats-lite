"use client"
import InteractiveTable from "../InteractiveTable";
import { getTeamColorClass, getPlayer, ignore0, toPlaytime } from "@/app/lib/generic.mjs";
import Header from "../Header";
import Tabs from "../Tabs";
import { useState } from "react";
import PlayerLink from "../PlayerLink";


const initialGeneralTotals = {
    "taken": 0,
    "pickup": 0,
    "drop": 0,
    "assist": 0,
    "cover": 0,
    "seal": 0,
    "cap": 0,
    "kill": 0,
    "return": 0, 
    "players": 0,
    "carryTime": 0
};

const initialReturnTotals = {
    "return": 0,
    "returnBase": 0,
    "returnMid": 0,
    "returnEnemyBase": 0,
    "returnSave": 0,
    "players": 0
};

const initialCarryTotals = {
    "total": 0,
    "max": 0,
    "timesHeld": 0,
    "average": 0
};

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
        "carryTime": {"value": d.flag_carry_time, "displayValue": toPlaytime(d.flag_carry_time, true), "className": "date"},
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
        "returnEnemyBase": {"value": d.flag_return_enemy_base, "displayValue": ignore0(d.flag_return_enemy_base)},
        "returnSave": {"value": d.flag_return_save, "displayValue": ignore0(d.flag_return_save)},
    };
}

function createCarryRow(player, d){

    let avg = 0;

    const held = d.flag_taken + d.flag_pickup;

    if(held > 0 && d.flag_carry_time > 0){

        avg = d.flag_carry_time / held;
    }

    return {
        "player": {
            "value": player.name.toLowerCase(), 
            "displayValue": <PlayerLink id={d.player_id} country={player.country}>{player.name}</PlayerLink>,
            "className": `player-name-td text-left ${getTeamColorClass(player.team)}`
        },
        "total": {
            "value": d.flag_carry_time,
            "displayValue": toPlaytime(d.flag_carry_time, true),
            "className": "date"
        },
        "max": {
            "value": d.flag_carry_time_max,
            "displayValue": toPlaytime(d.flag_carry_time_max, true),
            "className": "date"
        },
        "timesHeld": {
            "value": held,
            "displayValue": ignore0(held)
        },
        "avg": {
            "value": avg,
            "displayValue": toPlaytime(avg, true),
            "className": "date"
        }
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
            "carryTime": {"title": "Carry Time", "mouseOverBox": {"title": "Flag Carry Time", "content": "How long the player held the enemy flag."}},

        }, "returns": {
            "player": {"title": "Player"},
            "return": {"title": "Return", "mouseOverBox": {"title": "Flag Return", "content": "Player returned their flag."}},
            "returnBase": {"title": "Return Base", "mouseOverBox": {"title": "Flag Return Home Base", "content": "Player returned their flag from their base."}},
            "returnMid": {"title": "Return Mid", "mouseOverBox": {"title": "Flag Return Mid", "content": "Player returned their flag from the middle of the map."}},
            "returnEnemyBase": {"title": "Return Enemy Base", "mouseOverBox": {"title": "Flag Return Enemy Base", "content": "Player returned their flag from the enemy base."}},
            "returnSave": {"title": "Return Close Save", "mouseOverBox": {"title": "Flag Return Close Save", "content": "Player returned their flag from near the enemy flag."}},
        }, "carry": {
            "player": {"title": "Player"},
            "timesHeld": {"title": "Times Held", "mouseOverBox": {"title": "Times Held", "content": "How many times did the player have the flag during the match."}},
            "max": {"title": "Max Carry Time", "mouseOverBox": {"title": "Max Flag Carry Time", "content": "How long the player held the enemy flag for a single time."}},
            "avg": {"title": "Avg Carry Time", "mouseOverBox": {"title": "Average Flag Carry Time", "content": "Average time the player held the enemy flag for."}},
            "total": {"title": "Total Carry Time", "mouseOverBox": {"title": "Total Flag Carry Time", "content": "How long the player held the enemy flag for."}},
        }
    };


    let totals = [];


    for(let i = 0; i < data.length; i++){

        const d = data[i];

        const player = getPlayer(players, d.player_id); 

        if(player.bSpectator !== 0) continue;
        if(player.team === 255) continue;


        if(totals[player.team] === undefined){


            if(selectedTab === "general") totals[player.team] = {...initialGeneralTotals};
            if(selectedTab === "returns") totals[player.team] = {...initialReturnTotals};
            if(selectedTab === "carry") totals[player.team] = {...initialCarryTotals};
        }


        if(rows[player.team] === undefined){
            rows[player.team] = [];
        }

        

        const t = totals[player.team];

        t.players++;

        if(selectedTab === "general"){

            rows[player.team].push(createGeneralRow(player, d));

            t.taken += d.flag_taken;
            t.pickup +=  d.flag_pickup;
            t.drop +=  d.flag_drop;
            t.assist +=  d.flag_assist;
            t.cover +=  d.flag_cover;
            t.seal +=  d.flag_seal;
            t.cap += d.flag_cap;
            t.kill += d.flag_kill;
            t.return += d.flag_return;
            t.carryTime += d.flag_carry_time;

        }else if(selectedTab === "returns"){
            rows[player.team].push(createReturnRow(player, d));

            t.return += d.flag_return;
            t.returnBase += d.flag_return_base;
            t.returnMid += d.flag_return_mid;
            t.returnEnemyBase += d.flag_return_enemy_base;
            t.returnSave += d.flag_return_save;

        }else if(selectedTab === "carry"){
            rows[player.team].push(createCarryRow(player, d));
            t.total += d.flag_carry_time;
            if(d.flag_carry_time_max > t.max) t.max = d.flag_carry_time_max;
            t.timesHeld += d.flag_taken + d.flag_pickup; 
        }
    }

    const tables = [];

    for(const [teamId, tableRows] of Object.entries(rows)){

        let headers = {};

        if(selectedTab === "general") headers = tableHeaders.general;
        if(selectedTab === "returns") headers = tableHeaders.returns;
        if(selectedTab === "carry") headers = tableHeaders.carry;


        const t = totals[teamId];

        if(selectedTab === "general"){

            tableRows.push(
                 {
                    "bAlwaysLast": true,
                    "player": {
                        "value": "", 
                        "displayValue": "Total",
                        "className": `player-name-td text-left team-none`
                    },
                    "taken": {"value": t.taken, "displayValue": ignore0(t.taken), "className": "team-none"},
                    "pickup": {"value": t.pickup, "displayValue": ignore0(t.pickup), "className": "team-none"},
                    "drop": {"value": t.drop, "displayValue": ignore0(t.drop), "className": "team-none"},
                    "assist": {"value": t.assist, "displayValue": ignore0(t.assist), "className": "team-none"},
                    "cover": {"value": t.cover, "displayValue": ignore0(t.cover), "className": "team-none"},
                    "seal": {"value": t.seal, "displayValue": ignore0(t.seal), "className": "team-none"},
                    "cap": {"value": t.cap, "displayValue": ignore0(t.cap), "className": "team-none"},
                    "kill": {"value": t.kill, "displayValue": ignore0(t.kill), "className": "team-none"},
                    "return": {"value": t.return, "displayValue": ignore0(t.return), "className": "team-none"},
                    "carryTime": {"value": t.carryTime, "displayValue": toPlaytime(t.carryTime, true), "className": "team-none"},
                }
            );

        }else if(selectedTab === "returns"){

            tableRows.push(
                {
                   "bAlwaysLast": true,
                   "player": {
                       "value": "", 
                       "displayValue": "Total",
                       "className": `player-name-td text-left team-none`
                   },
                   "return": {"value": t.return, "displayValue": ignore0(t.return), "className": "team-none"},
                    "returnBase": {"value": t.returnBase, "displayValue": ignore0(t.returnBase), "className": "team-none"},
                    "returnMid": {"value": t.returnMid, "displayValue": ignore0(t.returnMid), "className": "team-none"},
                    "returnEnemyBase": {"value": t.returnEnemyBase, "displayValue": ignore0(t.returnEnemyBase), "className": "team-none"},
                    "returnSave": {"value": t.returnSave, "displayValue": ignore0(t.returnSave), "className": "team-none"},
        
               }
           );

        }else if(selectedTab === "carry"){

            let avg = 0;

            if(t.timesHeld > 0 && t.total > 0){

                avg = t.total / t.timesHeld;
            }

            tableRows.push(
                {
                   "bAlwaysLast": true,
                   "player": {
                       "value": "", 
                       "displayValue": "Total",
                       "className": `player-name-td text-left team-none`
                   },
                   "total": {
                        "value": t.total,
                        "displayValue": toPlaytime(t.total),
                        "className": "date team-none"
                   },
                   "max": {
                        "value": t.max,
                        "displayValue": toPlaytime(t.max),
                        "className": "date team-none"
                   },
                   "timesHeld": {
                        "value": t.timesHeld,
                        "displayValue": ignore0(t.timesHeld),
                        "className": "team-none"
                   },
                   "avg": {
                        "value": avg,
                        "displayValue": toPlaytime(avg, true),
                        "className": "date team-none"
                   }
                }
            );
        }

        tables.push(<InteractiveTable width={1} key={teamId} headers={headers} rows={tableRows}/>);
    }

    const tabs = [
        {"name": "General", "value": "general"},
        {"name": "Returns", "value": "returns"},
        {"name": "Carry Time", "value": "carry"},
    ];


    let bFoundData = false;

    for(let i = 0; i < totals.length; i++){

        const keys = Object.keys(totals[i]);

        for(let x = 0; x < keys.length; x++){

            if(keys[x] === "players") continue;
            
            if(totals[i][keys[x]] > 0){
                bFoundData = true;
                break;
            }
        }

        if(bFoundData) break;
    }

    if(!bFoundData) return null;

    return <>
        <Header>CTF Summary</Header>
        <Tabs options={tabs} selectedValue={selectedTab} changeSelected={setSelectedTab}/>
        {tables}
    </>
}