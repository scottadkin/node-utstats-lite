import { bulkInsert, simpleQuery } from "./database.mjs";


export async function bulkInserKills(kills, matchId){
    
    const insertVars = [];

    for(let i = 0; i < kills.length; i++){

        const k = kills[i];

        insertVars.push([
            matchId,
            k.timestamp,
            k.type,
            k.killerMasterId,
            k.killerWeaponId,
            k.victimMasterId,
            k.victimWeaponId
        ]);
    }

    const query = `INSERT INTO nstats_kills (match_id,timestamp,kill_type,killer_id,killer_weapon,victim_id,victim_weapon) VALUES ?`;
    await bulkInsert(query, insertVars);
}

export async function getMatchKills(matchId){

    const query = `SELECT timestamp,killer_id,killer_weapon,victim_id,victim_weapon FROM nstats_kills WHERE match_id=?`;

    return await simpleQuery(query, [matchId]);
}

export async function getMatchKillsBasic(matchId){

    const query = `SELECT killer_id,victim_id FROM nstats_kills WHERE match_id=?`;

    return await simpleQuery(query, [matchId]);
}

export async function changePlayerIds(oldIds, newId){

    if(oldIds.length === 0) return {"changedRows": 0};

    const query = `UPDATE nstats_kills SET
    killer_id = IF(killer_id IN (?),?,killer_id),
    victim_id = IF(victim_id IN (?),?,victim_id)`;

    return await simpleQuery(query, [oldIds, newId, oldIds, newId]);
}

export async function deleteMatchKills(id){

    const query = `DELETE FROM nstats_kills WHERE match_id=?`;

    return await simpleQuery(query, [id]);
}

async function getGraphKillsData(matchId, matchStart){

    const query = `SELECT timestamp,kill_type,killer_id,victim_id 
    FROM nstats_kills
    WHERE match_id=?
    ORDER BY timestamp ASC`;

    const result = await simpleQuery(query, [matchId]);

    const teamKills = [];
    const kills = [];

    for(let i = 0; i < result.length; i++){

        const r = result[i];
        const type = r.kill_type;
        r.timestamp = r.timestamp - matchStart;

        if(type === 0){
            kills.push(r);
        }else if(type === 1){
            teamKills.push(r);
        }

        delete r.kill_type;
    }

    return {kills, teamKills};
}

/**
 * 
 * @param {*} kills Kills array timestamp,killer,victim
 * @param {*} timeframe in seconds
 */
function toKillsPerTimeframe(data, timeframe){

    timeframe = parseInt(timeframe);
    if(timeframe !== timeframe) throw new Error(`Timeframe must be an integer`);
    if(timeframe < 1) throw new Error(`Timeframe must be at least 1 second long`);

    const kills = {};
    const deaths = {};

    for(let i = 0; i < data.length; i++){

        const k = data[i];
        const timeSlot = Math.floor(k.timestamp / timeframe);

        const killer = k.killer_id;
        const victim = k.victim_id;


        if(kills[timeSlot] === undefined) kills[timeSlot] = {};

        if(kills[timeSlot][killer] === undefined){
            kills[timeSlot][killer] = 0;
        }

        kills[timeSlot][killer]++;

        if(deaths[timeSlot] === undefined) deaths[timeSlot] = {};
        if(deaths[timeSlot][victim] === undefined){
            deaths[timeSlot][victim] = 0;
        }

        deaths[timeSlot][victim]++;
    }



    return {kills, deaths};
}

export async function getKillsGraphData(matchId, matchStart, timeframe){

    const {kills, teamKills} = await getGraphKillsData(matchId, matchStart);

    const graphKills = toKillsPerTimeframe(kills, timeframe);
    const graphTeamKills = toKillsPerTimeframe(teamKills, timeframe);

    return {"kills": graphKills, "teamKills": graphTeamKills};

}