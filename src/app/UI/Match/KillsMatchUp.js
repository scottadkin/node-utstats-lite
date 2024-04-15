"use client"
import Header from "../Header";
import { ignore0, getTeamColorClass } from "@/app/lib/generic.mjs";
import CountryFlag from "../CountryFlag";

function mergePlayerWeaponKills(kills){

    const result = {};

    for(let i = 0; i < kills.length; i++){

        const k = kills[i];

        const id = `${k.killer_id}_${k.victim_id}`;

        if(result[id] === undefined){
            result[id] = 0;
        }

        result[id]++;
    }

    return result;
}

export default function KillsMatchUp({kills, totalTeams, players}){

    const orderedPlayers = [];

    for(const [playerId, playerData] of Object.entries(players)){

        if(playerData.bSpectator) continue;

        orderedPlayers.push({"playerId": parseInt(playerId), ...playerData});
    }

    orderedPlayers.sort((a, b) =>{
        a = a.team;
        b = b.team;

        if(a > b) return 1;
        if(a < b) return -1;
        return 0;
    });

    if(orderedPlayers.length <= 1) return null;

    const rows = [];

    
    const mergedKills = mergePlayerWeaponKills(kills);

    const headers = [];
    for(let i = 0; i < orderedPlayers.length; i++){

        const victim = orderedPlayers[i];

        const player = players[victim.playerId];

        headers.push(<th key={i} style={{"writingMode":"vertical-lr", "color": "white"}} className={`text-left ${(totalTeams < 2) ? "" : getTeamColorClass(victim.team)}`}>
            {<><CountryFlag code={player.country}/> {player.name}</> ?? "Not Found"}
        </th>);
    }

    rows.push(<tr key={"headers"}><th>&nbsp;</th>{headers}</tr>);


    for(let i = 0; i < orderedPlayers.length; i++){

        const killer = orderedPlayers[i];

        const player = players[killer.playerId];
        
        const columns = [
            <td key={`${i}_name`} className={`text-left ${(totalTeams < 2) ? "" : getTeamColorClass(killer.team)}`}>
                {<><CountryFlag code={player.country}/>{player.name}</> ?? "Not Found"}
            </td>
        ];

        for(let x = 0; x < orderedPlayers.length; x++){

            const victim = orderedPlayers[x];

            const targetId = `${killer.playerId}_${victim.playerId}`;
            const kills = mergedKills[targetId] ?? 0;

            const currentStyle = (victim.playerId === killer.playerId) ? {"backgroundColor": "rgba(0,0,0,0.5)"} : {};

            columns.push(<td style={currentStyle} key={`${i}_${x}`}>{ignore0(kills)}</td>);
            
        }

        rows.push(<tr key={i}>{columns}</tr>);
    }


    return <>
        <Header>Kill Match Up</Header>
        <table>
            <tbody>
    
                {rows}
            </tbody>
        </table>
    </>
}