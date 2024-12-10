"use client"
import InteractiveTable from "../InteractiveTable";
import Header from "../Header";
import { getTeamColorClass, ignore0 } from "@/app/lib/generic.mjs";
import PlayerLink from "../PlayerLink";

const initalTotals = {
    "body": 0,
    "pads": 0,
    "shp": 0,
    "invis": 0,
    "belt": 0,
    "amp": 0,
    "boots": 0,
};

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
        "body": {"title": "Body Armour"},
        "pads": {"title": "Thigh Pads"},
        "shp": {"title": "Super Health Pack"},
        "invis": {"title": "Invisibility"},
        "belt": {"title": "Shield Belt"},
        "amp": {"title": "Damage Amp"},
        "boots": {"title": "Jump Boots"},
    };

    const rows = [];

    const totals = [];

    for(let i = 0; i < data.length; i++){

        const d = data[i];
        //if(d.bSpectator === 1) continue;

        if(!bAnyData(d)) continue;

        let team = 0;

        if(totalTeams > 1) team = d.team;

        if(rows[team] === undefined) rows[team] = [];

        rows[team].push({
            "player": {
                "value": d.name.toLowerCase(), 
                "displayValue":<PlayerLink id={d.player_id} country={d.country}>{d.name}</PlayerLink>,
                "className": `player-name-td ${(totalTeams > 0) ? getTeamColorClass(d.team) : ""} text-left`
            },
            "body": {"value": d.item_body, "displayValue": ignore0(d.item_body)},
            "pads": {"value": d.item_pads, "displayValue": ignore0(d.item_pads)},
            "shp": {"value": d.item_shp, "displayValue": ignore0(d.item_shp)},
            "invis": {"value": d.item_invis, "displayValue": ignore0(d.item_invis)},
            "belt": {"value": d.item_belt, "displayValue": ignore0(d.item_belt)},
            "amp": {"value": d.item_amp, "displayValue": ignore0(d.item_amp)},
            "boots": {"value": d.item_boots, "displayValue": ignore0(d.item_boots)},
        });

        if(totals[team] === undefined) totals[team] = {...initalTotals};

        const t = totals[team];

        t.body += d.item_body
        t.pads += d.item_pads
        t.shp += d.item_shp
        t.invis += d.item_invis
        t.belt += d.item_belt;
        t.amp += d.item_amp;
        t.boots += d.item_boots;
    }

    const tables = [];

    for(let i = 0; i < rows.length; i++){


        if(rows[i].length === 0) continue;

        const t = totals[i];

        rows[i].push({
            "bAlwaysLast": true,
            "player": {
                "value": null, 
                "displayValue": "Total",
                "className": `player-name-td team-none text-left`
            },
            "body": {"value": t.body, "displayValue": ignore0(t.body)},
            "pads": {"value": t.pads, "displayValue": ignore0(t.pads)},
            "shp": {"value": t.shp, "displayValue": ignore0(t.shp)},
            "invis": {"value": t.invis, "displayValue": ignore0(t.invis)},
            "belt": {"value": t.belt, "displayValue": ignore0(t.belt)},
            "amp": {"value": t.amp, "displayValue": ignore0(t.amp)},
            "boots": {"value": t.boots, "displayValue": ignore0(t.boots)},
        });

        tables.push(<InteractiveTable width="1" key={i} headers={headers} rows={rows[i]}/>);
    }

    return <>
        <Header>Items Summary</Header>
        {tables}
    </>
}