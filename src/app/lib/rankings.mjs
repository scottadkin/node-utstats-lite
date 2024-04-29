import { simpleQuery, bulkInsert } from "./database.mjs";


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

    for(const [playerId, p] of Object.entries(data)){

        insertVars.push([
            playerId,
            gametypeId,
            p.totalMatches,
            p.playtime,
            p.rankingPoints,
            p.lastActive
        ]);
    }


    await bulkInsert(query, insertVars);
}

function _updateTotals(settings, totals, playerData){

    const id = playerData.player_id;

    const t = totals[id];

    let currentPoints = 0;

    for(const category of Object.keys(settings)){

        for(const [type, typeData] of Object.entries(settings[category])){
            currentPoints += playerData[type] * typeData.points;
        }
    }

    t.rankingPoints = currentPoints;

    let mins = 0;

    if(t.playtime > 0){
        mins = t.playtime / 60;
    }

    if(t.playtime > 0){
        t.rankingPoints = t.rankingPoints / mins;
    }else{
        t.rankingPoints = 0;
    }
}


export async function calculateRankings(gametypeId, playerIds){

    if(playerIds.length === 0) return;

    const fragTotals = await getPlayerFragTotals(gametypeId, playerIds);
    const ctfTotals = await getPlayerCTFTotals(gametypeId, playerIds);

    const settings = await getRankingSettings();

    //console.log(settings);
    const totals = {};

    for(let i = 0; i < fragTotals.length; i++){

        const f = fragTotals[i];

        totals[f.player_id] = {
            "rankingPoints": 0,
            "totalMatches": f.total_matches,
            "playtime": f.playtime,
            "lastActive": f.last_active
        };
    }

    console.log(totals);

    for(let i = 0; i < fragTotals.length; i++){

        const f = fragTotals[i];
        _updateTotals(settings, totals, f);
    }

    console.log(totals);



    await deletePlayerRankings(gametypeId, playerIds);

    await bulkInsertRankings(gametypeId, totals);

}