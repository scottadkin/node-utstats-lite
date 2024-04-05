import {simpleQuery} from "./database.mjs";



export async function createMatch(serverId, gametypeId, mapId, date, players){

    const query = `INSERT INTO nstats_matches VALUES(NULL,?,?,?,?,?)`;

    const result = await simpleQuery(query, [serverId, gametypeId, mapId, date, players]);

    if(result.insertId !== undefined) return result.insertId;

    return null;
}