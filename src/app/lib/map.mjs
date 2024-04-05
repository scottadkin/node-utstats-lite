import { simpleQuery } from "./database.mjs";



async function getMapId(name){

    const query = `SELECT id FROM nstats_maps WHERE name=?`;

    const result = await simpleQuery(query, [name]);

    if(result.length > 0) return result[0].id;

    return null;
}


async function createMap(name){

    const query = `INSERT INTO nstats_maps VALUES(NULL,?)`;

    const result = await simpleQuery(query, [name]);

    if(result.insertId !== undefined) return result.insertId;

    return null;
}


export async function updateMap(name){

    let mapId = await getMapId(name);

    if(mapId === null){
        mapId = await createMap(name);
    }

    if(mapId === null) throw new Error(`Failed to get map id.`);

    return mapId;
}