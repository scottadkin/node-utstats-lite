"use client"
import { ignore0 } from "@/app/lib/generic.mjs";
import Header from "../Header";
import InteractiveTable from "../InteractiveTable";
import Tabs from "../Tabs";
import { useState } from "react";

export default function WeaponStats({totals, weaponNames, gametypeNames}){

    const [mode, setMode] = useState("0");

    const headers = {
        "weapon": {"title": "Weapon"},
        "matches": {"title": "Matches"},
        "teamKills": {"title": "Team Kills"},
        "deaths": {"title": "Deaths"},
        "kills": {"title": "Kills"},
        "eff": {"title": "Efficiency"},
    };

    const rows = [];


    for(let i = 0; i < totals.length; i++){

        const t = totals[i];
        if(t.gametype_id != mode) continue;

        const weapon = weaponNames[t.weapon_id] ?? "Not Found";

        rows.push({
            "weapon": {
                "value": weapon.toLowerCase(), 
                "displayValue": weapon,
                "className": "text-left"
            },
            "matches": {
                "value": t.total_matches,
                "displayValue": ignore0(t.total_matches)
            },
            "teamKills": {
                "value": t.team_kills,
                "displayValue": ignore0(t.team_kills)
            },
            "deaths": {
                "value": t.deaths,
                "displayValue": ignore0(t.deaths)
            },
            "kills": {
                "value": t.kills,
                "displayValue": ignore0(t.kills)
            },
            "eff": {
                "value": t.eff,
                "displayValue": `${t.eff.toFixed(2)}%`
            }
            
        });
    }

    const tabOptions = [];

    for(const [id, name] of Object.entries(gametypeNames)){

        tabOptions.push({
            "name": name,
            "value": id
        });
    }

    const tabsElem = (totals.length < 2 ) ? null : <Tabs options={tabOptions} selectedValue={mode} changeSelected={(value) =>{
        setMode(value);
    }}/>;

    return <>
        <Header>Weapon Stats</Header>
        {tabsElem}
        <InteractiveTable headers={headers} rows={rows}/>
    </>
}