import { simpleQuery, bulkInsert } from "./database.mjs";
import { sanitizePagePerPage } from "./generic.mjs";
import { getAllIds as getAllGametypeIds } from "./gametypes.mjs";
import { getAllGametypeIds as getAllPlayerGametypeIds, getAllPlayerMapIds, getBasicPlayerInfo } from "./players.mjs";
import { getAllMapIds } from "./maps.mjs";


const VALID_RANKING_TYPES = ["gametype", "map"];

const PLAYER_MATCHES_FRAGS_TOTALS_COLUMNS = `
nstats_match_players.player_id,
MAX(nstats_match_players.match_date) as last_active,
SUM(nstats_match_players.time_on_server) as playtime,
COUNT(*) as total_matches,
SUM(nstats_match_players.kills) as kills, 
SUM(nstats_match_players.deaths) as deaths,
SUM(nstats_match_players.suicides) as suicides, SUM(nstats_match_players.team_kills) as team_kills, 
SUM(nstats_match_players.spree_1) as spree_1, SUM(nstats_match_players.spree_2) as spree_2, SUM(nstats_match_players.spree_3) as spree_3,
SUM(nstats_match_players.spree_4) as spree_4, SUM(nstats_match_players.spree_5) as spree_5, SUM(nstats_match_players.multi_1) as multi_1, 
SUM(nstats_match_players.multi_2) as multi_2, SUM(nstats_match_players.multi_3) as multi_3, SUM(nstats_match_players.multi_4) as multi_4,
SUM(nstats_match_ctf.flag_taken) as flag_taken,
SUM(nstats_match_ctf.flag_pickup) as flag_pickup,
SUM(nstats_match_ctf.flag_drop) as flag_drop,
SUM(nstats_match_ctf.flag_assist) as flag_assist,
SUM(nstats_match_ctf.flag_cover) as flag_cover,
SUM(nstats_match_ctf.flag_seal) as flag_seal,
SUM(nstats_match_ctf.flag_cap) as flag_cap,
SUM(nstats_match_ctf.flag_kill) as flag_kill,
SUM(nstats_match_ctf.flag_return) as flag_return,
SUM(nstats_match_ctf.flag_return_base) as flag_return_base,
SUM(nstats_match_ctf.flag_return_mid) as flag_return_mid,
SUM(nstats_match_ctf.flag_return_enemy_base) as flag_return_enemy_base,
SUM(nstats_match_ctf.flag_return_save) as flag_return_save
`;


function bValidRankingType(type){

    type = type.toLowerCase();

    return VALID_RANKING_TYPES.indexOf(type) !== -1;
}

async function getPlayerTotals(type, targetId, playerIds){

    type = type.toLowerCase();

    if(type !== "gametype" && type !== "map") throw new Error(`Not a valid getPlayerTotals type`);

    let column = `gametype_id`;

    if(type === "map") column = "map_id";

    const query = `SELECT ${PLAYER_MATCHES_FRAGS_TOTALS_COLUMNS}
    FROM nstats_match_players 
    LEFT JOIN nstats_match_ctf ON nstats_match_ctf.match_id = nstats_match_players.match_id AND nstats_match_ctf.player_id = nstats_match_players.match_id
    WHERE nstats_match_players.${column}=? AND nstats_match_players.player_id IN(?) GROUP BY nstats_match_players.player_id`;

    return await simpleQuery(query, [targetId, playerIds]);

}


export async function getRankingSettings(){

    const query = `SELECT category,name,points FROM nstats_ranking_settings`;

    const result = await simpleQuery(query);

    const data = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        if(data[r.category] === undefined){
            data[r.category] = {};
        }

        data[r.category][r.name] = r;
    }

    return data;
}


async function deletePlayerRankings(gametypeId, playerIds){

    const query = `DELETE FROM nstats_rankings WHERE gametype_id=? AND player_id IN(?)`;

    return await simpleQuery(query, [gametypeId, playerIds]);
}

async function deletePlayerMapRankings(mapId, playerIds){

    const query = `DELETE FROM nstats_map_rankings WHERE map_id=? AND player_id IN(?)`;

    return await simpleQuery(query, [mapId, playerIds]);
}


async function bulkInsertRankings(targetId, data, type){


    let query = `INSERT INTO nstats_rankings (
        player_id, gametype_id, matches, playtime,
        score, last_active
    ) VALUES ?`;

    if(type === "map"){
        query = `INSERT INTO nstats_map_rankings (
            player_id, map_id, matches, playtime,
            score, last_active
        ) VALUES ?`;
    }

    const insertVars = [];

    for(const p of Object.values(data)){

        insertVars.push([
            p.player_id,
            targetId,
            p.total_matches,
            p.playtime,
            p.ranking_points,
            p.last_active
        ]);
    }


    await bulkInsert(query, insertVars);
}


function _applyTimePenalty(playerData, settings, minutesPlayed){

    //ranking_points

    const reg = /^under_(.+)$/i;

    const keys = Object.keys(settings);
    
    //this will allow admins to set custom time limits if wanted
    let closestMatch = null;

    //minutesPlayed *= Math.random() * 1000;

    let targetKey = null;

    for(let i = 0; i < keys.length; i++){

        const k = keys[i];

        const regResult = reg.exec(k);
        
        if(regResult === null) continue;

        const current = parseInt(regResult[1]);
        if(current !== current) continue;

        if(current > minutesPlayed){

            if(closestMatch === null){
                closestMatch = current;
                targetKey = k;
                continue;
            }

            if(current < closestMatch){
                closestMatch = k;
                targetKey = k;
            }
        }
    }

    if(targetKey === null) return;

    const penalty = settings[targetKey].points;

    if(penalty !== penalty || penalty === 0) return;

    playerData.ranking_points *= penalty;
}

function _setRankingPoints(settings, playerData){

    const t = playerData;

    let currentPoints = 0;

    for(const category of Object.keys(settings)){

        for(const [type, typeData] of Object.entries(settings[category])){

            //don't apply penalty until get full total
            if(category === "penalty") continue;
                
            if(playerData[type] !== undefined){

                //no ctf data of this type skip, will always be null for players with no ctf matches
                if(category === "ctf" && playerData[type] === null){    
                    continue;
                }

                currentPoints += playerData[type] * typeData.points;
                //console.log(category, type, typeData);
            }
        }
    }

    t.ranking_points = currentPoints;

    let mins = 0;

    if(t.playtime > 0){
        mins = t.playtime / 60;
    }

    //Punish players score heavily if they are under 30 mins by setting mins to 30
    if(mins < 30) mins = 30;

    if(t.playtime > 0 && t.ranking_points !== 0){
        t.ranking_points = t.ranking_points / mins;
    }else{
        t.ranking_points = 0;
    }

    _applyTimePenalty(t, settings.penalty, mins);

    
}


function _removePlayersUnderMatchLimit(data, minMatches){

    const players = {};

    for(const player of Object.values(data)){

        if(player.total_matches >= minMatches){
            players[player.player_id] = player;
        }
    }


    return players;
}

export async function calculateRankings(targetId, playerIds, type){

    if(playerIds.length === 0) return;

    if(type === undefined) type = "gametype";

    type = type.toLowerCase();

    if(!bValidRankingType(type)) throw new Error(`Not a valid type for calculateRankings`);

    let totals =  await getPlayerTotals(type, targetId, playerIds)

    const settings = await getRankingSettings();

    for(const playerData of Object.values(totals)){
        _setRankingPoints(settings, playerData);
    }

    if(type === "gametype"){
        await deletePlayerRankings(targetId, playerIds);
    }else{

        await deletePlayerMapRankings(targetId, playerIds);
    }

    let minMatches = settings?.penalty?.min_matches ?? null;

    if(type === "map"){

        minMatches = settings?.penalty?.map_min_matches ?? null;
    }
    
    if(minMatches !== null){
        minMatches = minMatches.points;
        totals = _removePlayersUnderMatchLimit(totals, minMatches);
    }

    await bulkInsertRankings(targetId, Object.values(totals), type);
}



async function getRankingPlayerCount(targetId, minDate, type){


    let query = `SELECT COUNT(*) as total_rows FROM nstats_rankings WHERE gametype_id=? AND last_active>=?`;

    if(type === "map"){
        query = `SELECT COUNT(*) as total_rows FROM nstats_map_rankings WHERE map_id=? AND last_active>=?`;
    }

    const result = await simpleQuery(query, [targetId, minDate]);

    return result[0].total_rows;
}


/**
 * 
 * @param {*} targetId 
 * @param {*} page 
 * @param {*} perPage 
 * @param {*} timeRange 
 * @param {*} type if undefined will fetch gametype rankings
 * @returns 
 */
export async function getRankings(targetId, page, perPage, timeRange, type){

    if(type === undefined) type = "gametype";

    if(!bValidRankingType(type)) type = "gametype";

    const day = 60 * 60 * 24;

    const now = new Date();
    const minDate = (timeRange > 0) ? new Date(now - day * timeRange * 1000) : new Date(0);

    const [cleanPage, cleanPerPage, start] = sanitizePagePerPage(page, perPage);

    let query = `SELECT * FROM nstats_rankings WHERE gametype_id=? AND last_active>=? ORDER by score DESC LIMIT ?, ?`;

    if(type === "map"){
        query = `SELECT * FROM nstats_map_rankings WHERE map_id=? AND last_active>=? ORDER by score DESC LIMIT ?, ?`;
    }

    const data = await simpleQuery(query, [targetId, minDate, start, cleanPerPage]);
    const totalResults = await getRankingPlayerCount(targetId, minDate, type);

    return {data, totalResults};
}

export async function getAllSettings(){

    return await simpleQuery(`SELECT * FROM nstats_ranking_settings`);
}


async function updateRankingSetting(id, value){

    const query = `UPDATE nstats_ranking_settings SET points=? WHERE id=?`;

    return await simpleQuery(query, [value, id]);
}

export async function updateRankingSettings(settings){

    const passed = [];
    const fails = [];

    for(let i = 0; i < settings.length; i++){

        const s = settings[i];

        const result = await updateRankingSetting(s.id, s.value);

        if(result.affectedRows > 0){
            passed.push(s.id);
        }else{
            fails.push(s.id);
        }
    }

    return {passed, fails};
}


async function deleteAllPlayerRankings(){

    const query = `DELETE FROM nstats_rankings`;

    await simpleQuery(query);

}

async function deleteGametypeRankings(id){

    const query = `DELETE FROM nstats_rankings WHERE gametype_id=?`;

    await simpleQuery(query, [id]);

}


async function deleteMapRankings(id){

    const query = `DELETE FROM nstats_map_rankings WHERE map_id=?`;

    await simpleQuery(query, [id]);
}

async function deleteAllMapRankings(){

    const query = `DELETE FROM nstats_map_rankings`;

    await simpleQuery(query);
}

export async function recalculateAllRankings(){

    const gametypeIds = await getAllGametypeIds();

    await deleteAllPlayerRankings();

    for(let i = 0; i < gametypeIds.length; i++){
        
        const g = gametypeIds[i];

        const playerIds = await getAllPlayerGametypeIds(g);

        await calculateRankings(g, playerIds);
    }

    await deleteAllMapRankings();

    const mapIds = await getAllMapIds();

    for(let i = 0; i < mapIds.length; i++){

        const m = mapIds[i];

        await recalculateMap(m);
    }


    return `Recalculated ${gametypeIds.length} gametype rankings, and ${mapIds.length} map rankings`;
}

export async function recalculateGametype(id){

    await deleteGametypeRankings(id);

    const playerIds = await getAllPlayerGametypeIds(id);

    await calculateRankings(id, playerIds);
  
}

export async function recalculatePlayersByIds(playerIds){

    if(playerIds.length === 0) return null;

    const gametypeIds = await getAllGametypeIds();

    for(let i = 0; i < gametypeIds.length; i++){
        
        const g = gametypeIds[i];

        const playerIds = await getAllPlayerGametypeIds(g);

        await calculateRankings(g, playerIds)
    }

}


async function getRankingPosition(score, gametypeId, minDate, type){

    let query = null;

    if(type === "map"){
        query = `SELECT COUNT(*) as position FROM nstats_map_rankings WHERE score>? AND map_id=? AND last_active>? ORDER BY score DESC`;
    }else{
        query = `SELECT COUNT(*) as position FROM nstats_rankings WHERE score>? AND gametype_id=? AND last_active>? ORDER BY score DESC`;
    }

    const result = await simpleQuery(query, [score, gametypeId, minDate]);
    
    return result[0].position + 1;
}


async function getPlayerMapRankings(playerId, minDate){

    const query = `SELECT nstats_map_rankings.map_id,
    nstats_map_rankings.matches,
    nstats_map_rankings.playtime,
    nstats_map_rankings.score,
    nstats_map_rankings.last_active,
    nstats_maps.name as name 
    FROM nstats_map_rankings 
    LEFT JOIN nstats_maps ON nstats_maps.id = nstats_map_rankings.map_id
    WHERE nstats_map_rankings.player_id=? AND nstats_map_rankings.last_active>? ORDER BY nstats_maps.name ASC`;

    const result = await simpleQuery(query, [playerId, minDate]);

    for(let i = 0; i < result.length; i++){

        const r = result[i];
        r.position = await getRankingPosition(r.score, r.map_id, minDate, "map") ?? -1;
    }

    return result;
}

export async function getPlayerRankings(playerId, minDate){

    const query = `SELECT nstats_rankings.gametype_id,
    nstats_rankings.matches,
    nstats_rankings.playtime,
    nstats_rankings.score,
    nstats_rankings.last_active,
    nstats_gametypes.name as name
    FROM nstats_rankings 
    LEFT JOIN nstats_gametypes ON nstats_gametypes.id = nstats_rankings.gametype_id
    WHERE nstats_rankings.player_id=? AND nstats_rankings.last_active>? ORDER BY nstats_gametypes.name ASC`;

    const result = await simpleQuery(query, [playerId, minDate]);

    for(let i = 0; i < result.length; i++){

        const r = result[i];
        const pos = await getRankingPosition(r.score, r.gametype_id, minDate, "gametype");
        r.position = (pos !== null) ? pos : -1;
        
    }

    const maps = await getPlayerMapRankings(playerId, minDate);

    return {"gametypes": result, "maps": maps};
}



export async function recalculateMap(id){

    await deleteMapRankings(id);

    const playerIds = await getAllPlayerMapIds(id);

    await calculateRankings(id, playerIds, "map");
  
}


export async function getRankingsWithPlayerNames(targetId, page, perPage, timeRange, type){

    const {totalResults, data} = await getRankings(targetId, page, perPage, timeRange, type);


    const playerIds = new Set([...data.map((d) =>{
        return d.player_id;
    })]);

    const playerInfo = await getBasicPlayerInfo([...playerIds]);

    for(let i = 0; i < data.length; i++){

        const d = data[i];

        d.name = playerInfo[d.player_id]?.name || "Not Found";
        d.country = playerInfo[d.player_id]?.country || "xx";
    }

    return {totalResults, data}
}


export async function getUniqueMaps(){

    const query = `SELECT DISTINCT map_id FROM nstats_map_rankings`;

    const result = await simpleQuery(query);

    return result.map((r) =>{
        return r.map_id;
    });
}


export async function getUniqueGametypes(){

    const query = `SELECT DISTINCT gametype_id FROM nstats_rankings`;

    const result = await simpleQuery(query);

    return result.map((r) =>{
        return r.gametype_id;
    });
}