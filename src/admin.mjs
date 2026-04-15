import { mysqlGetColumnsAsArray, simpleQuery } from "./database.mjs";
import { mysqlSettings } from "../config.mjs";
import { mkdir, writeFile } from "node:fs/promises";
import Message from "./message.mjs";
import archiver from "archiver";
import fs from "fs";

export async function clearAllDataTables(){

    const tables = [
        "classic_weapon_match_stats",
        "ctf_caps",
        "ctf_cap_kills",
        "ctf_cap_suicides",
        "ctf_carry_times",
        "ctf_covers",
        "damage_match", 
        "dom_control_points",
        "gametypes",
        "importer_history",
        "kills",
        "logs",
        "logs_rejected",     
        "logs_downloads",     
        "maps",
        "map_rankings",
        "map_weapon_totals",
        "matches",
        "matches_dom",
        "match_ctf",
        "match_dom",
        "match_dom_team_score_history",
        "match_players",
        "match_weapon_stats",
        "players",
        "player_ctf_league",
        "player_map_minute_averages",
        "player_totals",
        "player_totals_ctf",
        "player_totals_damage",
        "player_totals_weapons",
        "rankings",
        "servers",
        "weapons" 
    ];


    for(let i = 0; i < tables.length; i++){

        const t = tables[i];

        const query = `TRUNCATE nstats_${t}`;

        await simpleQuery(query);
    }
    
}

export async function getAllDatabaseTableInfo(){

    const query = `SELECT table_name,table_rows,data_length,index_length 
    FROM information_schema.tables WHERE table_schema='${mysqlSettings.database}'`;

    return await simpleQuery(query); 
}

export async function getAllTableNames(){

    const query = `SELECT table_name FROM information_schema.tables WHERE table_schema='${mysqlSettings.database}'`;

    const result = await simpleQuery(query);

    return result.map((r) =>{
        return r.TABLE_NAME;
    });
}

async function getFullTable(tableName){


    const columns = await mysqlGetColumnsAsArray(tableName);

    const query = `SELECT * FROM ${tableName}`;

    const result = await simpleQuery(query);

    const rows = result.map((r) =>{
        return Object.values(r);
    });


    return {rows, columns}
}

function createBackupDirName(){

    const now = new Date(Date.now());

    const year = now.getFullYear();
    let month = now.getMonth() + 1;
    
    let date = now.getDate();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    let seconds = now.getSeconds();

    if(month < 10) month = `0${month}`;
    if(date < 10) date = `0${date}`;
    if(hours < 10) hours = `0${hours}`;
    if(minutes < 10) minutes = `0${minutes}`;
    if(seconds < 10) seconds = `0${seconds}`;


    return `${year}-${month}-${date}-${hours}-${minutes}-${seconds}`;
}

export async function createDatabaseBackup(){


    const backupDirName = createBackupDirName();

    const tables = await getAllTableNames();

    const dir = `./backups/${backupDirName}`;

    await mkdir(dir);

    for(let i = 0; i < tables.length; i++){

        const t = tables[i];

        const data = await getFullTable(t);

        new Message(`Creating backup of table ${t} as ${dir}/${t}.json`,"note");
        await writeFile(`${dir}/${t}.json`, JSON.stringify(data));
    }


    return {"folder": dir};
}



export async function createArchivedBackup(callback){

    const backupDirName = createBackupDirName();
    const tables = await getAllTableNames();

    const dir = `./backups/`;

    const output = fs.createWriteStream(dir + `${backupDirName}.zip`);
    const archive = archiver("zip", {
        zlib: { level: 9 }, // Sets the compression level.
    });


    // listen for all archive data to be written
    // 'close' event is fired only when a file descriptor is involved
    output.on("close", function () {
        console.log(archive.pointer() + " total bytes");
        console.log(
            "archiver has been finalized and the output file descriptor has closed.",
        );
        callback(dir + `${backupDirName}.zip`);
    });

    output.on("end", function () {
        console.log("Data has been drained");
    });

    // good practice to catch warnings (ie stat failures and other non-blocking errors)
    archive.on("warning", function (err) {
        if (err.code === "ENOENT") {
            // log warning
        } else {
            // throw error
            throw err;
        }
    });

    // good practice to catch this error explicitly
    archive.on("error", function (err) {
        throw err;
    });


    for(let i = 0; i < tables.length; i++){

        const t = tables[i];

        const data = await getFullTable(t);

        archive.append(JSON.stringify(data), {"name": `${t}.json`});
        new Message(`Creating backup of table ${t} as ${t}.json`,"note");
    }

    // pipe archive data to the file
    archive.pipe(output);

    archive.finalize();


}