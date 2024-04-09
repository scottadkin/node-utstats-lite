"use client"
import Header from "../Header";
import InteractiveTable from "../InteractiveTable";
import { getTeamColorClass, MMSS, ignore0, convertTimestamp } from "@/app/lib/generic.mjs";

export default function FragTable({data, totalTeams}){

    data = JSON.parse(data);

    const headers = {
        "name": {"title": "Player"},
        "playtime": {"title": "Playtime"},
        "score": {"title": "Score"},       
        "frags": {"title": "Frags"},       
        "kills": {"title": "Kills"},       
        "deaths": {"title": "Deaths"},       
        "suicides": {"title": "Suicides"},             
        "teamKills": {"title": "Team Kills"},       
        "headShots": {"title": "Headshots"},       
        "efficiency": {"title": "Efficiency"},  
        "ttl": {"title": "TTL"},  
    };


    const test = {};

    for(let i = 0; i < data.playerData.length; i++){

        const d = data.playerData[i];
        if(d.spectator === 1) continue;

        const name = data.playerNames[d.player_id] ?? "Not Found";

        let team = 0;

        if(totalTeams > 1){
            team = d.team;
            
        }
        if(test[team] === undefined){
            test[team] = [];
        }

        console.log(d.playtime);


        test[team].push({
            "name": {
                "value": name.toLowerCase(), 
                "displayValue": name, 
                "className": `${getTeamColorClass((totalTeams > 1) ? d.team : 255)} text-left`
            },
            "playtime": {"value": d.time_on_server, "displayValue": MMSS(d.time_on_server)},
            "score": {"value": d.score, "displayValue": ignore0(d.score)},
            "frags": {"value": d.frags, "displayValue": ignore0(d.frags)},       
            "kills": {"value": d.kills, "displayValue": ignore0(d.kills)},       
            "deaths": {"value": d.deaths, "displayValue": ignore0(d.deaths)},       
            "suicides": {"value": d.suicides, "displayValue": ignore0(d.suicides)},       
            "efficiency": {"value": d.efficiency, "displayValue": `${ignore0(d.efficiency.toFixed(2))}%`},      
            "teamKills": {"value": d.team_kills, "displayValue": ignore0(d.team_kills)},       
            "headShots": {"value": d.headshots, "displayValue": ignore0(d.headshots)},  
            "ttl": {"value": d.ttl, "displayValue": d.ttl},  
        });
    }

    let elems = [];

    if(totalTeams < 2){

        elems = <InteractiveTable headers={headers} rows={test[0]}/>;

    }else{

        for(const [teamId, players] of Object.entries(test)){
            elems.push(<InteractiveTable key={teamId} headers={headers} rows={players} sortBy="score" order="DESC"/>);
        }   
    }


    return <div className="margin-bottom-1">
        <Header>Frags Summary</Header>
        {elems}
    </div>
}