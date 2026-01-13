import { simpleQuery } from "./database.mjs";

export async function updateLogsFolderSettings(settings){

    const query = `UPDATE nstats_logs_folder SET ignore_bots=?,ignore_duplicates=?,min_players=?,min_playtime=?,append_team_sizes=?`;

    await simpleQuery(query, [
        parseInt(settings.ignore_bots), 
        parseInt(settings.ignore_duplicates), 
        parseInt(settings.min_players), 
        parseInt(settings.min_playtime), 
        parseInt(settings.append_team_sizes)
    ]);
}


export async function getSettings(){

    const query = `SELECT * FROM nstats_logs_folder ORDER BY id ASC`;

    const result = await simpleQuery(query);

    if(result.length > 0) return result[0];

    return null;
}