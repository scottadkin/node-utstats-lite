import InteractiveTable from "../InteractiveTable";
import Header from "../Header";
import { ignore0, getPlayer, getTeamColorClass } from "@/app/lib/generic.mjs";
import CountryFlag from "../CountryFlag";

function getName(weapons, id){

    if(weapons[id] !== undefined) return weapons[id];

    return "Not Found";
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

        for(let x = 0; x < data.data.length; x++){

            const d = data.data[x];

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
            tables.push(<InteractiveTable key={weapon.id} headers={headers} rows={currentRows} sortBy="kills" order="DESC"/>);
        }


    }

    return <>
        <Header>Weapon Stats</Header>
        {tables}
    </>
}