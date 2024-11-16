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


async function createPlayerTotal(playerId, gametypeId){

    const query = `INSERT INTO nstats_player_totals_damage VALUES (NULL,?,?,0,0,0,0,0,0,0,0,0,0)`;

    return await simpleQuery(query, [playerId, gametypeId]);
}

async function bPlayerTotalExist(playerId, gametypeId){

    const query = `SELECT COUNT(*) as total_players FROM nstats_player_totals_damage WHERE player_id=? AND gametype_id=?`;

    const result = await simpleQuery(query, [playerId, gametypeId]);

    return result[0].total_players;
}


async function updatePlayerTotal(playerId, gametypeId){

    if(!await bPlayerTotalExist(playerId, gametypeId)){
        await createPlayerTotal(playerId, gametypeId);
    }
}

export async function updatePlayerTotals(playerManager, gametypeId){

    for(const p of Object.values(playerManager.mergedPlayers)){

        const d = p.damageData;

        if(d === undefined) continue;

        await updatePlayerTotal(p.masterId, gametypeId);

       /* insertVars.push([
            p.masterId,
            matchId,
            d.damageDelt,
            d.damageTaken,
            d.selfDamage,
            d.teamDamageDelt,
            d.teamDamageTaken,
            d.fallDamage,
            d.drownDamage,
            d.cannonDamage
        ]);*/
    }

}