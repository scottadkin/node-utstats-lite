"use client"
import { ignore0 } from "@/app/lib/generic.mjs";
import Header from "../Header";
import InteractiveTable from "../InteractiveTable";

export default function CTFTotals({data, gametypeNames}){

    console.log(data);

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

    return <>
        <Header>CTF Stats</Header>
        <InteractiveTable width={1} headers={headers} rows={rows}/>
    </>
}