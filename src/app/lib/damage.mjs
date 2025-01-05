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



export async function getAllPlayerMatchData(){

    //if(matchIds.length === 0) return [];

    const query = `SELECT match_id,gametype_id,player_id,damage_delt,damage_taken,self_damage,
    team_damage_delt,team_damage_taken,fall_damage,drown_damage,cannon_damage 
    FROM nstats_damage_match`;
  

    return await simpleQuery(query);
}

async function deleteAllTotals(){

    const query = `DELETE FROM nstats_player_totals_damage`;

    return await simpleQuery(query);
}

export async function bulkInsertPlayerTotals(data){

    const insertVars = [];

    for(const [gametypeId, gametypeData] of Object.entries(data)){

        for(const [playerId, d] of Object.entries(gametypeData)){

            insertVars.push([
                playerId, gametypeId, d.matches, d.playtime, d.damageDelt,
                d.damageTaken, d.selfDamage, d.teamDamageDelt, d.teamDamageTaken, d.fallDamage,
                d.drownDamage, d.cannonDamage
            ]);
        }
    }

    const query = `INSERT INTO nstats_player_totals_damage (
    player_id,gametype_id,total_matches,playtime,damage_delt,
    damage_taken,self_damage,team_damage_delt,team_damage_taken,fall_damage,
    drown_damage,cannon_damage) VALUES ?`;

    await bulkInsert(query, insertVars);
}

async function recalculatePlayerTotals(){

    const matchesData = await getAllPlayerMatchData();

    const matchIds = [...new Set(matchesData.map((m) =>{
        return m.match_id;
    }))];

    const matchPlaytimes = await getMatchesPlaytime(matchIds);

    //gametypeId => playerId => damageData
    const totals = {};

    for(let i = 0; i < matchesData.length; i++){

        const m = matchesData[i];

        if(totals[m.gametype_id] === undefined){
            totals[m.gametype_id] = {};
        }

        if(totals[m.gametype_id][m.player_id] === undefined){

            totals[m.gametype_id][m.player_id] = {
                "matches": 0,
                //"matchIds": new Set(),
                "playtime": 0,
                "damageDelt": 0,
                "damageTaken": 0,
                "selfDamage": 0,
                "teamDamageDelt": 0,
                "teamDamageTaken": 0,
                "fallDamage": 0,
                "drownDamage": 0,
                "cannonDamage": 0
            };
        }

        const t = totals[m.gametype_id][m.player_id];

        const playtime = matchPlaytimes[m.match_id] ?? 0;

        t.matches++;
        t.playtime += playtime;
        //t.matchIds.add(m.match_id);
        t.damageDelt += m.damage_delt;
        t.damageTaken += m.damage_taken;
        t.selfDamage += m.self_damage;
        t.teamDamageDelt += m.team_damage_delt;
        t.teamDamageTaken += m.team_damage_taken;
        t.fallDamage += m.fall_damage;
        t.drownDamage += m.drown_damage;
        t.cannonDamage += m.cannon_damage;
    }


    await deleteAllTotals();

    await bulkInsertPlayerTotals(totals);
    
}

export async function deleteMatch(id){
  
    await simpleQuery(`DELETE FROM nstats_damage_match WHERE match_id=?`, [id]);
    await recalculatePlayerTotals();
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