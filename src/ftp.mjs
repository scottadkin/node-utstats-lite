import { simpleQuery, mysqlInsertReturnRowId } from "./database.mjs";

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

export async function addFTPServer(settings){

    if(settings["server-name"] === "") throw new Error(`Name can not be a blank string`);
    if(settings["server-host"] === "") throw new Error(`Host can not be a blank string`);
    if(settings["server-port"] === "") throw new Error(`Port can not be a blank string`);
    if(settings["server-user"] === "") throw new Error(`User can not be a blank string`);
    if(settings["server-password"] === "") throw new Error(`Password can not be a blank string`);

    /*if(await bServerExist(settings.host, settings.port)){
        throw new Error(`That server already exists!`);
    }*/

    const query = `INSERT INTO nstats_ftp VALUES(NULL,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

    const vars = [
        settings["server-name"],
        settings["server-host"], //settings.host,
        settings["server-port"],//settings.port,
        settings["server-user"],//settings.user,
        settings["server-password"],//settings.password,
        settings["server-folder"],//settings.folder,
        settings["server-delete"],//settings.bDeleteFromFTP,
        "1999-11-30 00:00:00",
        "1999-11-30 00:00:00",
        0,
        0,
        settings["server-bots"],//settings.bIgnoreBots,
        settings["server-duplicates"],//settings.bIgnoreDuplicates,
        settings["server-players"],//settings.minPlayers,
        settings["server-playtime"],//settings.minPlaytime,
        settings["server-sftp"],//settings.sftp,
        settings["server-enabled"],//settings.bEnabled,
        settings["server-tmp"],//settings.bDeleteTmpFiles,
        settings["server-teams"],//settings.appendTeamSizes
    ];

    return await mysqlInsertReturnRowId(query, vars);
}

export async function editFTPServer(settings){

    if(settings["server-id"] === undefined) throw new Error(`ServerId is undefined`);

    settings["server-id"] = parseInt(settings["server-id"]);

    if(settings["server-id"] !== settings["server-id"]) throw new Error(`Server Id must be a valid integer`);

    if(settings["server-name"] === "") throw new Error(`Name can not be a blank string`);
    if(settings["server-host"] === "") throw new Error(`Host can not be a blank string`);
    if(settings["server-port"] === "") throw new Error(`Port can not be a blank string`);
    if(settings["server-user"] === "") throw new Error(`User can not be a blank string`);
    if(settings["server-password"] === "") throw new Error(`Password can not be a blank string`);

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
    enabled=?,
    append_team_sizes=?
    WHERE id=?`;


    const vars = [
        settings["server-name"],
        settings["server-host"],
        settings["server-port"],
        settings["server-user"],
        settings["server-password"],
        settings["server-folder"],
        settings["server-delete"],
        settings["server-bots"],
        settings["server-duplicates"],
        settings["server-players"],
        settings["server-playtime"],
        settings["server-sftp"],
        settings["server-tmp"],
        settings["server-enabled"],
        settings["server-teams"],
        settings["server-id"]
    ];

    await simpleQuery(query, vars);
}


export async function deleteFTPServer(serverId){

    if(serverId === undefined) throw new Error(`ServerId is undefined`);

    serverId = parseInt(serverId);

    if(serverId !== serverId) throw new Error(`Server Id must be a valid integer`);

    const query = `DELETE FROM nstats_ftp WHERE id=?`;

    return await simpleQuery(query, [serverId]);
}