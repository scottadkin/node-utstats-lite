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


async function bLogsSettingsExist(){

    const query = `SELECT COUNT(*) as total_rows FROM nstats_logs_folder`;
    const result = await simpleQuery(query);

    if(result[0].total_rows > 0) return true;

    return false;
}

export async function createDefaultLogsFolderSettings(){

    if(await bLogsSettingsExist()) return;

    const dummyDate = new Date(Date.now());
    
    return await simpleQuery(`INSERT INTO nstats_logs_folder VALUES(NULL, ?, ?,0,0,0,0,0,0,0)`, [dummyDate, dummyDate]);
    
}