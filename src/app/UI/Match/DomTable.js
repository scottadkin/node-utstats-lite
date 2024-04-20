"use client";
import Header from "../Header";
import InteractiveTable from "../InteractiveTable";
import { getPlayer, getTeamColorClass, ignore0 } from "../../lib/generic.mjs";
import PlayerLink from "../PlayerLink";


function createPlayerData(data){

    const playerData = {};

    for(let i = 0; i < data.length; i++){

        const d = data[i];

        if(playerData[d.player_id] === undefined){
            playerData[d.player_id] = {};
        }

        if(playerData[d.player_id][d.point_id] === undefined){
            playerData[d.player_id][d.point_id] = 0;
        }

        playerData[d.player_id][d.point_id] = d.total_caps;
      
    }

    return playerData;
}

export default function DomTable({data, players}){

    if(data.data.length === 0) return null;

    const headers = {
        "player": {"title": "Player"}
    };


    for(const [pointId, pointName] of Object.entries(data.controlPoints)){
        headers[`cp_${pointId}`] = {
            "title": pointName, 
            "mouseOverBox": {
                "title": <>{pointName} Point Captures</>,
                "content": `Total times the player captured the control point ${pointName}`
            }
        }
    }

    const teamRows = {};

    const playerData = createPlayerData(data.data);

    for(const [playerId, pData] of Object.entries(playerData)){
        
        const player = getPlayer(players, playerId);

        if(teamRows[player.team] === undefined){
            teamRows[player.team] = [];
        }

        const current = {
            "player": {
                "className":`player-name-td ${getTeamColorClass(player.team)} text-left`,
                "value": player.name.toLowerCase(), 
                "displayValue": <PlayerLink id={playerId} country={player.country}>{player.name}</PlayerLink>
            }
        }

        for(const pointId of Object.keys(data.controlPoints)){

            const currentPoints = pData[pointId] ?? 0;

            current[`cp_${pointId}`] = {"value": currentPoints, "displayValue": ignore0(currentPoints)}
        }


        teamRows[player.team].push(current);
    }


    const tables = [];

    for(const [teamId, rows] of Object.entries(teamRows)){

        tables.push(<InteractiveTable key={teamId} headers={headers} rows={rows}/>);
    }
    

    return <>
        <Header>Domination Summary</Header>
        {tables}
    </>
}