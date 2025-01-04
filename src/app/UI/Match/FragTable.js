"use client"
import Header from "../Header";
import InteractiveTable from "../InteractiveTable";
import { getTeamColorClass, MMSS, ignore0, convertTimestamp } from "@/app/lib/generic.mjs";
import PlayerLink from "../PlayerLink";

const initialTotals = {
    "playtime": 0,
    "score": 0,
    "frags": 0,      
    "kills": 0,       
    "deaths":  0,           
    "suicides":  0,  
    "efficiency":  0,
    "teamKills":  0,    
    "headShots":  0,
    "ttl": 0,
    "players": 0
};


export default function FragTable({data, totalTeams}){

    const headers = {
        "name": {"title": "Player"},
        "playtime": {"title": "Playtime"},
        "score": {"title": "Score"},       
        "frags": {"title": "Frags"},       
        "kills": {"title": "Kills"},       
        "deaths": {"title": "Deaths"},       
        "net": {"title": "Net"},       
        "suicides": {"title": "Suicides"},             
        "teamKills": {"title": "Team Kills"},       
        "headShots": {"title": "Headshots"},       
        "efficiency": {"title": "Efficiency"},  
        "ttl": {"title": "TTL"},  
    };


    const test = {};

    const totals = [{...initialTotals}];

    console.log(`totalTeams = ${totalTeams}`);


    /*for(let i = 1; i < totalTeams; i++){
        totals.push({...initialTotals});
    }*/

    for(let i = 0; i < data.playerData.length; i++){

        const d = data.playerData[i];
        if(d.spectator === 1) continue;

        

        const name = data.playerNames[d.player_id] ?? "Not Found";

        let team = 0;

        if(totalTeams > 1){
            team = d.team;  
        }

        if(totalTeams > 1 && team === 255) continue;

        if(test[team] === undefined){
            test[team] = [];
        }

        let net = d.kills - d.deaths;



        test[team].push({
            "name": {
                "value": name.toLowerCase(), 
                "displayValue": <PlayerLink id={d.player_id} country={d.country}>{name}</PlayerLink>, 
                "className": `player-name-td ${(totalTeams >= 2) ? getTeamColorClass(d.team)  : ""} text-left`
            },
            "playtime": {"value": d.time_on_server, "displayValue": MMSS(d.time_on_server)},
            "score": {"value": d.score, "displayValue": ignore0(d.score)},
            "frags": {"value": d.frags, "displayValue": ignore0(d.frags)},       
            "kills": {"value": d.kills, "displayValue": ignore0(d.kills)},       
            "deaths": {"value": d.deaths, "displayValue": ignore0(d.deaths)},       
            "net": {"value": net, "displayValue": (net > 0) ? `+${net}` : net},       
            "suicides": {"value": d.suicides, "displayValue": ignore0(d.suicides)},       
            "efficiency": {"value": d.efficiency, "displayValue": `${d.efficiency.toFixed(2)}%`},      
            "teamKills": {"value": d.team_kills, "displayValue": ignore0(d.team_kills)},       
            "headShots": {"value": d.headshots, "displayValue": ignore0(d.headshots)},  
            "ttl": {"value": d.ttl, "displayValue": MMSS(d.ttl)},  
        });

        if(totals[team] === undefined){
            
            totals[team] = {...initialTotals};
        }

        const t = totals[team];
        t.playtime += d.time_on_server;
        t.score += d.score;
        t.frags += d.frags;
        t.kills += d.kills;
        t.deaths += d.deaths;
        t.suicides += d.suicides;
        t.efficiency += d.efficiency;
        t.teamKills += d.team_kills;
        t.headShots += d.headshots;
        t.ttl += d.ttl;
        t.players++;

    }

    let elems = [];

    if(totalTeams < 2){

        elems = <InteractiveTable key="one-team" width={3} headers={headers} rows={test[0]} sortBy="score" order="DESC"/>;

    }else{

  

        for(const [teamId, players] of Object.entries(test)){

            const t = totals[teamId];

            const net = t.kills - t.deaths;

            let eff = 0;

            if(t.kills > 0 && t.deaths > 0){

                eff = t.kills / (t.deaths + t.kills) * 100;

            }else if(t.deaths === 0 && t.kills > 0){
                eff = 100;
            }

            let ttl = 0;

            if(t.ttl > 0 && t.players > 0){
                ttl = t.ttl / t.players;
            }


            players.push(
                {
                    "bAlwaysLast": true,
                    "name": {
                        "value": null, 
                        "displayValue": "Total/Average", 
                        "className": `player-name-td text-left team-none`
                    },
                    "playtime": {"value": t.playtime, "displayValue": MMSS(t.playtime), "className": "team-none"},
                    "score": {"value": t.score, "displayValue": ignore0(t.score), "className": "team-none"},
                    "frags": {"value": t.frags, "displayValue": ignore0(t.frags), "className": "team-none"},       
                    "kills": {"value": t.kills, "displayValue": ignore0(t.kills), "className": "team-none"},       
                    "deaths": {"value": t.deaths, "displayValue": ignore0(t.deaths), "className": "team-none"},       
                    "net": {"value": null, "displayValue": (net > 0) ? `+${net}` : net, "className": "team-none"},       
                    "suicides": {"value": t.suicides, "displayValue": ignore0(t.suicides), "className": "team-none"},       
                    "efficiency": {"value":" d.efficiency", "displayValue": `${eff.toFixed(2)}%`, "className": "team-none"},      
                    "teamKills": {"value": t.team_kills, "displayValue": ignore0(t.team_kills), "className": "team-none"},       
                    "headShots": {"value": t.headshots, "displayValue": ignore0(t.headshots), "className": "team-none"},  
                    "ttl": {"value": ttl, "displayValue": MMSS(ttl), "className": "team-none"}  
                }
            );
            elems.push(<InteractiveTable width={3} key={teamId} headers={headers} rows={players} sortBy="score" order="DESC"/>);
        }   
    }


    return <div className="margin-bottom-1">
        <Header>Frags Summary</Header>
        {elems}
    </div>
}