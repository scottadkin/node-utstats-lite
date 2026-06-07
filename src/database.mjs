import { DatabaseSync } from 'node:sqlite';
import { rename } from "node:fs/promises";

let database = new DatabaseSync("./data/main.db");
database.exec("PRAGMA jounral_mode = WAL;");
database.exec("PRAGMA busy_timeout = 15000;");


export async function testChangeDatabase(newFileURL){

    try{

        database.close();

        await rename("./data/main.db", "./data/main.old");
        await rename(newFileURL, `./data/main.db`);

        database = new DatabaseSync("./data/main.db");
        database.exec("PRAGMA jounral_mode = WAL;");
        database.exec("PRAGMA busy_timeout = 15000;");

    }catch(err){
        console.trace(err);
    }
}


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


export async function simpleQuery(query, vars){   

   return await sqliteSimpleQuery(query, vars);

}


export async function sqlInsertReturnRowId(query, vars){

    const sqliteQuery = createSqlLiteQuery(query, vars);

    const prepare = database.prepare(sqliteQuery.query);
    const result = prepare.run(...sqliteQuery.vars);

    return result.lastInsertRowid;

}


function sqliteBulkInsert(query, vars){

    //SQLITE MAX VARS LIMIT of 32766 per query
    const MAX_SQLITE_VARS = 32000;

    let partIndex = 0;
    const queryParts = [
        {"placeholders": "", "vars": []}
    ];

    const totalVars = vars[0].length * vars.length;

    let currentVarCount = 0;

    const varsPerRow = vars[0].length;

    let placeholder = ``;

    for(let i = 0; i < vars.length; i++){

        const v = vars[i];
        let subPlaceholders = ``;

        currentVarCount += varsPerRow;

        for(let x = 0; x < v.length; x++){

            subPlaceholders += `?`;

            if(x < v.length - 1){
                subPlaceholders += `,`
            }
        }

        queryParts[partIndex].placeholders += `(${subPlaceholders})`;
        queryParts[partIndex].vars.push(...vars[i]);



        if(currentVarCount + varsPerRow >= MAX_SQLITE_VARS){

            queryParts[partIndex].placeholders += ``;
            partIndex++;
            currentVarCount = 0;
            queryParts.push({"placeholders": "", "vars": []});
            //dont need comma as new part started
            continue;
        }else{

            if(i < vars.length - 1){
                queryParts[partIndex].placeholders += `,`;
            }
        }
    }

    const qM = query.indexOf("?");

    if(qM === -1) throw new Error(`No values ? found bulkInsert`);

    for(let i = 0; i < queryParts.length; i++){

        const currentQuery = query.replace("?", queryParts[i].placeholders);

        const prepare = database.prepare(currentQuery);

        prepare.run(...sqliteConvertDates(queryParts[i].vars));
    }
}

export async function bulkInsert(query, vars, maxPerInsert){

    if(vars.length === 0) return;
    if(maxPerInsert === undefined) maxPerInsert = 100000;

    return sqliteBulkInsert(query, vars);

}


function sqliteArrayInsertOnDuplicateUpdate(tableName, columns, vars, conflict){

    //SQLITE MAX VARS LIMIT of 32766 per query
    const MAX_SQLITE_VARS = 32000;

    const varsPerRow = columns.length;
    const totalVars = vars.length * columns.length;

    let conflictString = ``;

    for(let i = 0; i < columns.length; i++){

        conflictString += `${columns[i]}=excluded.${columns[i]}`;

        if(i < columns.length - 1){
            conflictString += `, `;
        }
    }

    let partIndex = 0;

    const queryParts = [
        {
            "placeholderString": ``,
            "vars": []
        }
    ];

    const placeholderString = `(${sqlitePlaceholderArray(columns)})`;

    let currentVarCount = 0;

    for(let i = 0; i < vars.length; i++){

        currentVarCount+=columns.length;

        queryParts[partIndex].placeholderString += placeholderString;
        queryParts[partIndex].vars.push(...vars[i]);

        //if next row goes over var limit create new query part to prevent that
        if(currentVarCount + varsPerRow >= MAX_SQLITE_VARS){

            //don't want to create an empty query part
            if(i === vars.length - 1){
                break;
            }
            partIndex++;
            queryParts.push({"placeholderString": ``, "vars": []});
            currentVarCount = 0;
            //skip adding comma, not needed if splitting into multiple queries
            continue;
        }

        if(i < vars.length - 1) queryParts[partIndex].placeholderString += `, `;
    }
    
    
    for(let i = 0; i < queryParts.length; i++){

        const q = queryParts[i];

        const query = `INSERT INTO ${tableName}(${columns.toString()}) VALUES ${q.placeholderString}
        ON CONFLICT(${conflict.toString()}) DO UPDATE SET ${conflictString}`;

        const prepare = database.prepare(query);
    
        prepare.run(...sqliteConvertDates(q.vars));
    

    }
}

function sqliteInsertOnDuplicateUpdate(tableName, columns, vars, conflict){

    if(conflict.length === 0) throw new Error(`OnDuplicateUpdate needs a conflict key`);

    if(vars.length === 0) return;

    if(Array.isArray(vars[0])){

        return sqliteArrayInsertOnDuplicateUpdate(tableName, columns, vars, conflict);
    }
  
    let placeholderString = `(${sqlitePlaceholderArray(columns)})`;
    
    let query = `INSERT INTO ${tableName}(${columns.toString()}) VALUES ${placeholderString}
    ON CONFLICT(${conflict.toString()}) DO UPDATE SET `;

    for(let i = 0; i < columns.length; i++){

        query += `${columns[i]}=excluded.${columns[i]}`;

        if(i < columns.length - 1){
            query += `, `;
        }
    }

    const prepare = database.prepare(query);

    prepare.run(...sqliteConvertDates(vars));
        
}


export async function sqlInsertOnDuplicateUpdate(tableName, columns, vars, conflict){

    if(vars.length === 0) return;

    return sqliteInsertOnDuplicateUpdate(tableName, columns, vars, conflict);

}

export async function sqlSingleUpdateReturnChanged(query, vars){

    if(vars === undefined || vars.length === 0) throw new Error(`sqlSingleUpdateReturnChanged vars is required`);

    const test = database.prepare(`${query}`);

    vars = sqliteConvertDates(vars);
    test.run(...vars);

    return "sqlite"; 
}