import { simpleQuery } from "./database.mjs";

export async function getLogsFolderSettings(){

    const query = `SELECT * FROM nstats_logs_folder`;

    const result = await simpleQuery(query);

    if(result.length > 0) return result[0];

    return null;
}

export async function getAllFTPSettings(){

    const query = `SELECT * FROM nstats_ftp ORDER BY name ASC`;

    const result = await simpleQuery(query);

    const logsFolder = await getLogsFolderSettings();

    return {"ftp": result, "logsFolder": logsFolder}
}

async function bServerExist(host, port){

    const query = `SELECT COUNT(*) as total_servers FROM nstats_ftp WHERE host=? AND port=?`;
    const result = await simpleQuery(query, [host, port]);

    if(result[0].total_servers > 0) return true;

    return false;
}

export async function addServer(settings){


    if(settings.name === "") throw new Error(`Name can not be a blank string`);
    if(settings.host === "") throw new Error(`Host can not be a blank string`);
    if(settings.port === "") throw new Error(`Port can not be a blank string`);
    if(settings.user === "") throw new Error(`User can not be a blank string`);
    if(settings.password === "") throw new Error(`Password can not be a blank string`);

    /*if(await bServerExist(settings.host, settings.port)){
        throw new Error(`That server already exists!`);
    }*/

    const query = `INSERT INTO nstats_ftp VALUES(NULL,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

    const vars = [
        settings.name,
        settings.host,
        settings.port,
        settings.user,
        settings.password,
        settings.folder,
        settings.bDeleteFromFTP,
        "1999-11-30 00:00:00",
        "1999-11-30 00:00:00",
        0,
        0,
        settings.bIgnoreBots,
        settings.bIgnoreDuplicates,
        settings.minPlayers,
        settings.minPlaytime,
        settings.sftp,
        settings.bEnabled,
        settings.bDeleteTmpFiles
    ];

    await simpleQuery(query, vars);
}

export async function editServer(serverId, settings){

    if(serverId === undefined) throw new Error(`ServerId is undefined`);

    serverId = parseInt(serverId);

    if(serverId !== serverId) throw new Error(`Server Id must be a valid integer`);

    if(settings.name === "") throw new Error(`Name can not be a blank string`);
    if(settings.host === "") throw new Error(`Host can not be a blank string`);
    if(settings.port === "") throw new Error(`Port can not be a blank string`);
    if(settings.user === "") throw new Error(`User can not be a blank string`);
    if(settings.password === "") throw new Error(`Password can not be a blank string`);

    //need to check for duplicates that are also not the same id
 
    const query = `UPDATE nstats_ftp SET
    name=?,
    host=?,
    port=?,
    user=?,
    password=?,
    target_folder=?,
    delete_after_import=?,
    ignore_bots=?,
    ignore_duplicates=?,
    min_players=?,
    min_playtime=?,
    sftp=?,
    delete_tmp_files=?,
    enabled=?
    WHERE id=?`;

    const vars = [
        settings.name,
        settings.host,
        settings.port,
        settings.user,
        settings.password,
        settings.folder,
        settings.bDeleteFromFTP,
        settings.bIgnoreBots,
        settings.bIgnoreDuplicates,
        settings.minPlayers,
        settings.minPlaytime,
        settings.sftp,
        settings.bDeleteTmpFiles,
        settings.bEnabled,
        serverId
    ];

    await simpleQuery(query, vars);
}


export async function deleteServer(serverId){

    if(serverId === undefined) throw new Error(`ServerId is undefined`);

    serverId = parseInt(serverId);

    if(serverId !== serverId) throw new Error(`Server Id must be a valid integer`);

    const query = `DELETE FROM nstats_ftp WHERE id=?`;

    return await simpleQuery(query, [serverId]);
}