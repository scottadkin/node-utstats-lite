import Header from "../Header";
import InteractiveTable from "../InteractiveTable";
import { ignore0, plural, getTeamColorClass } from "@/app/lib/generic.mjs";

function bHadAnyEvents(playerData){

    const events = [
        "spree_1","spree_2","spree_3","spree_4","spree_5","spree_best",
        "multi_1","multi_2","multi_3","multi_4","multi_best",
    ];

    for(let i = 0; i < events.length; i++){

        const e = events[i];

        if(e === "multi_best"){
            if(playerData[e] < 2) continue;
        }

        if(e === "spree_best"){
            if(playerData[e] < 5) continue;
        }

        if(playerData[e] !== 0) return true;
    }

    return false;
}

export default function SpecialEvents({data, totalTeams}){

    data = JSON.parse(data);
    const headers = {
        "player": {"title": <>Player</>},
        "double": {"title": <>Double Kill</>},
        "multi": {"title": <>Multi Kill</>},
        "ultra": {"title": <>Ultra Kill</>},
        "monster": {"title": <>Monster Kill</>},
        "bestMulti": {"title": <>Best Multi Kill</>},
        "spree": {"title": <>Killing Spree</>},
        "rampage": {"title": <>Rampage</>},
        "dominating": {"title": <>Dominating</>},
        "unstoppable": {"title": <>Unstoppable</>},
        "godlike": {"title": <>Godlike</>},
        "bestSpree": {"title": <>Best Spree</>},
    };

    const rows = [];

    console.log(data);

    for(let i = 0; i < data.playerData.length; i++){

        const p = data.playerData[i];

        if(!bHadAnyEvents(p)) continue;

        let teamColor = "";

        if(totalTeams > 0){
            teamColor = getTeamColorClass(p.team);
        }

        rows.push({
            "player": {
                "value": p.name.toLowerCase(), 
                "displayValue": <>{p.name}</>,
                "className": `text-left ${teamColor}`
            },
            "double": {"value": p.multi_1, "displayValue": ignore0(p.multi_1)},
            "multi": {"value": p.multi_2, "displayValue":  ignore0(p.multi_2)},
            "ultra": {"value": p.multi_3, "displayValue":  ignore0(p.multi_3)},
            "monster": {"value": p.multi_4, "displayValue":  ignore0(p.multi_4)},
            "bestMulti": {"value": p.multi_best, "displayValue":  <>{p.multi_best} {plural(p.multi_best, "kill")}</>},
            "spree": {"value": p.spree_1, "displayValue":  ignore0(p.spree_1)},
            "rampage": {"value": p.spree_2, "displayValue":  ignore0(p.spree_2)},
            "dominating": {"value": p.spree_3, "displayValue":  ignore0(p.spree_3)},
            "unstoppable": {"value": p.spree_4, "displayValue":  ignore0(p.spree_4)},
            "godlike": {"value": p.spree_5, "displayValue":  ignore0(p.spree_5)},
            "bestSpree": {"value": p.spree_best, "displayValue":  <>{p.spree_best} {plural(p.spree_best, "kill")}</>},
        });
    }

    return <div className="test">
        <Header>Special Events</Header>
        <InteractiveTable headers={headers} rows={rows}/>
    </div>
}