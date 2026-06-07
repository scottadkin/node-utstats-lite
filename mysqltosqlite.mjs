import Message from "./src/message.mjs";
import { createDatabaseBackup } from "./src/admin.mjs";
import { readdir, readFile } from "node:fs/promises";
import mysql from "mysql2/promise";

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


//const test = await createDatabaseBackup();
//console.log(test);

const test = { "folder": './backups/2026-06-07-14-00-39' };

const files = await readdir(test.folder);



const testFile = await readFile(`${test.folder}/${"nstats_ftp.json"}`);
console.log(JSON.parse(testFile));



process.exit();