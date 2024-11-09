import { simpleQuery } from "./database.mjs";



export async function getMatchDamage(matchId){

    const query = `SELECT player_id,damage_delt,damage_taken,self_damage,team_damage_delt,
    team_damage_taken,fall_damage,drown_damage,cannon_damage FROM nstats_damage_match WHERE match_id=?`;

    const result = await simpleQuery(query, [matchId]);

    const data = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];
        data[r.player_id] = r;
    }

    return data;
}