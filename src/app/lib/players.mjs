import {simpleQuery} from "./database.mjs";

export async function getPlayerMasterId(playerName/*, hwid, mac1, mac2*/){

    //const query = `SELECT id FROM nstats_players WHERE name=? AND hwid=? AND mac1=? AND mac2=?`;
    const query = `SELECT id FROM nstats_players WHERE name=?`;

    const result = await simpleQuery(query, [playerName]);

    if(result.length === 0) return null;

    return result[0].id;
}

export async function createMasterPlayer(name, ip, hwid, mac1, mac2){

    const query = `INSERT INTO nstats_players VALUES(NULL,?,"")`;

    //const result = await simpleQuery(query, [name, ip, hwid, mac1, mac2]);
    const result = await simpleQuery(query, [name]);

    return result.insertId;
}


export async function insertPlayerMatchData(playerData, matchId){

    const p = playerData;

    const query = `INSERT INTO nstats_match_players VALUES(NULL,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

    const vars = [
        p.masterId,
        p.bSpectator,
        p.ip,
        p.country,
        p.hwid,
        p.mac1,
        p.mac2,
        matchId,
        p.bBot,
        p.team,
        p.stats.score,
        p.stats.frags,
        p.stats.kills,
        p.stats.deaths,
        p.stats.suicides,
        p.stats.teamKills,
        p.stats.efficiency,
        p.stats.timeOnServer,
        p.stats.ttl
    ];

    await simpleQuery(query, vars);
}