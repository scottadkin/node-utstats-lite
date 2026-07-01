import Message from "./src/message.mjs";
import { readdir, readFile, mkdir, writeFile, copyFile, access, constants, rename, rm } from "node:fs/promises";
import mysql from "mysql2/promise";
import { createBackupDirName } from "./src/generic.mjs";
import { toMYSQLDateTime } from "./src/generic.mjs";
import { sqliteInstall } from "./src/sqliteInstall.mjs";
import { closeDatabase, createNewDatabase, bulkInsert } from "./src/database.mjs";

new Message(`MYSQL To SQLite Database Tool`,"note");

const mysqlSettings = {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "",
    "database": "node_utstats_lite",
    "connectionLimit": 10
};


const pool = mysql.createPool({
    "host": mysqlSettings.host,
    "user": mysqlSettings.user,
    "password": mysqlSettings.password,
    "database": mysqlSettings.database,
    "connectionLimit": mysqlSettings.connectionLimit ?? 10
});

async function mysqlGetColumnsAsArray(tableName, bPrefixTableName){

    if(bPrefixTableName === undefined) bPrefixTableName = false;

    const query = `SHOW COLUMNS FROM ${tableName}`;

    const [results] = await pool.query(query);

    return results.map((r) =>{

        if(bPrefixTableName){
            return `${tableName}.${r.Field}`;
        }else{
            return r.Field;
        }
    });

}

async function getFullTable(tableName){


    const columns = await mysqlGetColumnsAsArray(tableName);

    const query = `SELECT * FROM ${tableName}`;

    const [results] = await pool.query(query);

    const dateColumns = ["first", "last", "first_match", "last_match", "date", "match_date", "last_active"];

    const rows = results.map((r) =>{

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


async function getAllTableNames(){

    const query = `SELECT table_name FROM information_schema.tables WHERE table_schema='${mysqlSettings.database}'`;

    const [results, fields] = await pool.query(query);

    return results.map((r) =>{
        return r.TABLE_NAME;
    });
}

async function createDatabaseBackup(overrideName){

    let backupDirName = "";

    if(overrideName !== undefined){
        backupDirName = overrideName;
    }else{
        backupDirName = createBackupDirName();
    }

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

    return await pool.query(query);
}

//older version didn't have unique constraint so there can be duplicates
//we only care about the most recent download info
function fixLogsDownloadDuplicates(data){

    const usedNames = new Set();

    const newData = [];

    for(let i = data.length - 1; i >= 0; i--){

        if(usedNames.has(data[i].file_name)){
            continue;
        }

        usedNames.add(data[i].file_name);
        newData.unshift(data[i]);
    }

    return newData;
}


async function restoreTable(tableName, fileName){

    new Message(`Attempting to restore ${tableName} from ${fileName}`,"note");

    const buffer = await readFile(fileName);
    const {columns, rows} = JSON.parse(buffer);

    const query = `INSERT INTO ${tableName} (${columns.toString()}) VALUES ?`;

    if(tableName === "nstats_logs_downloads"){
        await bulkInsert(query, fixLogsDownloadDuplicates(rows));
    }else{
        await bulkInsert(query, rows);
    }

    new Message(`Inserted ${rows.length} rows of data into table ${tableName}`,"pass");

    return rows.length;

}

async function restoreDatabase(backupTarget){

    try{

        const backupDir = `./backups/`;
        const restoreDir = `./restore-from/`;

        const targetFile = `${backupDir}${backupTarget}`;


        const jsonReg = /^(.+?)\.json$/i;

        let jsonFiles = [];

        await deleteOldRestoreJSONFiles();

      
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
        

        const files = await readdir(restoreDir);

        let rowsInserted = [];

        for(let i = 0; i < files.length; i++){

            const f = files[i];

            const jResult = jsonReg.exec(f);

            if(jResult === null) continue;
            
            //new Message(`Truncate table ${jResult[1]}.`,"note");
           // await truncateTable(jResult[1]);
            
            const totalRows = await restoreTable(jResult[1], `${restoreDir}${f}`);

            rowsInserted.push({"table": jResult[1], "rows": totalRows});
        }

        return rowsInserted;

    }catch(err){
        console.trace(err);
        new Message(`Failed to restore.`,"error");
        process.exit();
        return err.toString();
    }
   
}


async function bSQLiteFileAlreadyExists(){
    

    let test = await access("./data/main.db", constants.F_OK);

    return test === undefined;
}


async function backupSQLiteExistingFile(backupName){

    try{


        closeDatabase();


        if(await bSQLiteFileAlreadyExists()){
            
            new Message(`SQLite Database file already in data directory, moving existing file to backups folder.`,"note");

            console.log("rename");
            await rename("./data/main.db", `./backups/sqlite/${backupName}.db`);
        }

        createNewDatabase();


    }catch(err){

        

        if(err.code !== "ENOENT"){
            throw new Error(err);
            
        }
  
    }
}

async function init(){


    try{

        await pool.query(`SELECT id FROM nstats_users LIMIT 1`);

    }catch(err){

        const reg = /unknown database/i;

        if(reg.test(err.sqlMessage)){
            new Message(`MYSQL database "${mysqlSettings.database}" doesn't exist.`,"error");
            process.exit();
        }
        
        console.trace(err);
        process.exit();
    }

    const backupName = createBackupDirName();

    try{

        const test = await createDatabaseBackup(backupName);

    }catch(err){
        
        console.trace(err);
        process.exit();
    }


    await backupSQLiteExistingFile(backupName);
    

    await sqliteInstall(true);

    await restoreDatabase(backupName);

    new Message(`MYSQL To SQlite transfer complete.`,"progress");
    process.exit();
}

await init();

