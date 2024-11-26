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


function bAnyDamageData(data){

    const types = [
        "selfDamage",
        "fallDamage",
        "cannonDamage",
        "drownDamage",
        "teamDamageTaken",
        "teamDamageDelt",
        "damageDelt",
        "damageTaken",
    ];

    for(let i = 0; i < data.length; i++){

        if(data[i].damage === undefined) continue;

        const d = data[i].damage;

        for(let x = 0; x < types.length; x++){

            const t = types[x];
            if(d[t] !== undefined && d[t] !== 0) return true;
        }
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


    const tables = [[]];

    const totals = [{
        "selfDamage": 0,
        "fallDamage": 0,
        "cannonDamage": 0,
        "drownDamage": 0,
        "teamDamageTaken": 0,
        "teamDamageDelt": 0,
        "damageTaken": 0,
        "damageDelt": 0
    }];

    if(totalTeams > 1){

        for(let i = 1; i < totalTeams; i++){

            tables.push([]);

            totals.push({
                "selfDamage": 0,
                "fallDamage": 0,
                "cannonDamage": 0,
                "drownDamage": 0,
                "teamDamageTaken": 0,
                "teamDamageDelt": 0,
                "damageTaken": 0,
                "damageDelt": 0
            });
        }
    }

    for(let i = 0; i < data.length; i++){

        const d = data[i];

        if(d.damage === undefined) continue;

        const dam = d.damage;

        const row ={
            "player": {
                "value": d.name.toLowerCase(), 
                "displayValue": <PlayerLink id={d.player_id} country={d.country}>{d.name}</PlayerLink>,
                "className": `${(totalTeams >= 2) ? getTeamColorClass(d.team) : ""} text-left player-name-td`
            },
            "self": {"value": dam.selfDamage, "displayValue": ignore0(dam.selfDamage)},
            "fall": {"value": dam.fallDamage, "displayValue": ignore0(dam.fallDamage)},
            "cannon": {"value": dam.cannonDamage, "displayValue": ignore0(dam.cannonDamage)},
            "drown": {"value": dam.drownDamage, "displayValue": ignore0(dam.drownDamage)},
            "teamDamageTaken": {"value": dam.teamDamageTaken, "displayValue": ignore0(dam.teamDamageTaken)},
            "teamDamageDelt": {"value": dam.teamDamageDelt, "displayValue": ignore0(dam.teamDamageDelt)},
            "damageTaken": {"value": dam.damageTaken, "displayValue": ignore0(dam.damageTaken)},
            "damageDelt": {"value": dam.damageDelt, "displayValue": ignore0(dam.damageDelt)},
        };

        const team = (totalTeams > 1) ? d.team : 0;
    
        tables[team].push(row);

        totals[team].selfDamage += dam.selfDamage
        totals[team].fallDamage += dam.fallDamage;
        totals[team].cannonDamage += dam.cannonDamage;
        totals[team].drownDamage += dam.drownDamage;
        totals[team].teamDamageTaken += dam.teamDamageTaken;
        totals[team].teamDamageDelt += dam.teamDamageDelt;
        totals[team].damageTaken += dam.damageTaken;
        totals[team].damageDelt += dam.damageDelt;
        
    }

    const elems = [];

    for(let i = 0; i < tables.length; i++){

        const rows = tables[i];

        const dam = totals[i];

        const row ={
            "bAlwaysLast": true,
            "player": {
                "value": "null", 
                "displayValue": "Totals",
                "className": `text-left  ${getTeamColorClass(-1)}`
            },
            "self": {"value": dam.selfDamage, "displayValue": ignore0(dam.selfDamage), "className": getTeamColorClass(-1)},
            "fall": {"value": dam.fallDamage, "displayValue": ignore0(dam.fallDamage), "className": getTeamColorClass(-1)},
            "cannon": {"value": dam.cannonDamage, "displayValue": ignore0(dam.cannonDamage), "className": getTeamColorClass(-1)},
            "drown": {"value": dam.drownDamage, "displayValue": ignore0(dam.drownDamage), "className": getTeamColorClass(-1)},
            "teamDamageTaken": {"value": dam.teamDamageTaken, "displayValue": ignore0(dam.teamDamageTaken), "className": getTeamColorClass(-1)},
            "teamDamageDelt": {"value": dam.teamDamageDelt, "displayValue": ignore0(dam.teamDamageDelt), "className": getTeamColorClass(-1)},
            "damageTaken": {"value": dam.damageTaken, "displayValue": ignore0(dam.damageTaken), "className": getTeamColorClass(-1)},
            "damageDelt": {"value": dam.damageDelt, "displayValue": ignore0(dam.damageDelt), "className": getTeamColorClass(-1)},
        };

        rows.push(row);

        elems.push(<InteractiveTable key={i} width={1} headers={headers} rows={rows}/>);
    }

    return <>
        {elems}
    </>
}

export default function DamageStats({data, totalTeams}){

    if(!bAnyDamageData(data)) return null;
    return <>
        <Header>Damage Stats</Header>
        {renderBasicTable(data, totalTeams)}
    </>
}