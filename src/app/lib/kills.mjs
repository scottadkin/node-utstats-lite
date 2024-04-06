import { bulkInsert } from "./database.mjs";


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