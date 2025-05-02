
import { simpleQuery, bulkInsert } from "./database.mjs";
import { getMatchesTeamResults } from "./ctf.mjs";
import { getBasicPlayerInfo, applyBasicPlayerInfoToObjects } from "./players.mjs";


async function getMapPlayerHistory(mapId, gametypeId){

    const query = `SELECT match_id,player_id,team FROM nstats_match_players WHERE time_on_server>0 AND spectator=0 AND map_id=? AND gametype_id=?`;

    const result = await simpleQuery(query, [mapId, gametypeId]);

    const matchIds = new Set();
    const matchesToPlayers = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];
        matchIds.add(r.match_id);
        
        if(matchesToPlayers[r.match_id] === undefined){
            matchesToPlayers[r.match_id] = [];
        }

        matchesToPlayers[r.match_id].push({"id": r.player_id, "team": r.team});
    }

    return {"matchIds": [...matchIds], matchesToPlayers}
    
}

class CTFLeaguePlayerObject{

    constructor(playerId){

        this.playerId = playerId;
        this.matches = 0;
        this.wins = 0;
        this.draws = 0;
        this.losses = 0;
        this.capFor = 0;
        this.capAgainst = 0;
        this.points = 0;
        this.firstMatch = 0;
        this.lastMatch = 0;
        this.capOffset = 0;
        this.playtime = 0;

    }

    update(myTeam, redScore, blueScore, winner, date, playtime){

        this.matches++;

        if(winner !== -1){

            if(myTeam === winner){
                this.wins++;
                this.points+=3;
            }

            if(myTeam !== winner) this.losses++;

        }else{
            this.draws++;
            this.points++;
        }
        
        if(myTeam === 0){
            this.capFor += redScore;
            this.capAgainst += blueScore;
        }else{
            this.capFor += blueScore;
            this.capAgainst += redScore;
        }

        if(this.firstMatch === 0 || this.firstMatch > date){
            this.firstMatch = date;
        }

        if(this.lastMatch === 0 || this.lastMatch < date){
            this.lastMatch = date;
        }


        this.capOffset = this.capFor - this.capAgainst;
        this.playtime += playtime;
    }
}

async function deleteAllMapEntries(mapId, gametypeId){

    const query = `DELETE FROM nstats_player_map_ctf_league WHERE map_id=? AND gametype_id=?`;

    return await simpleQuery(query, [mapId, gametypeId]);
}

async function bulkInsertMapEntries(mapId, gametypeId, tableData){

    const insertVars = [];

    for(const d of Object.values(tableData)){

        insertVars.push([
            d.playerId, gametypeId, mapId, 
            d.firstMatch, d.lastMatch, d.matches,
            d.wins, d.draws, d.losses, 0, 
            d.capFor, d.capAgainst, d.capOffset,
            d.points
        ]);
    }

    const query = `INSERT INTO nstats_player_map_ctf_league (player_id,gametype_id,map_id,first_match,last_match,
    total_matches,wins,draws,losses,winrate,cap_for,cap_against,cap_offset,points) VALUES ?`;

    await bulkInsert(query, insertVars);
}

export async function calcPlayersMapResults(mapId, gametypeId){


    const history = await getMapPlayerHistory(mapId, gametypeId);
    const matchResults = await getMatchesTeamResults(history.matchIds);
    const table = {};

    for(let [matchId, d] of Object.entries(history.matchesToPlayers)){

        matchId = parseInt(matchId);

        for(let i = 0; i < d.length; i++){

            const {id, team} = d[i];
         
            if(table[id] === undefined){
                table[id] = new CTFLeaguePlayerObject(id);
            }

            const matchResult = matchResults[matchId];
            
            if(matchResult === undefined){
                throw new Error(`matchResult is undefined`);
            }
 

            table[id].update(team, matchResult.red, matchResult.blue, matchResult.winner, matchResult.date, matchResult.playtime);
        }  
    }

    await deleteAllMapEntries(mapId, gametypeId);
    await bulkInsertMapEntries(mapId, gametypeId, table);


}


export async function getMapTable(mapId, gametypeId){

    const query = `SELECT player_id,first_match,last_match,total_matches,wins,draws,losses,
    cap_for,cap_against,cap_offset,points FROM nstats_player_map_ctf_league WHERE map_id=? 
    AND gametype_id=? ORDER BY points DESC, wins DESC, draws DESC, losses ASC, cap_offset ASC`;
    
    const result = await simpleQuery(query, [mapId, gametypeId]);

    const playerIds = new Set(result.map((r) =>{
        return r.player_id;
    }));

    const playerInfo = await getBasicPlayerInfo([...playerIds]);

    applyBasicPlayerInfoToObjects(playerInfo, result);
    
    return result;
}