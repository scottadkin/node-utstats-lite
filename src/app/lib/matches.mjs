import {simpleQuery} from "./database.mjs";
import {getMapNames} from "./maps.mjs";
import { getGametypeNames } from "./gametypes.mjs";
import { getServerNames } from "./servers.mjs";
import { getMapImages } from "./maps.mjs";
import { getPlayersById, getBasicPlayerInfo } from "./players.mjs";
import { getMatchWeaponStats } from "./weapons.mjs";
import { getMatchKills } from "./kills.mjs";
import { getMatchData as ctfGetMatchData } from "./ctf.mjs";
import { getMatchData as domGetMatchData } from "./domination.mjs";
import md5 from "md5";


export async function createMatch(serverId, gametypeId, mapId, bHardcore, bInsta, date, playtime, players, totalTeams, team0Scores, team1Scores, 
    team2Scores, team3Score, soloWinner, soloWinnerScore, targetScore, timeLimit, mutators){

    const query = `INSERT INTO nstats_matches VALUES(NULL,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,"")`;

    const vars = [
        serverId, gametypeId, mapId, bHardcore, bInsta, 
        date, playtime, players, totalTeams, team0Scores, 
        team1Scores, team2Scores, team3Score, soloWinner, soloWinnerScore,
        targetScore, timeLimit, mutators
    ];

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



function createSearchWhere(server, gametype, map){

    let where = ``;

    const whereVars = [];
    const vars = [];

    if(server !== 0){
        whereVars.push(`server_id=?`);
        vars.push(server);
    }

    if(gametype !== 0){
        whereVars.push(`gametype_id=?`);
        vars.push(gametype);
    }

    if(map !== 0){
        whereVars.push(`map_id=?`);
        vars.push(map);
    }

    for(let i = 0; i < whereVars.length; i++){

        const w = whereVars[i];

        if(i === 0){
            where = `WHERE ${w} `;
        }else{
            where += ` AND ${w} `;
        }
    }


    return {where, vars}
}


async function getTotalMatches(server, gametype, map){

    const {where, vars} = createSearchWhere(server, gametype, map);
    const query = `SELECT COUNT(*) as total_matches FROM nstats_matches ${where}`;

    const result = await simpleQuery(query, vars);

    if(result.length > 0) return result[0].total_matches;
    return 0;
}

export async function getRecentMatches(page, perPage, server, gametype, map){

    const DEFAULT_PER_PAGE = 50;

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

    server = parseInt(server);
    gametype = parseInt(gametype);
    map = parseInt(map);

    if(server !== server || gametype !== gametype || map !== map){
        throw new Error(`server, gametype, and map must be a valid integer`);
    }

    const {where, vars} = createSearchWhere(server, gametype, map);

    let query = `SELECT * FROM nstats_matches ${where} ORDER BY date DESC, id DESC LIMIT ?, ?`;

    const result = await simpleQuery(query, [...vars, start, perPage]);

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
    const totalMatches = await getTotalMatches(server, gametype, map);
    return {"data": result, "total": totalMatches};
}


async function getMatch(id){

    const query = `SELECT * FROM nstats_matches WHERE id=?`;

    const result = await simpleQuery(query, [id]);

    if(result.length === 0) return null;

    const data = result[0];

    const serverName = await getServerNames([data.server_id]);
    const gametypeName = await getGametypeNames([data.gametype_id]);
    const mapName = await getMapNames([data.map_id]);
    

    data.serverName = (serverName[data.server_id] !== undefined) ? serverName[data.server_id] : "Not Found";
    data.gametypeName = (gametypeName[data.gametype_id] !== undefined) ? gametypeName[data.gametype_id] : "Not Found";
    data.mapName = (mapName[data.map_id] !== undefined) ? mapName[data.map_id] : "Not Found";

    const mapImages = await getMapImages([data.mapName]);
    data.mapImage = Object.values(mapImages)[0];
    return data;
}

async function getPlayerMatchData(id){


    const query = `SELECT id,player_id,spectator,country,bot,ping_min,ping_avg,ping_max,team,score,frags,kills,deaths,suicides,team_kills,efficiency,time_on_server,
    ttl,spree_1,spree_2,spree_3,spree_4,spree_5,spree_best,first_blood,multi_1,multi_2,multi_3,multi_4,multi_best,headshots,
    item_amp,item_belt,item_boots,item_body,item_pads,item_invis,item_shp 
    FROM nstats_match_players WHERE match_id=? ORDER BY score DESC`;

    return await simpleQuery(query, [id]);
}


async function getMatchIdFromHash(hash){

    const query = `SELECT id FROM nstats_matches WHERE hash=?`;

    const result = await simpleQuery(query, [hash]);

    if(result.length > 0) return result[0].id;

    return null;
}

export async function getMatchData(id, bIgnoreKills){

    try{

        if(bIgnoreKills === undefined) bIgnoreKills = false;

        if(id.length !== 32){

            id = parseInt(id);
            if(id !== id) throw new Error(`MatchId must be a valid integer`);

        }else{

            id = await getMatchIdFromHash(id);
            if(id === null) throw new Error(`No match with that hash exists`);

        }

        const basic = await getMatch(id);
        if(basic === null) throw new Error(`Match doesnt exist`);

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
        const kills = (bIgnoreKills) ? [] : await getMatchKills(id);

        const ctf = await ctfGetMatchData(id);
        const dom = await domGetMatchData(id);


        return {basic, playerData, playerNames, weaponStats, basicPlayers, kills, ctf, dom};
        
    }catch(err){
        console.trace(err);
        return {"error": err.toString()};
    }
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

export async function getMatchesResultByIds(ids){

    if(ids.length === 0) return {};

    const query = `SELECT 
    id,server_id,gametype_id,map_id,total_teams,team_0_score,team_1_score,
    team_2_score,team_3_score,solo_winner,solo_winner_score FROM nstats_matches WHERE id IN (?)`;

    const result = await simpleQuery(query, [ids]);

    const data = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];
        data[r.id] = r;
    }

    return data;
}


export async function setMatchHash(id, hash){

    const query = `UPDATE nstats_matches SET hash=? WHERE id=?`;

    hash = md5(hash);

    return await simpleQuery(query, [hash, id]);
}

export async function getBasicMatchesInfo(matchIds){

    if(matchIds.length === 0) return {};

    const query = `SELECT id,server_id,gametype_id,map_id FROM nstats_matches WHERE id IN(?)`;

    const result = await simpleQuery(query, [matchIds]);

    const serverIds = new Set();
    const gametypeIds = new Set();
    const mapIds = new Set();

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        serverIds.add(r.server_id);
        gametypeIds.add(r.gametype_id);
        mapIds.add(r.map_id);
    }

    const serverNames = await getServerNames([...serverIds]);
    const gametypeNames = await getGametypeNames([...gametypeIds]);
    const mapNames = await getMapNames([...mapIds]);

    const data = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];
        data[r.id] = r;

        r.serverName = serverNames[r.server_id];
        r.gametypeName = gametypeNames[r.gametype_id];
        r.mapName = mapNames[r.map_id];
    }


    return data;

}



/**
 * used for /api/json/match
 */
export async function getMatchJSON(id, bIgnoreKills){

    if(bIgnoreKills === undefined) bIgnoreKills = false;

    const data = await getMatchData(id, bIgnoreKills);

    const players = data.basicPlayers;


    
    console.log(data);

    console.log(data.ctf);

    console.log(players);

    for(let i = 0; i < data.ctf.length; i++){

        const d = data.ctf[i];

        const player = players[d.player_id] ?? null;

        if(player === null) continue;

        player.ctf = {
            "taken": d.flag_taken,
            "pickup": d.flag_pickup,
            "drop": d.flag_drop,
            "assist": d.flag_assist,
            "cover": d.flag_cover,
            "seal": d.flag_seal,
            "cap": d.flag_cap,
            "kill": d.flag_kill,
            "return": d.flag_return,
            "returnBase": d.flag_return_base,
            "returnMid": d.flag_return_mid,
            "returnEnemyBase": d.flag_return_enemy_base,
            "returnSave": d.flag_return_save,
        };
    }

    //console.log(data.weaponStats.data);

    for(let i = 0; i < data.playerData.length; i++){

        const d = data.playerData[i];

        console.log(d);

        const player = players[d.player_id] ?? null;

        if(player === null) continue;

        player.general = {
            "score": d.score,
            "frags": d.frags,
            "kills": d.kills,
            "deaths": d.deaths,
            "suicides": d.suicides,
            "teamKills": d.team_kills,
            "efficiency": d.efficiency,
            "playtime": d.time_on_server,
            "ttl": d.ttl,
        };

        player.pickups = {
            "amp": d.item_amp,
            "belt": d.item_belt,
            "boots": d.item_boots,
            "body": d.item_body,
            "pads": d.item_pads,
            "invis": d.item_invis,
            "shp": d.item_shp,
        };

        player.events = {
            "firstBlood": d.first_blood === 1,
            "sprees": {
                "spree": d.spree_1,
                "rampage": d.spree_2,
                "dominating": d.spree_3,
                "unstoppable": d.spree_4,
                "godlike": d.spree_,
                "best": d.spree_best
            },
            "multis": {
                "double": d.multi_1,
                "multi": d.multi_2,
                "ultra": d.multi_3,
                "monster": d.multi_4,
                "best": d.multi_best
            }
        };
    }

    console.log(players);

    const finalData = [];

    for(const [key, value] of Object.entries(players)){
        finalData.push(value);
    }

    return finalData;

}