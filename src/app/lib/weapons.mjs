import { simpleQuery } from "./database.mjs";



export async function getWeaponId(name){

    const query = `SELECT id FROM nstats_weapons WHERE name=?`;

    const result = await simpleQuery(query, [name]);

    if(result.length > 0) return result[0].id;

    return null;
}

export async function createWeapon(name){

    const query = `INSERT INTO nstats_weapons VALUES(NULL,?)`;

    const result = await simpleQuery(query, [name]);

    return result.insertId;
}