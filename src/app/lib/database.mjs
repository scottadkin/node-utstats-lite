import mysql from "mysql2/promise";
import { mysqlSettings} from "../../../config.mjs";

const pool = mysql.createPool({
    "host": mysqlSettings.host,
    "user": mysqlSettings.user,
    "password": mysqlSettings.password,
    "database": mysqlSettings.database
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

export async function bulkInsert(query, vars, maxPerInsert){

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
