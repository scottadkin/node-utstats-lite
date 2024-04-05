import {simpleQuery} from "./database.mjs";

export async function getPlayerMasterId(playerName, hwid, mac1, mac2){

    const query = `SELECT id FROM nstats_players WHERE name=? AND hwid=? AND mac1=? AND mac2=?`;

    const result = await simpleQuery(query, [playerName, hwid, mac1, mac2]);

    if(result.length === 0) return null;

    return result[0].id;
}

export async function createMasterPlayer(name, ip, hwid, mac1, mac2){

    const query = `INSERT INTO nstats_players VALUES(NULL,?,?,?,?,?,"")`;

    const result = await simpleQuery(query, [name, ip, hwid, mac1, mac2]);

    console.log(result);
}


export async function setMasterPlayerIP(masterId, ip){

    const query = `UPDATE nstats_players SET ip=? WHERE id=?`;

    return await simpleQuery(query, [ip, masterId]);
}