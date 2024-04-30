import { simpleQuery, bulkInsert } from "./database.mjs";
import { sanitizePagePerPage } from "./generic.mjs";


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


async function getRankingPlayerCount(gametypeId){

    const query = `SELECT COUNT(*) as total_rows FROM nstats_rankings WHERE gametype_id=?`;

    const result = await simpleQuery(query, [gametypeId]);

    console.log(result);

    return result[0].total_rows;
}

export async function getRankings(gametypeId, page, perPage){

    const [cleanPage, cleanPerPage, start] = sanitizePagePerPage(page, perPage)

    const query = `SELECT * FROM nstats_rankings WHERE gametype_id=? ORDER by score DESC LIMIT ?, ?`;

    const data = await simpleQuery(query, [gametypeId, start, cleanPerPage]);
    const totalResults = await getRankingPlayerCount(gametypeId);
    
    return {data, totalResults};
}