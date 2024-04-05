import { simpleQuery } from "./database.mjs";



async function bGametypeExist(name){

    const query = `SELECT COUNT(*) as total_gametypes FROM nstats_gametypes WHERE name=?`;

    const result = await simpleQuery(query, [name]);

    if(result[0].total_gametypes > 0) return true;

    return false;
}

async function createGametype(name){

    const query = `INSERT INTO nstats_gametypes VALUES(NULL,?)`;

    const result = await simpleQuery(query, [name]);

    return result.insertId;
}

async function getGametypeId(name){

    const query = `SELECT id FROM nstats_gametypes WHERE name=?`;

    const result = await simpleQuery(query, [name]);

    if(result.length > 0) return result[0].id;

    return null;
}

export async function updateGametype(name){

    let gametypeId = await getGametypeId(name);

    if(gametypeId === null){
        gametypeId = await createGametype(name);
    }
    if(gametypeId === null) throw new Error(`There was a problem getting the gametype id`);

    return gametypeId;
    
}