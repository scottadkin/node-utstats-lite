"use client"
import Header from "../Header";
import Tabs from "../Tabs";
import { useState, useEffect } from "react";
import InteractiveTable from "../InteractiveTable";
import { ignore0, getPlayer, getTeamColorClass } from "@/app/lib/generic.mjs";
import PlayerLink from "../PlayerLink";

function renderTable(selectedWeapon, data, players, totalTeams){


    const headers = {
        "player": {"title": "Player"},
        "kills": {"title": "Kills"},
        "deaths": {"title": "Deaths"},
        "shots": {"title": "Shots"},
        "hits": {"title": "Hits"},
        "acc": {"title": "Accuracy"},
        "damage": {"title": "Damage"},
    };

    const rows = [];

    for(let i = 0; i < data.length; i++){

        const d = data[i];

        if(d.weapon_id != selectedWeapon) continue;

        const p = getPlayer(players, d.player_id);

        rows.push({
            "player": {"value": p.name.toLowerCase(),
                "displayValue": <PlayerLink  id={d.player_id} country={p.country} bNewTab={true}>{p.name}</PlayerLink>, 
            "className": `text-left ${(totalTeams > 1) ? getTeamColorClass(p.team) : ""}`},
            "kills": {"value": d.kills, "displayValue": ignore0(d.kills)},
            "deaths": {"value": d.deaths, "displayValue": ignore0(d.deaths)},
            "shots": {"value": d.shots, "displayValue": ignore0(d.shots)},
            "hits": {"value": d.hits, "displayValue": ignore0(d.hits)},
            "acc": {"value": d.accuracy, "displayValue": `${d.accuracy.toFixed(2)}%`},
            "damage": {"value": d.damage, "displayValue": ignore0(d.damage)},
        });
    }
    return <InteractiveTable width={3} headers={headers} rows={rows}/>
}

export default function ClassicWeaponStats({weaponNames, weaponImages, data, players, totalTeams}){

    if(data.length === 0) return null;

    const [selectedWeapon, setSelectedWeapon] = useState("0");
  
    const tabOptions = [];

    for(const [value, name] of Object.entries(weaponNames)){

        if(value === "0") continue;

        tabOptions.push({name, value});
    }

    tabOptions.sort((a, b) =>{

        a = a.name.toLowerCase();
        b = b.name.toLowerCase();

        if(a < b) return -1
        if(a > b) return 1;
        return 0;

    });

    const firstTab = (tabOptions.length > 0) ? tabOptions[0].value : "";

    
    useEffect(() =>{
  
            setSelectedWeapon(firstTab);
     
    }, [firstTab]);

   

    return <>
        <Header>Classic Weapon Stats</Header>
        <Tabs options={tabOptions} selectedValue={selectedWeapon} changeSelected={(value) =>{
            setSelectedWeapon(value);
        }}/>
        {renderTable(selectedWeapon, data, players, totalTeams)}
    </>
}