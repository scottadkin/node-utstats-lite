"use client"
import InteractiveTable from "../InteractiveTable";
import Header from "../Header";
import { ignore0, getPlayer, getTeamColorClass, cleanWeaponName } from "@/app/lib/generic.mjs";
import Tabs from "../Tabs";
import { useState } from "react";
import Image from "next/image";
import PlayerLink from "../PlayerLink";

function renderBasicTables(orderedNames, data, players, totalTeams){

    const tables = [];

    const headers = {
        "player": {"title": "Player"},
        "kills": {"title": "Kills"},
        "deaths": {"title": "Deaths"},
        "teamKills": {"title": "Team Kills"},
    };

    for(let i = 0; i < orderedNames.length; i++){

        const weapon = orderedNames[i];

        const currentRows = [];

        for(let x = 0; x < data.length; x++){

            const d = data[x];

            if(d.weapon_id !== parseInt(weapon.id)) continue;
            
            const player = getPlayer(players, d.player_id);

            currentRows.push({
                "player": {
                    "className": `player-name-td text-left ${(totalTeams < 2) ? "" : getTeamColorClass(player.team)}`,
                    "value": player.name.toLowerCase(), 
                    "displayValue": <PlayerLink id={d.player_id} country={player.country}>{player.name}</PlayerLink>
                },
                "kills": {"value": d.kills, "displayValue": ignore0(d.kills)},
                "deaths": {"value": d.deaths, "displayValue": ignore0(d.deaths)},
                "teamKills": {"value": d.team_kills, "displayValue": ignore0(d.team_kills)},
            });
        }

        if(currentRows.length > 0){

            tables.push(<InteractiveTable 
                key={weapon.id} 
                headers={headers} 
                rows={currentRows} 
                sortBy="kills" 
                order="DESC" 
                title={weapon.name}
                width={4}
            />);
        }
    }


    return tables;
}

function getPlayerWeaponStats(data, playerId, weaponId){

    playerId = parseInt(playerId);
    weaponId = parseInt(weaponId);

    for(let i = 0; i < data.length; i++){

        const d = data[i];

        if(d.player_id !== playerId) continue;
        if(d.weapon_id !== weaponId) continue;

        return {"kills": d.kills, "deaths": d.deaths, "suicides": d.suicides};
    }

    return null;
}

function renderKDTable(orderedNames, data, players, totalTeams, selectedType, weaponImages){

    if(selectedType === "totals") return null;

    const rows = [];

    const title = (selectedType === "kills") ? "Kills" : "Deaths";

    const headers = {
        "player": {"title": "Player"}
    };


    for(let i = 0; i < orderedNames.length; i++){

        const n = orderedNames[i];

        const name = cleanWeaponName(n.name);

        const image = weaponImages[name];

        let elem = (image !== undefined) ? <Image src={`/images/weapons/${name}.png`} width={68} height={26} alt="image"/> : <span className="no-image">{n.name}</span>;

        headers[`weapon_${n.id}`] = {
            "title": <>{elem}</>,
            "mouseOverBox": {
                "content": n.name
            }
        };
    }

    for(const [pId, player] of Object.entries(players)){

        const playerId = parseInt(pId);

        if(player.team < 0 || player.team > 3) continue;

        const columns = {};

        columns.player = {
            "value": player.name.toLowerCase(), 
            "displayValue": <PlayerLink id={playerId} country={player.country}>{player.name}</PlayerLink>,
            "className": `player-name-td text-left ${(totalTeams < 2) ? "" : getTeamColorClass(player.team)}`
        };

        for(let i = 0; i < orderedNames.length; i++){

            const n = orderedNames[i];

            const weaponStats = getPlayerWeaponStats(data, playerId, n.id);

            if(weaponStats === null){

                columns[`weapon_${n.id}`] = {
                    "value": "",
                    "displayValue": <></>
                };
            }else{
        
                columns[`weapon_${n.id}`] = {
                    "value": weaponStats[selectedType],
                    "displayValue": <>{ignore0(weaponStats[selectedType])}</>
                };
            }
    
        }

        rows.push(columns);

    }

    return <InteractiveTable width={1} headers={headers} rows={rows}/>
    
}


function renderTotals(weaponNames, data, selectedType){

    if(selectedType !== "totals") return null;

    const weaponTotals = {};

    for(let i = 0; i < data.length; i++){

        const d = data[i];

        const w = d.weapon_id;

        if(weaponTotals[w] === undefined){

            weaponTotals[w] = {
                "kills": 0,
                "deaths": 0,
                "suicides": 0,
                "teamKills": 0
            };
        }

        const wt = weaponTotals[w];

        wt.kills += d.kills;
        wt.deaths += d.deaths;
        wt.suicides += d.suicides;
        wt.teamKills += d.team_kills;
    }

    const headers = {
        "name": {"title": "Weapon"},
        "teamKills": {"title": "Team Kills"},
        "suicides": {"title": "Suicides"},
        "deaths": {"title": "Deaths"},
        "kills": {"title": "Kills"},
        
    };

    const rows = [];

    for(const [weaponId, d] of Object.entries(weaponTotals)){

        const name = weaponNames?.[weaponId] ?? "Not Found";

        rows.push({
            "name": {"value": name.toLowerCase(), "displayValue": name, "className": "text-left"},
            "teamKills": {"value": d.teamKills, "displayValue": ignore0(d.teamKills)},
            "deaths": {"value": d.deaths, "displayValue": ignore0(d.deaths)},
            "suicides": {"value": d.suicides, "displayValue": ignore0(d.suicides)},
            "kills": {"value": d.kills, "displayValue": ignore0(d.kills)},
        });
    }

    return <InteractiveTable width={1} headers={headers} rows={rows}/>
}

export default function WeaponStats({data, totalTeams, players, weaponImages}){

    const [selectedType, setSelectedType] = useState("kills");
    const orderedNames = [];
    
    for(const [weaponId, weaponName] of Object.entries(data.names)){

        if(weaponName.toLowerCase() === "all") continue;
        
        orderedNames.push({"id": weaponId, "name": weaponName});
    }

    orderedNames.sort((a, b) =>{

        a = a.name.toLowerCase();
        b = b.name.toLowerCase();

        if(a < b) return -1;
        if(a > b) return 1;
        return 0;
    });

    if(orderedNames.length === 0) return null;

    let tables = renderKDTable(orderedNames, data.data, players, totalTeams, selectedType, weaponImages);

    return <>
        <Header>Weapon Stats</Header>
        <Tabs 
            selectedValue={selectedType}
            changeSelected={setSelectedType}
            options={[
                {"name": "Kills", "value": "kills"},
                {"name": "Deaths", "value": "deaths"},
                {"name": "Suicides", "value": "suicides"},
                {"name": "Totals", "value": "totals"}
            ]}/>
        {tables}
        {renderTotals(data.names, data.data, selectedType)}
    </>
}