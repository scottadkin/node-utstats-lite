import { simpleQuery } from "./database.mjs";

export async function getPointsIds(names){

    if(names.length === 0) return null;

    const query = `SELECT id,name FROM nstats_dom_control_points WHERE name IN (?)`;

    const result = await simpleQuery(query, [names]);

    const namesToIds = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];
        namesToIds[r.name] = r.id;
    }

    return namesToIds;
}

export async function createControlPoint(name){

    const query = `INSERT INTO nstats_dom_control_points VALUES(NULL,?)`;

    const result = await simpleQuery(query, [name]);

    return result.insertId;
}