import InteractiveTable from "../InteractiveTable";
import Header from "../Header";
import { ignore0, getPlayer, getTeamColorClass } from "@/app/lib/generic.mjs";
import CountryFlag from "../CountryFlag";

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
                    "className": `text-left ${(totalTeams < 2) ? "" : getTeamColorClass(player.team)}`,
                    "value": player.name.toLowerCase(), 
                    "displayValue": <><CountryFlag code={player.country}/>{player.name}</>
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

        return {"kills": d.kills, "deaths": d.deaths};
    }

    return null;
}

function renderKDTable(orderedNames, data, players, totalTeams){

    const rows = [];

    const headers = {
        "player": {"title": "Player"}
    };


    for(let i = 0; i < orderedNames.length; i++){

        const n = orderedNames[i];

        headers[`weapon_${n.id}`] = {"title": n.name};
    }

    for(const [pId, player] of Object.entries(players)){

        const playerId = parseInt(pId);

        const columns = {};

        columns.player = {
            "value": player.name.toLowerCase(), 
            "displayValue": <><CountryFlag code={player.country}/>{player.name}</>,
            "className": `text-left ${(totalTeams < 2) ? "" : getTeamColorClass(player.team)}`
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
                    "value": weaponStats.kills,
                    "displayValue": <>{weaponStats.kills} - {weaponStats.deaths}</>
                };
            }
    
        }

        rows.push(columns);

    }

    return <InteractiveTable headers={headers} rows={rows}/>
    
}

export default function WeaponStats({data, totalTeams, players}){

    const orderedNames = [];
    
    for(const [weaponId, weaponName] of Object.entries(data.names)){
        orderedNames.push({"id": weaponId, "name": weaponName});
    }

    orderedNames.sort((a, b) =>{

        a = a.name.toLowerCase();
        b = b.name.toLowerCase();

        if(a < b) return -1;
        if(a > b) return 1;
        return 0;
    });

    let tables = renderKDTable(orderedNames, data.data, players, totalTeams);

    
    return <>
        <Header>Weapon Stats</Header>
        {tables}
    </>
}