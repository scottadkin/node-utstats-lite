import Message from "./src/message.mjs";
import { readdir, readFile, mkdir, writeFile, copyFile, access, constants, rename } from "node:fs/promises";
import mysql from "mysql2/promise";
import { createBackupDirName } from "./src/generic.mjs";
import { toMYSQLDateTime } from "./src/generic.mjs";
import { installMain } from "./install.mjs";

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

async function createDatabaseBackup(){

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

async function mysqlBulkInsert(query, vars, maxPerInsert){


    let startIndex = 0;

    if(vars.length < maxPerInsert){

        if(SQL_MODE !== "sqlite"){
            return await pool.query(query, [vars]);
        }else{
            throw new Error("bulkInsert not added to sqlite yet");
        }
    }

    while(startIndex < vars.length){

        const end = (startIndex + maxPerInsert > vars.length) ? vars.length : startIndex + maxPerInsert;
        const currentVars = vars.slice(startIndex, end);

        if(SQL_MODE !== "sqlite"){
            await pool.query(query, [currentVars]);
        }else{
            throw new Error("bulkInsert not added to sqlite yet");
        }

        startIndex += maxPerInsert;
    }

    return;
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


    /*const test = await createDatabaseBackup();


    const files = await readdir(test.folder);



    const testFile = await readFile(`${test.folder}/${"nstats_ftp.json"}`);
    console.log(JSON.parse(testFile));*/


    try{

        await access("./data/main.db", constants.F_OK);

        new Message(`SQLite Database file already in data directory, moving existing file to backups folder.`,"note");

        await rename("./data/main.db", `./backups/sqlite/${createBackupDirName()}.db`);


    }catch(err){

        

        if(err.code !== "ENOENT"){
            console.trace(err);
            process.exit();
        }
  
    }

    await installMain();




    process.exit();
}

await init();

