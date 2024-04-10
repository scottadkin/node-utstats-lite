import { bulkInsert, simpleQuery } from "./database.mjs";



export async function getWeaponId(name){

    const query = `SELECT id FROM nstats_weapons WHERE name=?`;

    const result = await simpleQuery(query, [name]);

    if(result.length > 0) return result[0].id;

    return null;
}

export async function createWeapon(name){

    const query = `INSERT INTO nstats_weapons VALUES(NULL,?)`;

    const result = await simpleQuery(query, [name]);

    return result.insertId;
}


export async function bulkInsertMatchWeaponStats(data, matchId){

    const insertVars = [];

    for(const [pId, playerStats] of Object.entries(data)){

        const playerId = parseInt(pId);
   
        for(const [wId, weaponStats] of Object.entries(playerStats)){

            const weaponId = parseInt(wId);

            insertVars.push([
                playerId, matchId, weaponId, weaponStats.kills,
                weaponStats.deaths, weaponStats.teamKills
            ]);
        }
    }

    const query = `INSERT INTO nstats_match_weapon_stats (match_id,player_id,weapon_id,kills,deaths,team_kills) VALUES ?`;

    await bulkInsert(query, insertVars);

}