import { bulkInsert, simpleQuery, testChangeDatabase } from "./database.mjs";
import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { createReadStream, createWriteStream, fstat } from "node:fs";
import Message from "./message.mjs";
import { ZipArchive } from "archiver";
import fs from "fs";
import unzipper from "unzipper";
import {toMYSQLDateTime} from "./generic.mjs";
import { backup, DatabaseSync } from "node:sqlite";
import { createGzip, unzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { promisify } from "node:util";
import { createBackupDirName } from "./generic.mjs";

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
    "weapons",
    "force_name_hwid",
    "force_name_mac",
    "force_name_hwid_and_mac",
    "force_name_history"
];

export async function clearAllDataTables(){

    for(let i = 0; i < DELETE_TABLES.length; i++){

        const t = DELETE_TABLES[i];

   

        await simpleQuery(`DELETE FROM nstats_${t}`);
        await simpleQuery(`DELETE FROM SQLITE_SEQUENCE WHERE name='nstats_${t}'`);
    
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

async function createCompressedSQLiteBackup(input, output) {
  const gzip = createGzip();
  const source = createReadStream(input);
  const destination = createWriteStream(output);
  return await pipeline(source, gzip, destination);
}


export async function createSQLiteBackup(){

    const db = new DatabaseSync("./data/main.db");

    const backupName = createBackupDirName();

    const result = await backup(db, `./backups/sqlite/${backupName}.db`,{
        "progress": ({ totalPages, remainingPages }) => {
            console.log('Backup in progress', { totalPages, remainingPages });
        }
    });

    await createCompressedSQLiteBackup(`./backups/sqlite/${backupName}.db`, `./backups/sqlite/${backupName}.gz`);
    await rm(`./backups/sqlite/${backupName}.db`);

    return backupName;

}

export async function getSQLiteBackups(){

    const DIR = "./backups/sqlite/";

    const files = await readdir(DIR);

    const backups = [];

    const reg = /^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}.gz$/i;

    for(let i = 0; i < files.length; i++){

        if(reg.test(files[i])){
            //backups.push(files[i]);
            const stats = await stat(`${DIR}${files[i]}`);
            backups.push({"name": files[i], stats});
        }
    }

    return backups;
}



export async function restoreFromSQLiteBackup(backupName){

    const test = await readFile(`./backups/sqlite/${backupName}`);

    unzip(test, (err, buffer) => {

        if (err) {
            console.error('An error occurred:', err);
            throw new Error(err);
           // process.exitCode = 1;
        }


        return buffer;
    });

    const do_unzip = promisify(unzip);

    const content = await do_unzip(test);

    await writeFile(`./data/${backupName}`, content);

    await testChangeDatabase(`./data/${backupName}`);
    
}