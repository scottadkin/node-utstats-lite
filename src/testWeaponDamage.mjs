import { bulkInsert, simpleQuery } from "./database.mjs";


async function createTableIfNotExists(){

    const query = `CREATE TABLE IF NOT EXISTS nstats_test_weapon_damage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_id INTEGER NOT NULL,
        player_id INTEGER NOT NULL,
        weapon_name TEXT NOT NULL,
        damage INTEGER NOT NULL
    ) STRICT`;

    await simpleQuery(query);
}

export async function testInsertPlayerWeaponStats(matchId, playerStats, playerManager){


    await createTableIfNotExists();

    const insertVars = [];

    for(const [playerId, stats] of Object.entries(playerStats)){

        const player = playerManager.getPlayerById(playerId);
        if(player === null) continue;

        for(const [weaponId, damage] of Object.entries(stats)){

            insertVars.push([matchId, player.masterId, weaponId, damage.damage ]);
        }
    }


    const query = `INSERT INTO nstats_test_weapon_damage (match_id,player_id,weapon_name,damage) VALUES ?`;

    await bulkInsert(query, insertVars);
    
}