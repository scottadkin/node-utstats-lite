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

export async function updatePlayerTotals(playerManager, gametypeId){

    for(const p of Object.values(playerManager.mergedPlayers)){

        const d = p.damageData;

        if(d === undefined) continue;

        await updatePlayerTotal(p.masterId, gametypeId);

       /* insertVars.push([
            p.masterId,
            matchId,
            d.damageDelt,
            d.damageTaken,
            d.selfDamage,
            d.teamDamageDelt,
            d.teamDamageTaken,
            d.fallDamage,
            d.drownDamage,
            d.cannonDamage
        ]);*/
    }

}


export async function insertMatchData(playerManager, matchId, mapId, gametypeId){

    const insertVars = [];

    const query = `INSERT INTO nstats_damage_match 
    (player_id,match_id,map_id,gametype_id,damage_delt,damage_taken,self_damage,team_damage_delt,team_damage_taken,fall_damage,drown_damage,cannon_damage) VALUES ?`;

    for(const p of Object.values(playerManager.mergedPlayers)){

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



export async function getPlayerDataByMatchIds(matchIds){

    if(matchIds.length === 0) return [];

    const query = `SELECT match_id,player_id,damage_delt,damage_taken,self_damage,
    team_damage_delt,team_damage_taken,fall_damage,drown_damage,cannon_damage 
    FROM nstats_damage_match WHERE match_id IN(?)`;
  

    return await simpleQuery(query, [matchIds]);
}

async function deleteMapTotals(id){
    const query = `DELETE FROM nstats_d`;
}

function _getTotalPlaytime(data, targetIndexes){

    let total = 0;

    for(const [key, value] of Object.entries(data)){

        if(targetIndexes.indexOf(parseInt(key)) !== -1) total += value;
    }

    return total;
}

async function recalculateMapPlayerTotals(id){

    const mapMatchIds = await getAllPlayedMatchIds(id);
    //const matchData = await getAllMapPlayerData(id);
    const gametypeIds = await getMatchesGametypes(mapMatchIds);

    const matchData = await getPlayerDataByMatchIds(mapMatchIds);


    //delete all in nstats_player_map_minute_averages before isnerting new data

    // playerId => gametypeId => damageData
    const totals = {};

    for(let i = 0; i < matchData.length; i++){

        const m = matchData[i];

        const p = m.player_id;
        const gametypeId = gametypeIds[m.match_id];

        if(gametypeId === undefined) throw new Error("Gametype Id is null");

        if(totals[p] === undefined) totals[p] = {};

        if(totals[p][gametypeId] === undefined){

            totals[p][gametypeId] = {
                //we will calculate playtime by fetching all match ids(matchLength) then add them together later
                "matchIds": new Set(),
                "playtime": 0,
                "damageDelt": 0,
                "damageTaken": 0,
                "selfDamage": 0,
                "teamDamageDelt": 0,
                "teamDamageTaken": 0,
                "fallDamage": 0,
                "drownDamage": 0,
                "cannonDamage": 0,
                
            };
        }

        const t = totals[p][gametypeId];

        t.matchIds.add(m.match_id);
        t.damageDelt += m.damage_delt;
        t.damageTaken += m.damage_taken;
        t.selfDamage += m.self_damage;
        t.teamDamageDelt += m.team_damage_delt;
        t.teamDamageTaken += m.team_damage_taken;
        t.fallDamage += m.fall_damage;
        t.drownDamage += m.drown_damage;
        t.cannonDamage += m.cannon_damage;

    }

    console.log(totals);

    const matchPlaytimes = await getMatchesPlaytime(mapMatchIds);
    console.log(matchPlaytimes);


    for(const gametypeData of Object.values(totals)){

        for(const damageData of Object.values(gametypeData)){
            damageData.playtime = _getTotalPlaytime(matchPlaytimes, [...damageData.matchIds]);
        }
       // data.playtime = _getTotalPlaytime(matchPlaytimes, [...data.matchIds]);
      
    }


    console.log(totals);
    console.log(gametypeIds);

    //need to get matches gametypeIds for the damage totals table

}

export async function deleteMatch(id){
  
   // await simpleQuery(`DELETE FROM nstats_damage_match WHERE match_id=?`, [id]);

    //nstats_player_totals_damage

    await recalculateMapPlayerTotals(id);
}

/**
 * used for v1.4.0 to v1.4.1 upgrade
 */
export async function setMatchMapGametypeIds(){

    const query = `SELECT DISTINCT match_id FROM nstats_damage_match WHERE map_id=0 OR gametype_id=0`;

    const result = await simpleQuery(query);

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