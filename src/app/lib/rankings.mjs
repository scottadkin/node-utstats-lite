import { simpleQuery, bulkInsert } from "./database.mjs";
import { sanitizePagePerPage } from "./generic.mjs";
import { getAllIds as getAllGametypeIds } from "./gametypes.mjs";
import { getAllGametypeIds as getAllPlayerGametypeIds } from "./players.mjs";


async function getPlayerFragTotals(gametypeId, playerIds){

    const query = `SELECT player_id,last_active,playtime,total_matches,kills,deaths,suicides,
    team_kills,spree_1,spree_2,spree_3,spree_4,spree_5,multi_1,multi_2,multi_3,multi_4
    FROM nstats_player_totals WHERE gametype_id=? AND player_id IN(?)`;

    return await simpleQuery(query, [gametypeId, playerIds]);

}

async function getPlayerCTFTotals(gametypeId, playerIds){

    const query = `SELECT player_id,flag_taken,flag_pickup,flag_drop,flag_assist,flag_cover,flag_seal,
    flag_cap,flag_kill,flag_return,flag_return_base,flag_return_mid,flag_return_enemy_base,flag_return_save 
    FROM nstats_player_totals_ctf
    WHERE gametype_id=? AND player_id IN(?)`;

    return await simpleQuery(query, [gametypeId, playerIds]);
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

function _mergeTotalsData(fragTotals, ctfTotals){

    const data = {};

    for(let i = 0; i < fragTotals.length; i++){

        const f = fragTotals[i];
        f.rankingPoints = 0;

        data[f.player_id] = f;
    }

    for(let i = 0; i < ctfTotals.length; i++){

        const c = ctfTotals[i];

        if(data[c.player_id] !== undefined){
 
            data[c.player_id] = {...data[c.player_id], ...c};
        }
    }

    return data;
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
            if(type === "penalty") continue;
                
            if(playerData[type] !== undefined){
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

    //console.log(t.total_matches);

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

async function getPlayerMapFragTotals(mapId, playerIds){

    if(playerIds.length === 0) return [];

    const query = `SELECT player_id,MAX(match_date) as last_active,SUM(time_on_server) as playtime,COUNT(*) as total_matches,SUM(kills) as kills, SUM(deaths) as deaths,
    SUM(suicides) as suicides, SUM(team_kills) as team_kills, SUM(spree_1) as spree_1, SUM(spree_2) as spree_2, SUM(spree_3) as spree_3,
    SUM(spree_4) as spree_4, SUM(spree_5) as spree_5, SUM(multi_1) as multi_1, SUM(multi_2) as multi_2, SUM(multi_3) as multi_3, SUM(multi_4) as multi_4
    FROM nstats_match_players WHERE map_id=? AND player_id IN(?) GROUP BY player_id`;

    return await simpleQuery(query, [mapId, playerIds]);
}


async function getPlayerMapCTFTotals(mapId, playerIds){

    if(playerIds.length === 0) return [];

    const query = `SELECT player_id,SUM(flag_taken) as flag_taken,SUM(flag_pickup) as flag_pickup ,SUM(flag_drop) as flag_drop ,SUM(flag_assist) as flag_assist,
    SUM(flag_cover) as flag_cover ,SUM(flag_seal) as flag_seal, SUM(flag_cap) as flag_cap, SUM(flag_kill) as flag_kill, SUM(flag_return) as flag_return, 
    SUM(flag_return_base) as flag_return_base, SUM(flag_return_mid) as flag_return_mid,
    SUM(flag_return_enemy_base) as flag_return_enemy_base, SUM(flag_return_save) as flag_return_save 
    FROM nstats_match_ctf WHERE map_id=? AND player_id IN (?) GROUP BY player_id`;

    return await simpleQuery(query, [mapId,playerIds]);
}

export async function calculateRankings(targetId, playerIds, type){

    if(playerIds.length === 0) return;

    if(type === undefined) type = "gametype";

    type = type.toLowerCase();

    const validTypes = ["gametype", "map"];

    if(!validTypes.indexOf(type) === -1) throw new Error(`Not a valid type for calculateRankings`);

    let fragTotals = [];
    let ctfTotals = [];

    if(type === "gametype"){
        fragTotals = await getPlayerFragTotals(targetId, playerIds);
        ctfTotals = await getPlayerCTFTotals(targetId, playerIds);
    }else{

        fragTotals = await getPlayerMapFragTotals(targetId, playerIds);
        ctfTotals = await getPlayerMapCTFTotals(targetId, playerIds);

    }
    
    let mergedData = _mergeTotalsData(fragTotals, ctfTotals);

    const settings = await getRankingSettings();

    for(const playerData of Object.values(mergedData)){
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
        mergedData = _removePlayersUnderMatchLimit(mergedData, minMatches);
    }

    await bulkInsertRankings(targetId, Object.values(mergedData), type);

}


async function getRankingPlayerCount(gametypeId, minDate){

    const query = `SELECT COUNT(*) as total_rows FROM nstats_rankings WHERE gametype_id=? AND last_active>=?`;

    const result = await simpleQuery(query, [gametypeId, minDate]);

    return result[0].total_rows;
}

export async function getRankings(gametypeId, page, perPage, timeRange){

    const day = 60 * 60 * 24;

    const now = new Date();
    const minDate = (timeRange > 0) ? new Date(now - day * timeRange * 1000) : new Date(0);

    const [cleanPage, cleanPerPage, start] = sanitizePagePerPage(page, perPage);

    const query = `SELECT * FROM nstats_rankings WHERE gametype_id=? AND last_active>=? ORDER by score DESC LIMIT ?, ?`;

    const data = await simpleQuery(query, [gametypeId, minDate, start, cleanPerPage]);
    const totalResults = await getRankingPlayerCount(gametypeId, minDate);

    return {data, totalResults};
}

export async function getAllSettings(){

    return await simpleQuery(`SELECT * FROM nstats_ranking_settings`);
}


async function updateSetting(id, value){

    const query = `UPDATE nstats_ranking_settings SET points=? WHERE id=?`;

    return await simpleQuery(query, [value, id]);
}

export async function updateSettings(settings){

    let passes = 0;
    let fails = 0;

    for(let i = 0; i < settings.length; i++){

        const s = settings[i];

        const result = await updateSetting(s.id, s.points);

        if(result.affectedRows > 0){
            passes++;
        }else{
            fails++;
        }
    }

    return {passes, fails};
}


async function deleteAllPlayerRankings(){

    const query = `DELETE FROM nstats_rankings`;

    await simpleQuery(query);

}

async function deleteGametypeRankings(id){

    const query = `DELETE FROM nstats_rankings WHERE gametype_id=?`;

    await simpleQuery(query, [id]);

}

export async function recalculateAll(){

    const gametypeIds = await getAllGametypeIds();

    await deleteAllPlayerRankings();

    for(let i = 0; i < gametypeIds.length; i++){
        
        const g = gametypeIds[i];

        const playerIds = await getAllPlayerGametypeIds(g);

        await calculateRankings(g, playerIds);
    }
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


async function getRankingPosition(score, gametypeId, minDate){

    const query = `SELECT COUNT(*) as position FROM nstats_rankings WHERE score>? AND gametype_id=? AND last_active>? ORDER BY score DESC`;

    const result = await simpleQuery(query, [score, gametypeId, minDate]);
    
    return result[0].position;
}

export async function getPlayerRankings(playerId, minDate){

    const query = `SELECT gametype_id,matches,playtime,score,last_active FROM nstats_rankings WHERE player_id=? AND last_active>?`;

    const result = await simpleQuery(query, [playerId, minDate]);

    for(let i = 0; i < result.length; i++){

        const r = result[i];
        const pos = await getRankingPosition(r.score, r.gametype_id, minDate);
        r.position = (pos !== null) ? pos + 1 : -1;
        
    }

    return result;
}
