import { toPlaytime, ignore0 } from "@/app/lib/generic.mjs";
import Header from "../Header";
import InteractiveTable from "../InteractiveTable";


function renderBasicTable(data, totalKills){

    const headers = {
        "name": {"title": "Name"},
        "deaths": {"title": "Deaths"},
        "suicides": {"title": "Suicides"},
        "tk": {"title": "Team Kills"},
        "kills": {"title": "Kills"},
        "kp": {"title": "Kills Percentage", "mouseOverBox": {"content": "Percentage of total kills on the current map.", "title": "Percentage Of Total Kills"}},
        "kpm": {"title": "KPM", "mouseOverBox": {"content": "The average amount of kills with a weapon per minute.", "title": "Kills Per Minute"}},
    };

    const totals = {
        "deaths": 0,
        "suicides": 0,
        "tk": 0,
        "kills": 0,
    };

    const rows = [];

    for(let i = 0; i < data.length; i++){

        const d = data[i];

        let kp = 0;

        if(totalKills > 0 && d.kills > 0){
            kp = (d.kills / totalKills) * 100;
        }

        totals.deaths += d.deaths;
        totals.kills += d.kills;
        totals.tk += d.team_kills;
        totals.suicides += d.suicides;

        rows.push({
            "name": {"value": d.name.toLowerCase(), "displayValue": d.name, "className": "text-left"},
            "deaths": {"value": d.deaths, "displayValue": ignore0(d.deaths)},
            "suicides": {"value": d.suicides, "displayValue": ignore0(d.suicides)},
            "tk": {"value": d.team_kills, "displayValue": ignore0(d.team_kills)},
            "kills": {"value": d.kills, "displayValue": ignore0(d.kills)},
            "kp": {"value": kp, "displayValue":  <>{kp.toFixed(3)}%</>},
            "kpm": {"value": d.kills_per_min, "displayValue":  d.kills_per_min.toFixed(3)},
        });
    }

    if(rows.length > 0){

        rows.push({
            "bAlwaysLast": true,
            "name": {"value": "", "displayValue": "Total", "className": "text-left team-none"},
            "playtime": {"value": 0, "displayValue": <>&nbsp;</>, "className": "team-none"},
            "deaths": {"value": totals.deaths, "displayValue": ignore0(totals.deaths), "className": "team-none"},
            "suicides": {"value": totals.suicides, "displayValue": ignore0(totals.suicides), "className": "team-none"},
            "tk": {"value": totals.tk, "displayValue": ignore0(totals.tk), "className": "team-none"},
            "kills": {"value": totals.kills, "displayValue": ignore0(totals.kills), "className": "team-none"},
            "kp": {"value": "kp", "displayValue":  "100%", "className": "team-none"},
            "kpm": {"value": "", "className": "team-none"}
        });
    }

    return <InteractiveTable width={1} headers={headers} rows={rows}/>

}

export default function WeaponStats({data}){

    console.log(data);

    let totalKills = 0;

    for(let i = 0; i < data.length; i++){

        const d = data[i];

        totalKills += d.kills;
    }

    return <>
        <Header>Weapon Statistics</Header>
        {renderBasicTable(data, totalKills)}
    </>
}