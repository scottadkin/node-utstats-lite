import { simpleQuery } from "./database.mjs";



export async function getMatchDamage(matchId){

    const query = `SELECT player_id,
    damage_delt as damageDelt,
    damage_taken as damageTaken,
    self_damage as selfDamage,
    team_damage_delt as teamDamageDelt,
    team_damage_taken as teamDamageTaken,
    fall_damage as fallDamage,
    drown_damage as drownDamage,
    cannon_damage as cannonDamage
    FROM nstats_damage_match WHERE match_id=?`;

    const result = await simpleQuery(query, [matchId]);

    const data = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];
        data[r.player_id] = r;
    }

    return data;
}

export async function changePlayerMatchIds(oldIds, newId){

    if(oldIds.length === 0) return {"changedRows": 0};

    const query = `UPDATE nstats_damage_match SET player_id=? WHERE player_id IN (?)`;

    return await simpleQuery(query, [newId, oldIds]);
}