import {simpleQuery} from "./database.mjs";
import {getMapNames} from "./map.mjs";
import { getGametypeNames } from "./gametypes.mjs";
import { getServerNames } from "./servers.mjs";
import { getMapImages } from "./map.mjs";
import { getPlayersById, getBasicPlayerInfo } from "./players.mjs";
import { getMatchWeaponStats } from "./weapons.mjs";
import { getMatchKills } from "./kills.mjs";
import { getMatchData as ctfGetMatchData } from "./ctf.mjs";
import { getMatchData as domGetMatchData } from "./domination.mjs";


export async function createMatch(serverId, gametypeId, mapId, bHardcore, bInsta, date, playtime, players, totalTeams, team0Scores, team1Scores, 
    team2Scores, team3Score, soloWinner, soloWinnerScore){

    const query = `INSERT INTO nstats_matches VALUES(NULL,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

    const vars = [serverId, gametypeId, mapId, bHardcore, bInsta, date, playtime, players, totalTeams, team0Scores, team1Scores, team2Scores, team3Score, soloWinner, soloWinnerScore];

    const result = await simpleQuery(query, vars);

    if(result.insertId !== undefined) return result.insertId;

    return null;
}


/**
 * Get the names for all serverIds, gametypeIds, mapIds that are in the supplied matches
 */
async function setMatchTypeNames(matches){

    const serverIds = new Set();
    const gametypeIds = new Set();
    const mapIds = new Set();


    for(let i = 0; i < matches.length; i++){

        const m = matches[i];

        serverIds.add(m.server_id);
        gametypeIds.add(m.gametype_id);
        mapIds.add(m.map_id);
    }

    const mapNames = await getMapNames([...mapIds]);
    const gametypeNames = await getGametypeNames([...gametypeIds]);
    const serverNames = await getServerNames([...serverIds]);
    const mapImages = await getMapImages(mapNames);

    for(let i = 0; i < matches.length; i++){

        const m = matches[i];
        m.serverName = serverNames[m.server_id];
        m.gametypeName = gametypeNames[m.gametype_id];
        m.mapName = mapNames[m.map_id];
        m.mapImage = mapImages[m.mapName.toLowerCase()];
    }

}


async function getTotalMatches(){

    const query = `SELECT COUNT(*) as total_matches FROM nstats_matches`;

    const result = await simpleQuery(query);

    if(result.length > 0) return result[0].total_matches;
    return 0;
}

export async function getRecentMatches(page, perPage){

    const DEFAULT_PER_PAGE = 25;

    if(perPage === undefined){
        perPage = DEFAULT_PER_PAGE;
    }else{
        perPage = parseInt(perPage);
        if(perPage !== perPage) perPage = DEFAULT_PER_PAGE;
    }

    page = parseInt(page);

    if(page !== page){
        page = 1;
    }

    page--;

    if(page < 0) page = 0;

    let start = page * perPage;
    if(start < 0) start = 0;

    const query = `SELECT * FROM nstats_matches ORDER BY date DESC, id DESC LIMIT ?, ?`;
    const result = await simpleQuery(query, [start, perPage]);

    const soloWinners = [... new Set(result.map((r) =>{
        return r.solo_winner;
    }))];

    const playerNames = await getBasicPlayerInfo(soloWinners);

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        if(r.solo_winner > 0){
            r.soloWinnerName = playerNames[r.solo_winner]?.name ?? "Not Found";
        }
    }

    await setMatchTypeNames(result);
    const totalMatches = await getTotalMatches();
    return {"data": result, "total": totalMatches};
}


async function getMatch(id){

    const query = `SELECT * FROM nstats_matches WHERE id=?`;

    const result = await simpleQuery(query, [id]);

    if(result.length > 0) return result[0];

    return null;
}

async function getPlayerMatchData(id){


    const query = `SELECT id,player_id,spectator,country,bot,team,score,frags,kills,deaths,suicides,team_kills,efficiency,time_on_server,
    ttl,spree_1,spree_2,spree_3,spree_4,spree_5,spree_best,first_blood,multi_1,multi_2,multi_3,multi_4,multi_best,headshots,
    item_amp,item_belt,item_boots,item_body,item_pads,item_invis,item_shp 
    FROM nstats_match_players WHERE match_id=? ORDER BY score DESC`;

    return await simpleQuery(query, [id]);
}

export async function getMatchData(id){

    id = parseInt(id);
    if(id !== id) throw new Error(`MatchId must be a valid integer`);

    const basic = await getMatch(id);

    const playerData = await getPlayerMatchData(id);

    const uniquePlayers = [...new Set(playerData.map((p) =>{
        return p.player_id;
    }))]

    const playerNames = await getPlayersById(uniquePlayers);

    for(let i = 0; i < playerData.length; i++){

        const p = playerData[i];

        p.name = playerNames[p.player_id] ?? "Not Found";
    }

    const basicPlayers = {};

    for(let i = 0; i < playerData.length; i++){

        const p = playerData[i];

        basicPlayers[p.player_id] = {
            "name": p.name,
            "country": p.country,
            "team": p.team,
            "bSpectator": p.spectator
        };
    }

    const weaponStats = await getMatchWeaponStats(id);
    const kills = await getMatchKills(id);

    const ctf = await ctfGetMatchData(id);
    const dom = await domGetMatchData(id);


    return {basic, playerData, playerNames, weaponStats, basicPlayers, kills, ctf, dom};
}



/**
 * get one or more match details(map_id, gametype_id)
 * @param {*} matchIds 
 * @returns 
 */
export async function getMultipleMatchDetails(matchIds){

    if(matchIds.length === 0) return {};

    const query = `SELECT id,gametype_id,map_id,date,total_teams,team_0_score,team_1_score,team_2_score,team_3_score,solo_winner 
    FROM nstats_matches WHERE id IN(?)`;
    const result = await simpleQuery(query, [matchIds]);

    const data = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        data[r.id] = {
            "gametype": r.gametype_id, 
            "map": r.map_id, 
            "date": r.date,
            "teams": r.total_teams,
            "teamScores": [
                r.team_0_score,
                r.team_1_score,
                r.team_2_score,
                r.team_3_score,
            ],
            "soloWinner": r.solo_winner
        };
    }

    return data;

    /*const gametypeIds = new Set();
    const mapIds = new Set();

    for(let i = 0; i < details.length; i++){

        const d = details[i];

        gametypeIds.add(d.gametype_id);
        mapIds.add(d.map_id);
    }

    console.log(details);

   //const gametypeNames = await getGametypeNames([...gametypeIds]);
    //const mapNames = await getGametypeNames([...mapIds]);
    //console.log(gametypeNames);
    //console.log(mapNames);
    return;

    const query = `SELECT id,name FROM nstats_gametypes WHERE id IN(?)`;

    const result = await simpleQuery(query, [gametypeIds]);

    console.log(result);*/
    
}


export function getWinner(matchData){
    
    if(matchData.total_teams < 2){
        return {"type": "solo", "winnerId": matchData.solo_winner};
    }

    const scores = [];

    for(let i = 0; i < 4; i++){

        scores.push({"team": i, "score": matchData.teamScores[i]});
    }

    scores.sort((a, b) =>{

        if(a.score < b.score) return 1;
        if(a.score > b.score) return -1;
        return 0;
    });

    let bDraw = false;

    const winners = [scores[0].team];
    const firstScore = scores[0].score;

    //check for draws in team games
    for(let i = 1; i < scores.length; i++){

        const s = scores[i];

        if(s.score === firstScore){
            bDraw = true;
            winners.push(s.team);
        }
    }

    return {"type": "teams", "winners": winners, "bDraw": bDraw};

}


export async function getMatchesGametype(matchIds){

    if(matchIds.length === 0) return {};

    const query = `SELECT id,gametype_id FROM nstats_matches WHERE id IN(?)`;

    const result = await simpleQuery(query, [matchIds]);

    const data = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];
        data[r.id] = r.gametype_id;
    }

    return data;
}