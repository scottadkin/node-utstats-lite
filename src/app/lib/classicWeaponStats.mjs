import { bulkInsert } from "./database.mjs";

export async function bulkInsertMatchStats(matchId, mapId, gametypeId, playerManager){

    const insertVars = [];

    for(const player of Object.values(playerManager.mergedPlayers)){

        for(const [weaponId, s] of Object.entries(player.classicWeaponStats)){

            insertVars.push([
                matchId, gametypeId, mapId, player.masterId, weaponId, s.shots, s.hits, s.accuracy, s.damage
            ]);
        }
    }

    const query = `INSERT INTO nstats_classic_weapon_match_stats (match_id,gametype_id,map_id,player_id,weapon_id,shots,hits,accuracy,damage) VALUES ?`;

    await bulkInsert(query, insertVars);
}