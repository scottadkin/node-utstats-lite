"use client"
import { ignore0 } from "@/app/lib/generic.mjs";
import Header from "../Header";
import InteractiveTable from "../InteractiveTable";
import Tabs from "../Tabs";
import { useState } from "react";

function createGeneral(data, gametypeNames){

    const headers = {
        "name": {"title": "Gametype"},
        "matches": {"title": "Matches"},
        "taken": {
            "title": "Taken", 
            "mouseOverBox": {
                "title": "Flag Taken", 
                "content": "Player took the flag from the enemy base"
            }
        },
        "pickup": {
            "title": "Pickup", 
            "mouseOverBox": {
                "title": "Flag Taken", 
                "content": "Player picked up a dropped enemy flag"
            }
        },
        "drop": {
            "title": "Drop", 
            "mouseOverBox": {
                "title": "Flag Dropped", 
                "content": "Player dropped the enemy flag"
            }
        },
        "assist": {
            "title": "Assist", 
            "mouseOverBox": {
                "title": "Flag Assist", 
                "content": "Player had flag carry time of a flag that was captured"
            }
        },
        "cover": {
            "title": "Cover", 
            "mouseOverBox": {
                "title": "Flag Cover", 
                "content": "Player covered their flag carrier"
            }
        },
        "seal": {
            "title": "Seal", 
            "mouseOverBox": {
                "title": "Flag Seal", 
                "content": "Player sealed off their base when a teammate had the enemy flag"
            }
        },
        "capture": {
            "title": "Capture", 
            "mouseOverBox": {
                "title": "Flag Capture", 
                "content": "Player captured the enemy flag"
            }
        },
        "kill": {
            "title": "Kill", 
            "mouseOverBox": {
                "title": "Flag Kill", 
                "content": "Player killed the enemy flag carrier"
            }
        },
        "return": {
            "title": "Return", 
            "mouseOverBox": {
                "title": "Flag Return", 
                "content": "Player returned their flag"
            }
        }
    };

    const rows = data.map((d) =>{

        const gametypeName = gametypeNames[d.gametype_id] ?? "Not Found";

        return {
            "name": {
                "value": gametypeName.toLowerCase(), 
                "displayValue": gametypeName,
                "className": "text-left"
            },
            "matches": {
                "value": d.total_matches,
                "displayValue": ignore0(d.total_matches),
            },
            "taken": {
                "value": d.flag_taken, "displayValue": ignore0(d.flag_taken)
            },
            "pickup": {
                "value": d.flag_pickup, "displayValue": ignore0(d.flag_pickup)
            },
            "drop": {
                "value": d.flag_drop, "displayValue": ignore0(d.flag_drop)
            },
            "assist": {
                "value": d.flag_assist, "displayValue": ignore0(d.flag_assist)
            },
            "cover": {
                "value": d.flag_cover, "displayValue": ignore0(d.flag_cover)
            },
            "seal": {
                "value": d.flag_seal, "displayValue": ignore0(d.flag_seal)
            },
            "capture": {
                "value": d.flag_cap, "displayValue": ignore0(d.flag_cap)
            },
            "kill": {
                "value": d.flag_kill, "displayValue": ignore0(d.flag_kill)
            },
            "return": {
                "value": d.flag_return, "displayValue": ignore0(d.flag_return)
            }
        }
    });

    return {headers, rows};
}

function createReturns(data, gametypeNames){

    const headers = {
        "gametype": {"title": "Gametype"},
        "return": {"title": "Return"},
        "returnBase": {"title": "Return Home Base"},
        "returnMid": {"title": "Return Mid"},
        "returnEB": {"title": "Return Enemy Base"},
        "returnSave": {"title": "Return Close Save"}
    };

    const rows = data.map((d) =>{

        const gametypeName = gametypeNames[d.gametype_id] ?? "Not found";

        return {
            "gametype": {
                "value": gametypeName.toLowerCase(),
                "displayValue": gametypeName,
                "className": "text-left"
            },
            "return": {
                "value": d.flag_return, "displayValue": ignore0(d.flag_return)
            },
            "returnBase": {
                "value": d.flag_return_base, "displayValue": ignore0(d.flag_return_base)
            },
            "returnMid": {
                "value": d.flag_return_mid, "displayValue": ignore0(d.flag_return_mid)
            },
            "returnEB": {
                "value": d.flag_return_enemy_base, "displayValue": ignore0(d.flag_return_enemy_base)
            },
            "returnSave": {
                "value": d.flag_return_save, "displayValue": ignore0(d.flag_return_save)
            }
        }
    });

    return {headers, rows};
}

export default function CTFTotals({data, gametypeNames}){

    const [mode, setMode] = useState("0");

    let headers = {};
    let rows = [];

    if(mode === "0"){
        const gData = createGeneral(data, gametypeNames);
        headers = gData.headers;
        rows = gData.rows;
    }else{
        const cData = createReturns(data, gametypeNames);
        headers = cData.headers;
        rows = cData.rows;
    }


    return <>
        <Header>CTF Stats</Header>
        <Tabs 
            options={[
                {"name": "General", "value": "0"},
                {"name": "Returns", "value": "1"},
            ]} 
            selectedValue={mode}
            changeSelected={(value) =>{
                setMode(value);
            }}
        />
        <InteractiveTable width={1} headers={headers} rows={rows}/>
    </>
}