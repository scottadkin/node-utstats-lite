import { bulkInsert, mysqlGetColumnsAsArray, simpleQuery } from "./database.mjs";
import { mysqlSettings, SQL_MODE } from "../config.mjs";
import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import Message from "./message.mjs";
import archiver from "archiver";
import fs from "fs";
import unzipper from "unzipper";
import {toMYSQLDateTime} from "./generic.mjs";

const DELETE_TABLES = [
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

export async function clearAllDataTables(){

    for(let i = 0; i < DELETE_TABLES.length; i++){

        const t = DELETE_TABLES[i];

        if(SQL_MODE !== "sqlite"){

            await simpleQuery(`TRUNCATE nstats_${t}`);

        }else{

            await simpleQuery(`DELETE FROM nstats_${t}`);
            await simpleQuery(`DELETE FROM SQLITE_SEQUENCE WHERE name='nstats_${t}'`);
        }
    }
    
}


export async function getAllBackupsInfo(){

    const dir = "./backups/";

    const files = await readdir(dir);

    const backupReg = /^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}(|\.zip)$/i;
    const jsonReg = /^(.+)\.json$/i;

    const zips = [];
    const folders = [];

    for(let i = 0; i < files.length; i++){

        const result = backupReg.exec(files[i]);
        if(result === null) continue;

        if(result[1] === ""){

            const subDir = await readdir(`${dir}${files[i]}`);
            const dirStats = await stat(`${dir}${files[i]}`);

            const currentFiles = [];
            let folderSize = 0;

            for(const file of subDir){

                if(!jsonReg.test(file)) continue;

                const stats = await stat(`${dir}${files[i]}/${file}`);
    
                currentFiles.push({
                    "name": file, 
                    "size": stats.size,
                    "modified": stats.mtimeMs
                });

                folderSize += stats.size;
       
            }

            folders.push({
                "name": files[i],
                "files": currentFiles,
                "size": folderSize,
                "modified": dirStats.mtimeMs
            });

        
    
        }else{

            const stats = await stat(`${dir}${files[i]}`);
            zips.push({"name": files[i], "size": stats.size, "modified": stats.mtimeMs});
        }
    }


    const backups = [...folders,...zips];


    backups.sort((a, b) =>{

        a = a.modified;
        b = b.modified;

        if(b > a){
            return 1;
        }else if(a > b){
            return -1;
        }
        return 0;
    });

    return backups;
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

    const dateColumns = ["first", "last", "first_match", "last_match", "date", "match_date", "last_active"];

    const rows = result.map((r) =>{

        const current = [];
        for(const [key, value] of Object.entries(r)){
            //console.log(key, value);

            if(dateColumns.indexOf(key) !== -1){

                if(typeof value === "object" && value instanceof Date){
   
                    current.push(toMYSQLDateTime(value));
                }else{
                    current.push(value);
                }
            }else{
                current.push(value);
            }

            //console.log(key === "last_active" typeof value);
        }
        return Object.values(current);
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

    new Message(`Creating backup of salt.mjs`, "note");
    await copyFile("./salt.mjs", `${dir}/salt.mjs`);


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

    const salt = await readFile("./salt.mjs");
    archive.append(salt, {"name": "salt.mjs"});
    // pipe archive data to the file
    archive.pipe(output);

    archive.finalize();
}

//Don't want to accidently mix backups or leave deleted tables data in the folder
async function deleteOldRestoreJSONFiles(){

    const dir = `./restore-from/`;

    const files = await readdir(dir);

    const reg = /^.+?\.json$/i;

    for(let i = 0; i < files.length; i++){

        const f = files[i];

        if(!reg.test(f)) continue;

        await rm(`${dir}${f}`);
    }

}

async function truncateTable(tableName){

    const query = `TRUNCATE ${tableName}`;

    return await simpleQuery(query);
}

async function restoreTable(tableName, fileName){

    new Message(`Attempting to restore ${tableName} from ${fileName}`,"note");

    const buffer = await readFile(fileName);
    const {columns, rows} = JSON.parse(buffer);

    const query = `INSERT INTO ${tableName} (${columns.toString()}) VALUES ?`;

    await bulkInsert(query, rows);

    new Message(`Inserted ${rows.length} rows of data into table ${tableName}`,"pass");

    return rows.length;

}

export async function restoreDatabase(backupTarget){

    try{

        const backupDir = `./backups/`;
        const restoreDir = `./restore-from/`;

        const targetFile = `${backupDir}${backupTarget}`;

        const archiveReg = /^.+?\.zip$/i;
        const jsonReg = /^(.+?)\.json$/i;

        let jsonFiles = [];

        await deleteOldRestoreJSONFiles();

        if(archiveReg.test(backupTarget)){

            const zip = await unzipper.Open.file(targetFile);
            await zip.extract({ "path": restoreDir });

        }else{

            const buFolder = await readdir(targetFile);

            for(let i = 0; i < buFolder.length; i++){

                const f = buFolder[i];

                if(jsonReg.test(f)){
       
                    await copyFile(`${targetFile}/${f}`, `${restoreDir}${f}`);
                    new Message(`Copied ${targetFile}/${f} to ${restoreDir}${f}`,"pass");

                }else{

                    new Message(`Skipping file ${f}`,"note");
                }
            }
        }

        const files = await readdir(restoreDir);

        let rowsInserted = [];

        for(let i = 0; i < files.length; i++){

            const f = files[i];

            const jResult = jsonReg.exec(f);

            if(jResult === null) continue;
            
            new Message(`Truncate table ${jResult[1]}.`,"note");
            await truncateTable(jResult[1]);
            
            const totalRows = await restoreTable(jResult[1], `${restoreDir}${f}`);

            rowsInserted.push({"table": jResult[1], "rows": totalRows});
        }

        return rowsInserted;

    }catch(err){
        console.trace(err);
        return err.toString();
    }
   
}

export async function getSQLiteStats(){

    const dbStats = await stat("./data/main.db");

    const tableNames = await simpleQuery(`SELECT name FROM sqlite_schema 
    WHERE type='table' AND name LIKE 'nstats_%'
    ORDER BY name;`);

    const totalRows = [];

    for(let i = 0; i < tableNames.length; i++){

        const result = await simpleQuery(`SELECT COUNT(id) as total_rows FROM ${tableNames[i].name}`);
        totalRows.push({"table": tableNames[i].name, "rows": result[0].total_rows});

    }

    return {"fileSize": dbStats.size, "modifiedTime": dbStats.mtimeMs, totalRows};
   
}