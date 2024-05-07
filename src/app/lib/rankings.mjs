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


async function bulkInsertRankings(gametypeId, data){

    const query = `INSERT INTO nstats_rankings (
        player_id, gametype_id, matches, playtime,
        score, last_active
    ) VALUES ?`;

    const insertVars = [];

    for(const p of Object.values(data)){

        insertVars.push([
            p.player_id,
            gametypeId,
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

function _setRankingPoints(settings, playerData){

    const t = playerData;

    let currentPoints = 0;

    for(const category of Object.keys(settings)){

        for(const [type, typeData] of Object.entries(settings[category])){

            if(playerData[type] !== undefined){
                currentPoints += playerData[type] * typeData.points;
            }
        }
    }

    t.ranking_points = currentPoints;

    let mins = 0;

    if(t.playtime > 0){
        mins = t.playtime / 60;
    }

    if(t.playtime > 0 && t.ranking_points !== 0){
        t.ranking_points = t.ranking_points / mins;
    }else{
        t.ranking_points = 0;
    }
}

export async function calculateRankings(gametypeId, playerIds){

    if(playerIds.length === 0) return;

    const fragTotals = await getPlayerFragTotals(gametypeId, playerIds);
    const ctfTotals = await getPlayerCTFTotals(gametypeId, playerIds);
    
    const mergedData = _mergeTotalsData(fragTotals, ctfTotals);

    const settings = await getRankingSettings();

    for(const playerData of Object.values(mergedData)){
        _setRankingPoints(settings, playerData);
    }

    await deletePlayerRankings(gametypeId, playerIds);

    await bulkInsertRankings(gametypeId, Object.values(mergedData));

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

    const [cleanPage, cleanPerPage, start] = sanitizePagePerPage(page, perPage)

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


export async function recalculateAll(){

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
