import { bulkInsert, simpleQuery } from "./database.mjs";



export async function insertPlayerDamageWeaponStats(matchId, gametypeId, mapId, playerStats){

    const insertVars = [];

    for(const [playerId, stats] of Object.entries(playerStats)){


        for(const [weaponId, damage] of Object.entries(stats)){

            insertVars.push([matchId, gametypeId, mapId, playerId, weaponId, damage.damage ]);
        }
    }


    const query = `INSERT INTO nstats_match_player_weapon_damage (match_id, gametype_id, map_id, player_id,weapon_id,damage) VALUES ?`;

    await bulkInsert(query, insertVars);
    
}


export async function getMatchWeaponDamage(matchId){

    const query = `SELECT * FROM nstats_match_player_weapon_damage WHERE match_id=?`;

    return await simpleQuery(query, [matchId]);
}