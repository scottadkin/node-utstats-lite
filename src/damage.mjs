import { simpleQuery, bulkInsert } from "./database.mjs";
import { getAllPlayedMatchIds } from "./maps.mjs";
import { getMatchesGametypes, getMatchesPlaytime, getMapAndGametypeIds } from "./matches.mjs";
import Message from "./message.mjs";


export async function getMatchDamage(matchId){

    const query = `SELECT player_id,
    damage_delt as damageDelt,
    damage_taken as damageTaken,
    self_damage as selfDamage,
    team_damage_delt as teamDamageDelt,
    team_damage_taken as teamDamageTaken,
    fall_damage as fallDamage,
    drown_damage as drownDamage,
    cannon_damage as cannonDamage
    FROM nstats_damage_match WHERE match_id=?`;

    const result = await simpleQuery(query, [matchId]);

    const data = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];
        data[r.player_id] = r;
        delete data[r.player_id].player_id; 
    }

    return data;
}

export async function changePlayerMatchIds(oldIds, newId){

    if(oldIds.length === 0) return {"changedRows": 0};

    const query = `UPDATE nstats_damage_match SET player_id=? WHERE player_id IN (?)`;

    return await simpleQuery(query, [newId, oldIds]);
}


async function createPlayerTotal(playerId, gametypeId){

    const query = `INSERT INTO nstats_player_totals_damage VALUES (NULL,?,?,0,0,0,0,0,0,0,0,0,0)`;

    return await simpleQuery(query, [playerId, gametypeId]);
}

async function bPlayerTotalExist(playerId, gametypeId){

    const query = `SELECT COUNT(*) as total_players FROM nstats_player_totals_damage WHERE player_id=? AND gametype_id=?`;

    const result = await simpleQuery(query, [playerId, gametypeId]);

    return result[0].total_players;
}


async function updatePlayerTotal(playerId, gametypeId){

    if(!await bPlayerTotalExist(playerId, gametypeId)){
        await createPlayerTotal(playerId, gametypeId);
    }
}

export async function updatePlayerTotals(players, gametypeId){

    for(let i = 0; i < players.length; i++){

        const p = players[i];
        if(p.playtime === 0) continue;

        const d = p.damageData;

        if(d === undefined) continue;

        await updatePlayerTotal(p.masterId, gametypeId);
    }


}


export async function insertMatchData(players, matchId, mapId, gametypeId){

    const insertVars = [];

    const query = `INSERT INTO nstats_damage_match 
    (player_id,match_id,map_id,gametype_id,damage_delt,damage_taken,self_damage,team_damage_delt,team_damage_taken,fall_damage,drown_damage,cannon_damage) VALUES ?`;

    for(let i = 0; i < players.length; i++){

        const p = players[i];
        if(p.playtime === 0) continue;

        const d = p.damageData;
        if(d === undefined) continue;

        insertVars.push([
            p.masterId,
            matchId,
            mapId,
            gametypeId,
            d.damageDelt,
            d.damageTaken,
            d.selfDamage,
            d.teamDamageDelt,
            d.teamDamageTaken,
            d.fallDamage,
            d.drownDamage,
            d.cannonDamage
        ]);
    }

    await bulkInsert(query, insertVars);
}

export async function calculatePlayerTotals(){

    /*seasonId = parseInt(seasonId);
    if(seasonId !== seasonId) throw new Error(`seasonId must be valid integer`);

    seasonId = 0

    const vars = [];
    let where = ``;

    if(seasonId !== 0){
        vars.push(seasonId);
        where += ` WHERE EXISTS(SELECT 1 FROM nstats_matches WHERE nstats_matches.id = nstats_damage_match.match_id AND nstats_matches.season_id=?)`;
    }*/

  
    const query = `SELECT 
        COUNT(*) as total_matches,
        SUM(nstats_match_players.time_on_server) as total_playtime,
        SUM(nstats_damage_match.damage_delt) as total_damage_delt,
        SUM(nstats_damage_match.damage_taken) as total_damage_taken,
        nstats_damage_match.gametype_id,
        SUM(nstats_damage_match.self_damage) as total_self_damage,
        SUM(nstats_damage_match.team_damage_delt) as total_team_damage_delt,
        SUM(nstats_damage_match.team_damage_taken) as total_team_damage_taken,
        SUM(nstats_damage_match.fall_damage) as total_fall_damage,
        SUM(nstats_damage_match.drown_damage) as total_drown_damage,
        SUM(nstats_damage_match.cannon_damage) as total_cannon_damage,
        nstats_match_players.player_id
        FROM nstats_damage_match
        INNER JOIN nstats_match_players ON nstats_match_players.player_id = nstats_damage_match.player_id AND nstats_match_players.match_id = nstats_damage_match.match_id 
        GROUP BY nstats_damage_match.player_id,nstats_damage_match.gametype_id`;

    return await simpleQuery(query);
}

async function deleteAllTotals(){

    const query = `DELETE FROM nstats_player_totals_damage`;

    return await simpleQuery(query);
}

export async function bulkInsertPlayerTotals(data){

    const insertVars = [];

    /*for(const [gametypeId, gametypeData] of Object.entries(data)){

        for(const [playerId, d] of Object.entries(gametypeData)){

            insertVars.push([
                playerId, gametypeId, d.matches, d.playtime, d.damageDelt,
                d.damageTaken, d.selfDamage, d.teamDamageDelt, d.teamDamageTaken, d.fallDamage,
                d.drownDamage, d.cannonDamage
            ]);
        }
    }*/

        for(let i = 0; i < data.length; i++){

            const d = data[i];

            insertVars.push([
                d.player_id, d.gametype_id, d.total_matches, d.total_playtime, d.total_damage_delt,
                d.total_damage_taken, d.total_self_damage, d.total_team_damage_delt, d.total_team_damage_taken, d.total_fall_damage,
                d.total_drown_damage, d.total_cannon_damage
            ]);
        }

    const query = `INSERT INTO nstats_player_totals_damage (
    player_id,gametype_id,total_matches,playtime,damage_delt,
    damage_taken,self_damage,team_damage_delt,team_damage_taken,fall_damage,
    drown_damage,cannon_damage) VALUES ?`;

    await bulkInsert(query, insertVars);
}

async function recalculatePlayerTotals(){

    const totals = await calculatePlayerTotals();

    await deleteAllTotals();

    await bulkInsertPlayerTotals(totals);
    
}

export async function deleteMatch(seasonId, id){

    seasonId = parseInt(seasonId);
    if(seasonId !== seasonId) throw new Error(`seasonId must be valid integer`);
  
    await simpleQuery(`DELETE FROM nstats_damage_match WHERE match_id=?`, [id]);

    await recalculatePlayerTotals();

    //no season stuff for this table as may remove it in future
    return;

    if(seasonId !== 0){
        await recalculatePlayerTotals(seasonId);
    }
}

/**
 * used for v1.4.0 to v1.4.1 upgrade
 */
export async function setMatchMapGametypeIds(){

    const query = `SELECT DISTINCT match_id FROM nstats_damage_match WHERE map_id=0 OR gametype_id=0`;

    const result = await simpleQuery(query);

    if(result.length === 0){
        new Message(`nstats_damage_match data already exists, skipping.`,"note");
        return;
    }

    const matchIds = result.map((r) =>{ 
        return r.match_id;
    });

    const matchesInfo = await getMapAndGametypeIds(matchIds);

    const updateQuery = `UPDATE nstats_damage_match SET map_id=?,gametype_id=? WHERE match_id=?`;

    for(let i = 0; i < matchIds.length; i++){

        const id = matchIds[i];

        const info = matchesInfo[id];

        if(info === undefined){
            new Message(`Couldn't find match info for matchId ${id}`,"warning");
            continue;
        }

        await simpleQuery(updateQuery, [info.map, info.gametype, id]);
    }
    
}