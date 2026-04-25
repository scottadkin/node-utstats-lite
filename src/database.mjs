import mysql from "mysql2/promise";
import { mysqlSettings, SQL_MODE} from "../config.mjs";

import { DatabaseSync } from 'node:sqlite';
const database = new DatabaseSync('./test.db');


function sqlitePlaceholderArray(values){

    let string = ``;

    for(let i = 0; i < values.length; i++){

        string += `?`;
        if(i < values.length - 1) string += `,`;
    }

    return string;
}


function sqliteConvertDates(vars){

    return vars.map((v) =>{

        if(typeof v !== "object") return v;

        if(v instanceof Date){
            return v.toISOString();
        }else{
            return v;
        }
    });
}


function createSqlLiteQuery(originalQuery, originalVars){

    const finalVars = [];

    const qms = /\?/ig;

    let query = ``;
    const vars = [];

    let prev = 0;

    for(let i = 0; i < originalVars.length; i++){

        const result = qms.exec(originalQuery);

        if(result === null){

            const part = originalQuery.slice(prev + 1);
            query += part;

            vars.push(originalVars[i]);

        }else{

            const part = originalQuery.slice(prev, result.index);

            if(Array.isArray(originalVars[i])){

                query += `${part}${sqlitePlaceholderArray(originalVars[i])}`;
                vars.push(...originalVars[i]);

            }else{
                
                query += `${part}?`;
                vars.push(originalVars[i]);

            }

            prev = result.index + 1;
        }
    }

    if(prev != originalQuery.length){
        query += originalQuery.slice(prev);
    }


    const cleanVars = sqliteConvertDates(vars);

    return {query, "vars": cleanVars};


}

async function sqliteSimpleQuery(query, vars){

    if(query === undefined) throw new Error("No query specified.");

    if(vars === undefined){

        const prepare = database.prepare(query);
 
        return prepare.all([]);
        
    }

    if(!Array.isArray(vars)){

        const prepare = database.prepare(query);
 
        return prepare.all(vars);
    }

    const sqliteQuery = createSqlLiteQuery(query, vars);
    
    
    //console.log(sqliteQuery);
    const prepare = database.prepare(sqliteQuery.query);
    return prepare.all(...sqliteQuery.vars);
}


export function sqliteBulkInsert(){

}

export function sqliteGetColumnsAsArray(){

}


export function sqliteInsertReturnRowId(){

}

let pool = null;

if(SQL_MODE !== "sqlite"){
    pool = mysql.createPool({
        "host": mysqlSettings.host,
        "user": mysqlSettings.user,
        "password": mysqlSettings.password,
        "database": mysqlSettings.database,
        "connectionLimit": mysqlSettings.connectionLimit ?? 10
    });
}
export const mysqlPool = pool;

export async function simpleQuery(query, vars){

    if(SQL_MODE === "sqlite") return await sqliteSimpleQuery(query, vars);

    if(query === undefined) throw new Error("No query specified.");
    
    if(vars === undefined){

        const [result] = await pool.query(query);
        return result;
    }

    const [result] = await pool.query(query, vars);   

    return result;   
}


export async function sqlInsertReturnRowId(query, vars){

    if(SQL_MODE !== "sqlite"){
        const result = await pool.query(query, vars);

        return result.insertId;
    }

    const sqliteQuery = createSqlLiteQuery(query, vars);

    const prepare = database.prepare(sqliteQuery.query);
    const result = prepare.run(...sqliteQuery.vars);

    return result.lastInsertRowid;
}


export async function bulkInsert(query, vars, maxPerInsert){

    if(vars.length === 0) return;
    if(maxPerInsert === undefined) maxPerInsert = 100000;

    let startIndex = 0;

    if(vars.length < maxPerInsert){

        if(SQL_MODE !== "sqlite"){
            return await pool.query(query, [vars]);
        }else{

        }
    }

    while(startIndex < vars.length){

        const end = (startIndex + maxPerInsert > vars.length) ? vars.length : startIndex + maxPerInsert;
        const currentVars = vars.slice(startIndex, end);

        if(SQL_MODE !== "sqlite"){
            await pool.query(query, [currentVars]);
        }else{

        }

        startIndex += maxPerInsert;
    }

    return;
}


export async function onDuplicateUpdate(query, vars){

    if(vars.length === 0){
        return await pool.query(query);
    }

    return await pool.query(query, [vars]);
}


export async function mysqlGetColumnsAsArray(tableName, bPrefixTableName){

    if(bPrefixTableName === undefined) bPrefixTableName = false;

    const query = `SHOW COLUMNS FROM ${tableName}`;

    const result = await simpleQuery(query);

    return result.map((r) =>{

        if(bPrefixTableName){
            return `${tableName}.${r.Field}`;
        }else{
            return r.Field;
        }
    });

}