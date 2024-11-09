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

function renderBasicTable(data, totalTeams){

    const headers = {
        "player": {"title": "Player"},
    };

    if(bAnyDamageOfType(data, "selfDamage")) headers.self = {"title": "Self Damage"}
    if(bAnyDamageOfType(data, "fallDamage")) headers.fall = {"title": "Fall Damage"}
    if(bAnyDamageOfType(data, "cannonDamage")) headers.cannon = {"title": "Cannon Damage"}
    if(bAnyDamageOfType(data, "drownDamage")) headers.drown = {"title": "Drown Damage"}
    if(bAnyDamageOfType(data, "teamDamageTaken")) headers.teamDamageTaken = {"title": "Team Damage Taken"}
    if(bAnyDamageOfType(data, "teamDamageDelt")) headers.teamDamageDelt = {"title": "Team Damage Delt"}
    if(bAnyDamageOfType(data, "damageTaken")) headers.damageTaken = {"title": "Damage Taken"}
    if(bAnyDamageOfType(data, "damageDelt")) headers.damageDelt = {"title": "Damage Delt"}
    


    const rows = [];

    for(let i = 0; i < data.length; i++){

        const d = data[i];

        if(d.damage === undefined) continue;

        const dam = d.damage;

        rows.push({
            "player": {
                "value": d.name.toLowerCase(), 
                "displayValue": <PlayerLink id={d.player_id} country={d.country}>{d.name}</PlayerLink>,
                "className": `${(totalTeams >= 2) ? getTeamColorClass(d.team) : ""} text-left`
            },
            "self": {"value": dam.selfDamage, "displayValue": ignore0(dam.selfDamage)},
            "fall": {"value": dam.fallDamage, "displayValue": ignore0(dam.fallDamage)},
            "cannon": {"value": dam.cannonDamage, "displayValue": ignore0(dam.cannonDamage)},
            "drown": {"value": dam.drownDamage, "displayValue": ignore0(dam.drownDamage)},
            "teamDamageTaken": {"value": dam.teamDamageTaken, "displayValue": ignore0(dam.teamDamageTaken)},
            "teamDamageDelt": {"value": dam.teamDamageDelt, "displayValue": ignore0(dam.teamDamageDelt)},
            "damageTaken": {"value": dam.damageTaken, "displayValue": ignore0(dam.damageTaken)},
            "damageDelt": {"value": dam.damageDelt, "displayValue": ignore0(dam.damageDelt)},
        });
    }

    return <InteractiveTable width={1} headers={headers} rows={rows}/>
}

export default function DamageStats({data, totalTeams}){

    return <>
        <Header>Damage Stats</Header>
        {renderBasicTable(data, totalTeams)}
    </>
}