import { bulkInsert, simpleQuery } from "./database.mjs";


async function createTableIfNotExists(){

    const query = `CREATE TABLE IF NOT EXISTS nstats_test_weapon_damage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_id INTEGER NOT NULL,
        player_id INTEGER NOT NULL,
        weapon_id INTEGER NOT NULL,
        damage INTEGER NOT NULL
    ) STRICT`;

    await simpleQuery(query);
}

export async function testInsertPlayerWeaponStats(matchId, playerStats){


    await createTableIfNotExists();

    const insertVars = [];

    for(const [playerId, stats] of Object.entries(playerStats)){


        for(const [weaponId, damage] of Object.entries(stats)){

            insertVars.push([matchId, playerId, weaponId, damage.damage ]);
        }
    }


    const query = `INSERT INTO nstats_test_weapon_damage (match_id,player_id,weapon_id,damage) VALUES ?`;

    await bulkInsert(query, insertVars);
    
}


export async function getTestMatchWeaponData(matchId){

    const query = `SELECT * FROM nstats_test_weapon_damage WHERE match_id=?`;

    return await simpleQuery(query, [matchId]);
}