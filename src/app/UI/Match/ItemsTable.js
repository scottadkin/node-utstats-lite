"use client"
import InteractiveTable from "../InteractiveTable";
import Header from "../Header";
import { getTeamColorClass, ignore0 } from "@/app/lib/generic.mjs";
import CountryFlag from "../CountryFlag";

function bAnyData(data){

    const types = ["pads", "shp", "invis", "belt", "amp"];

    for(let x = 0; x < types.length; x++){

        const t = types[x];

        if(data[`item_${t}`] > 0) return true;

    }

    return false;
}

export default function ItemsTable({data, totalTeams}){


    const headers = {
        "player": {"title": "Player"},
        "pads": {"title": "Thigh Pads"},
        "shp": {"title": "Super Health Pack"},
        "invis": {"title": "Invisibility"},
        "belt": {"title": "Shield Belt"},
        "amp": {"title": "Damage Amp"},
        "boots": {"title": "Jump Boots"},
    };

    const rows = [];

    

    for(let i = 0; i < data.length; i++){

        const d = data[i];
        //if(d.bSpectator === 1) continue;

        if(!bAnyData(d)) continue;

        rows.push({
            "player": {
                "value": d.name.toLowerCase(), 
                "displayValue":<><CountryFlag code={d.country}/>{d.name}</>,
                "className": `player-name-td ${(totalTeams > 0) ? getTeamColorClass(d.team) : ""} text-left`
            },
            "pads": {"value": d.item_pads, "displayValue": ignore0(d.item_pads)},
            "shp": {"value": d.item_shp, "displayValue": ignore0(d.item_shp)},
            "invis": {"value": d.item_invis, "displayValue": ignore0(d.item_invis)},
            "belt": {"value": d.item_belt, "displayValue": ignore0(d.item_belt)},
            "amp": {"value": d.item_amp, "displayValue": ignore0(d.item_amp)},
            "boots": {"value": d.item_boots, "displayValue": ignore0(d.item_boots)},
        });
    }

    if(rows.length === 0) return null;

    return <>
        <Header>Items Summary</Header>
        <InteractiveTable headers={headers} rows={rows}/>
    </>
}