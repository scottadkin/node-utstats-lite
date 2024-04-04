import mysql from "mysql2/promise";
const config = require("../../../config.json");

const pool = mysql.createPool({
    "host": config.mysql.host,
    "user": config.mysql.user,
    "password": config.mysql.password,
    "database": config.mysql.database
});


export async function simpleQuery(query, vars){

    if(query === undefined) throw new Error("No query specified.");
    
    if(vars === undefined){

        const [result] = await pool.query(query);
        return result;
    }

    const [result] = await pool.query(query, vars);   

    return result;   
}


export async function simpleFetch(query, vars){

    return await this.simpleQuery(query, vars);
}

export async function simpleInsert(query, vars){

    return await this.simpleQuery(query, vars);
}

export async function simpleDelete(query, vars){
    
    return await this.simpleQuery(query, vars);
}

export async function simpleUpdate(query, vars){
    
    return await this.simpleQuery(query, vars);
}

export async function insertReturnInsertId(query, vars){

    const result = await this.simpleQuery(query, vars);
    return result.insertId;
}

export async function updateReturnAffectedRows(query, vars){
    const result = await this.simpleQuery(query, vars);
    return result.affectedRows;
}


async function bulkInsert(query, vars, maxPerInsert){

    if(vars.length === 0) return;
    if(maxPerInsert === undefined) maxPerInsert = 100000;

    let startIndex = 0;

    if(vars.length < maxPerInsert){
        await pool.query(query, [vars]);
        return;
    }

    while(startIndex < vars.length){

        const end = (startIndex + maxPerInsert > vars.length) ? vars.length : startIndex + maxPerInsert;
        const currentVars = vars.slice(startIndex, end);
        await pool.query(query, [currentVars]);
        startIndex += maxPerInsert;
    }

    return;
}
