import { bulkInsert, simpleQuery } from "./database.mjs";


export async function bulkInserKills(kills, matchId){
    
    const insertVars = [];

    for(let i = 0; i < kills.length; i++){

        const k = kills[i];

        insertVars.push([
            matchId,
            k.timestamp,
            k.type,
            k.killerMasterId,
            k.killerWeaponId,
            k.victimMasterId,
            k.victimWeaponId
        ]);
    }

    const query = `INSERT INTO nstats_kills (match_id,timestamp,kill_type,killer_id,killer_weapon,victim_id,victim_weapon) VALUES ?`;
    await bulkInsert(query, insertVars);
}

export async function getMatchKills(matchId){

    const query = `SELECT timestamp,killer_id,killer_weapon,victim_id,victim_weapon FROM nstats_kills WHERE match_id=?`;

    return await simpleQuery(query, [matchId]);
}

export async function getMatchKillsBasic(matchId){

    const query = `SELECT killer_id,victim_id FROM nstats_kills WHERE match_id=?`;

    return await simpleQuery(query, [matchId]);
}

export async function changePlayerIds(oldIds, newId){

    if(oldIds.length === 0) return {"changedRows": 0};

    const query = `UPDATE nstats_kills SET
    killer_id = IF(killer_id IN (?),?,killer_id),
    victim_id = IF(victim_id IN (?),?,victim_id)`;

    return await simpleQuery(query, [oldIds, newId, oldIds, newId]);
}
