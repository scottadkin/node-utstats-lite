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

    try{
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
          
        const prepare = database.prepare(sqliteQuery.query);
        return prepare.all(...sqliteQuery.vars);

    }catch(err){
        console.trace(err);
        throw new Error(err);
    }
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

    try{

        if(query === undefined) throw new Error("No query specified.");
        
        if(vars === undefined){

            const [result] = await pool.query(query);
            return result;
        }

        const [result] = await pool.query(query, vars);   

        return result;  
         
    }catch(err){
        console.trace(err);
        throw new Error(err);
    }
}


export async function sqlInsertReturnRowId(query, vars){

    if(SQL_MODE !== "sqlite"){
        const result = await pool.query(query, vars);

        return result[0].insertId;
    }

    const sqliteQuery = createSqlLiteQuery(query, vars);

    const prepare = database.prepare(sqliteQuery.query);
    const result = prepare.run(...sqliteQuery.vars);

    return result.lastInsertRowid;
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

export async function bulkInsert(query, vars, maxPerInsert){

    if(vars.length === 0) return;
    if(maxPerInsert === undefined) maxPerInsert = 100000;

    if(SQL_MODE !== "sqlite") return await mysqlBulkInsert(query, vars, maxPerInsert);

    let placeholder = ``;

    for(let i = 0; i < vars.length; i++){

        const v = vars[i];

        let subPlaceholders = ``;

        for(let x = 0; x < v.length; x++){

            subPlaceholders += `?`;

            if(x < v.length - 1){
                subPlaceholders += `,`
            }
        }

        subPlaceholders = `(${subPlaceholders})`;


        placeholder += subPlaceholders;

        if(i < vars.length - 1){
            placeholder += `,`;
        }
    }

    const qM = query.indexOf("?");

    if(qM === -1) throw new Error(`No values ? foundm bulkInsert`);

    const aaaa = query.replace("?", placeholder);
    
    const sqliteQuery = createSqlLiteQuery(aaaa, vars);

    const prepare = database.prepare(aaaa);
    prepare.run(...sqliteQuery.vars);

}

/**
 * 
 * @param {String} tableName 
 * @param {Array<String>} columns column names to update
 * @param {Array<Any>} vars an array of values, or an array of arrays with values
 * @param {Array<String>} conflict  sqlite needs the column names of the indexes not the name of the index itself
 */
function sqliteInsertOnDuplicateUpdate(tableName, columns, vars, conflict){

    if(conflict.length === 0) throw new Error(`OnDuplicateUpdate needs a conflict key`);

    let placeholderString = ``;

    if(Array.isArray(vars[0])){

        for(let i = 0; i < vars.length; i++){

            placeholderString += `(${sqlitePlaceholderArray(columns)})`;
            if(i < vars.length - 1) placeholderString += `, `;
        }
    }else{
        placeholderString = `(${sqlitePlaceholderArray(columns)})`
    }

    let query = `INSERT INTO ${tableName}(${columns.toString()}) VALUES ${placeholderString}
    ON CONFLICT(${conflict.toString()}) DO UPDATE SET `;

    for(let i = 0; i < columns.length; i++){

        query += `${columns[i]}=excluded.${columns[i]}`;

        if(i < columns.length - 1){
            query += `, `;
        }
    }

    const prepare = database.prepare(query);

    if(!Array.isArray(vars[0])){

         prepare.run(...sqliteConvertDates(vars));
        
    }else{

        const fv = [];

        for(let i = 0; i < vars.length; i++){

            fv.push(...sqliteConvertDates(vars[i]));
        }

        prepare.run(...fv);
    }

}

async function mysqlInsertOnDuplicateUpdate(tableName, columns, vars){

    let query = `INSERT INTO ${tableName}(${columns.toString()}) VALUES ? as excluded ON DUPLICATE KEY UPDATE  `;

    for(let i = 0; i < columns.length; i++){

        query += `${tableName}.${columns[i]}=excluded.${columns[i]}`;
        if(i < columns.length - 1) query += `, `;
    }

    return await bulkInsert(query, vars);

}

export async function sqlInsertOnDuplicateUpdate(tableName, columns, vars, conflict){

    //conflict not needed for mysql on duplicate key update

    if(vars.length === 0) return;
    
    if(SQL_MODE !== "sqlite"){

        return await mysqlInsertOnDuplicateUpdate(tableName, columns, vars);

    }

    return sqliteInsertOnDuplicateUpdate(tableName, columns, vars, conflict);

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


export async function sqlSingleUpdateReturnChanged(query, vars){

    if(vars === undefined || vars.length === 0) throw new Error(`sqlSingleUpdateReturnChanged vars is required`);

    if(SQL_MODE === "sqlite"){

        const test = database.prepare(`${query}`);

        vars = sqliteConvertDates(vars);
        test.run(...vars);

        return "sqlite";


    }else{

        const [result] = await pool.query(query, vars);

        return result.changedRows;
    }
    
}