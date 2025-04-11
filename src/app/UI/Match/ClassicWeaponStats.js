"use client"
import Header from "../Header";
import Tabs from "../Tabs";
import { useState, useEffect } from "react";
import InteractiveTable from "../InteractiveTable";
import { ignore0, getPlayer, getTeamColorClass } from "@/app/lib/generic.mjs";
import PlayerLink from "../PlayerLink";

function renderTable(selectedWeapon, data, players, targetTeam){


    const headers = {
        "player": {"title": "Player"},
        "kills": {"title": "Kills"},
        "deaths": {"title": "Deaths"},
        "shots": {"title": "Shots"},
        "hits": {"title": "Hits"},
        "acc": {"title": "Accuracy"},
        "damage": {"title": "Damage"},
    };

    const totals = {
        "entries": 0,
        "kills": 0,
        "deaths": 0,
        "shots": 0,
        "hits": 0,
        "accuracy": 0,
        "damage": 0,
    };

    const rows = [];

    for(let i = 0; i < data.length; i++){

        const d = data[i];

        if(d.weapon_id != selectedWeapon) continue;

        const p = getPlayer(players, d.player_id);

        if(targetTeam !== null && p.team !== targetTeam) continue;


        totals.entries++;
        totals.kills += d.kills;
        totals.deaths += d.deaths;
        totals.shots += d.shots;
        totals.hits += d.hits;
        totals.damage += d.damage;

        rows.push({
            "player": {"value": p.name.toLowerCase(),
                "displayValue": <PlayerLink  id={d.player_id} country={p.country} bNewTab={true}>{p.name}</PlayerLink>, 
            "className": `player-name-td text-left ${(targetTeam !== null) ? getTeamColorClass(p.team) : ""}`},
            "kills": {"value": d.kills, "displayValue": ignore0(d.kills)},
            "deaths": {"value": d.deaths, "displayValue": ignore0(d.deaths)},
            "shots": {"value": d.shots, "displayValue": ignore0(d.shots)},
            "hits": {"value": d.hits, "displayValue": ignore0(d.hits)},
            "acc": {"value": d.accuracy, "displayValue": `${d.accuracy.toFixed(2)}%`},
            "damage": {"value": d.damage, "displayValue": ignore0(d.damage)},
        });
    }

    if(rows.length === 0) return null;

    if(rows.length > 1){

        let acc = 0;

        if(totals.hits > 0 && totals.shots > 0){

            acc = totals.hits / totals.shots * 100;
        }

        rows.push({
            "bAlwaysLast": true,
            "player": {"value": "",
                "displayValue": "Totals", 
            "className": `text-left team-none`},
            "kills": {"value": totals.kills, "displayValue": ignore0(totals.kills)},
            "deaths": {"value": totals.deaths, "displayValue": ignore0(totals.deaths)},
            "shots": {"value": totals.shots, "displayValue": ignore0(totals.shots)},
            "hits": {"value": totals.hits, "displayValue": ignore0(totals.hits)},
            "acc": {"value": acc, "displayValue": `${acc.toFixed(2)}%`},
            "damage": {"value": totals.damage, "displayValue": ignore0(totals.damage)},
        });
    }

    return <InteractiveTable width={3} headers={headers} rows={rows}/>
}

function renderTables(selectedWeapon, data, players, totalTeams){

    const elems = [];

    if(totalTeams < 2){
        return renderTable(selectedWeapon, data, players, null);
    }

    for(let i = 0; i < totalTeams; i++){

        elems.push(<div key={i}>{renderTable(selectedWeapon, data, players, i)}</div>);
    }

    return elems;
}

export default function ClassicWeaponStats({weaponNames, weaponImages, data, players, totalTeams, firstWeapon}){

    const [selectedWeapon, setSelectedWeapon] = useState(firstWeapon);

    if(data.length === 0) return null;
  
    const tabOptions = [];

    for(const [value, name] of Object.entries(weaponNames)){

        if(value === "0" || name.toLowerCase() === "none") continue;

        tabOptions.push({name, value});
    }

    tabOptions.sort((a, b) =>{

        a = a.name.toLowerCase();
        b = b.name.toLowerCase();

        if(a < b) return -1
        if(a > b) return 1;
        return 0;

    });
   

    return <>
        <Header>Classic Weapon Stats</Header>
        <Tabs options={tabOptions} selectedValue={selectedWeapon} changeSelected={(value) =>{
            setSelectedWeapon(value);
        }}/>
        {renderTables(selectedWeapon, data, players, totalTeams, setSelectedWeapon)}
    </>
}