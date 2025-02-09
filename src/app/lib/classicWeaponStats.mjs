import { bulkInsert, simpleQuery } from "./database.mjs";

export async function bulkInsertMatchStats(matchId, mapId, gametypeId, playerManager, weaponsManager){

    const insertVars = [];

    for(const player of Object.values(playerManager.mergedPlayers)){

        for(const [weaponId, s] of Object.entries(player.classicWeaponStats)){

            const altStats = weaponsManager.getPlayerWeaponStats(player.masterId, weaponId);

            let kills = 0;
            let deaths = 0;

            if(altStats.kills !== undefined){
                kills = altStats.kills;
            }

            if(altStats.deaths !== undefined){
                deaths = altStats.deaths;
            }

            insertVars.push([
                matchId, gametypeId, mapId, player.masterId, weaponId, kills, deaths, s.shots, s.hits, s.accuracy, s.damage
            ]);
        }
    }

    const query = `INSERT INTO nstats_classic_weapon_match_stats (match_id,gametype_id,map_id,player_id,weapon_id,kills,deaths,shots,hits,accuracy,damage) VALUES ?`;

    await bulkInsert(query, insertVars);
}


export async function getMatchData(matchId){

    const query = `SELECT player_id,weapon_id,kills,deaths,shots,hits,accuracy,damage FROM nstats_classic_weapon_match_stats WHERE match_id=?`;

    return await simpleQuery(query, [matchId]);
}