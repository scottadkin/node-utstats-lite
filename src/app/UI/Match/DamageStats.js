"use client"
import Header from "../Header";
import InteractiveTable from "../InteractiveTable";
import PlayerLink from "../PlayerLink";
import { getTeamColorClass, ignore0 } from "@/app/lib/generic.mjs";


function bAnyDamageOfType(data, keyName){

    for(let i = 0; i < data.length; i++){

        if(data[i].damage === undefined) continue;

        const d = data[i].damage;

        if(d[keyName] !== undefined && d[keyName] !== 0) return true;
    }

    return false;
}

function renderBasicTable(data){

    const headers = {
        "player": {"title": "Player"},
    };

    if(bAnyDamageOfType(data, "self_damage")) headers.self = {"title": "Self Damage"}
    if(bAnyDamageOfType(data, "fall_damage")) headers.fall = {"title": "Fall Damage"}
    if(bAnyDamageOfType(data, "cannon_damage")) headers.cannon = {"title": "Cannon Damage"}
    if(bAnyDamageOfType(data, "drown_damage")) headers.drown = {"title": "Drown Damage"}
    if(bAnyDamageOfType(data, "team_damage_taken")) headers.teamDamageTaken = {"title": "Team Damage Taken"}
    if(bAnyDamageOfType(data, "team_damage_delt")) headers.teamDamageDelt = {"title": "Team Damage Delt"}
    if(bAnyDamageOfType(data, "damage_taken")) headers.damageTaken = {"title": "Damage Taken"}
    if(bAnyDamageOfType(data, "damage_delt")) headers.damageDelt = {"title": "Damage Delt"}
    


    const rows = [];

    for(let i = 0; i < data.length; i++){

        const d = data[i];

        if(d.damage === undefined) continue;

        const dam = d.damage;

        rows.push({
            "player": {
                "value": d.name.toLowerCase(), 
                "displayValue": <PlayerLink country={d.country}>{d.name}</PlayerLink>,
                "className": `${getTeamColorClass(d.team)} text-left`
            },
            "self": {"value": dam.self_damage, "displayValue": ignore0(dam.self_damage)},
            "fall": {"value": dam.fall_damage, "displayValue": ignore0(dam.fall_damage)},
            "cannon": {"value": dam.cannon_damage, "displayValue": ignore0(dam.cannon_damage)},
            "drown": {"value": dam.drown_damage, "displayValue": ignore0(dam.drown_damage)},
            "teamDamageTaken": {"value": dam.team_damage_taken, "displayValue": ignore0(dam.team_damage_taken)},
            "teamDamageDelt": {"value": dam.team_damage_delt, "displayValue": ignore0(dam.team_damage_delt)},
            "damageTaken": {"value": dam.damage_taken, "displayValue": ignore0(dam.damage_taken)},
            "damageDelt": {"value": dam.damage_delt, "displayValue": ignore0(dam.damage_delt)},
        });
    }

    return <InteractiveTable width={1} headers={headers} rows={rows}/>
}

export default function DamageStats({data}){

    return <>
        <Header>Damage Stats</Header>
        {renderBasicTable(data)}
    </>
}