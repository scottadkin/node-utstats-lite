import { bulkInsert, simpleQuery } from "./database.mjs";
import Message from "./message.mjs";


export async function insertPlayerDamageWeaponStats(matchId, gametypeId, mapId, playerStats, playerManager){

    const insertVars = [];

    for(const [playerId, stats] of Object.entries(playerStats)){


        for(const [weaponId, damage] of Object.entries(stats)){

            const player = playerManager.getPlayerByMasterId(playerId);
            if(player === null){
                new Message(`Failed to getPlayer: playerWeaponDamage.insertPlayerDamageWeaponStats`, "warning");
                continue;
            }
            insertVars.push([matchId, player.playtime, gametypeId, mapId, playerId, weaponId, damage.damage ]);
        }
    }

    const query = `INSERT INTO nstats_match_player_weapon_damage (match_id, playtime, gametype_id, map_id, player_id,weapon_id,damage) VALUES ?`;

    await bulkInsert(query, insertVars);
    
}


export async function getMatchWeaponDamage(matchId){

    const query = `SELECT * FROM nstats_match_player_weapon_damage WHERE match_id=?`;

    return await simpleQuery(query, [matchId]);
}