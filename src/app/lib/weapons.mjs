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
                matchId, playerId, weaponId, weaponStats.kills,
                weaponStats.deaths, weaponStats.teamKills
            ]);
        }
    }

    const query = `INSERT INTO nstats_match_weapon_stats (match_id,player_id,weapon_id,kills,deaths,team_kills) VALUES ?`;

    await bulkInsert(query, insertVars);

}

async function getWeaponNames(ids){

    if(ids.length === 0) return {};

    const query = `SELECT id,name FROM nstats_weapons WHERE id IN(?)`;

    const result = await simpleQuery(query, [ids]);

    const data = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];
        data[r.id] = r.name;
    }

    return data;
}

export async function getMatchWeaponStats(matchId){

    const query = `SELECT player_id,weapon_id,kills,deaths,team_kills FROM nstats_match_weapon_stats WHERE match_id=?`;
    const result = await simpleQuery(query, [matchId]);

    const uniqueWeapons = [...new Set(result.map((r) =>{
        return r.weapon_id;
    }))];

    const names = await getWeaponNames(uniqueWeapons);

    return {"data": result, "names": names}
}