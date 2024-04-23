import { simpleQuery } from "./database.mjs";

export async function updateSettings(ignoreBots, ignoreDuplicates, minPlayers, minPlaytime){

    ignoreBots = parseInt(ignoreBots);
    ignoreDuplicates = parseInt(ignoreDuplicates);
    minPlayers = parseInt(minPlayers);
    minPlaytime = parseInt(minPlaytime);

    const query = `UPDATE nstats_logs_folder SET ignore_bots=?,ignore_duplicates=?,min_players=?,min_playtime=?`;

    await simpleQuery(query, [ignoreBots, ignoreDuplicates, minPlayers, minPlaytime]);
}


export async function getSettings(){

    const query = `SELECT * FROM nstats_logs_folder ORDER BY id ASC`;

    const result = await simpleQuery(query);

    if(result.length > 0) return result[0];

    return null;
}