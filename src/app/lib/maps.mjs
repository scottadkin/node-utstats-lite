import { simpleQuery } from "./database.mjs";
import { readdir } from 'node:fs/promises';
import { getMapImageName as genericGetMapImageName } from "./generic.mjs";

async function getMapId(name){

    const query = `SELECT id FROM nstats_maps WHERE name=?`;

    const result = await simpleQuery(query, [name]);

    if(result.length > 0) return result[0].id;

    return null;
}


async function createMap(name){

    const query = `INSERT INTO nstats_maps VALUES(NULL,?,0,0,"1999-11-30 00:00:00","1999-11-30 00:00:00")`;

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


export async function getMapNames(names){

    if(names.length === 0) return [];

    const query = `SELECT id,name FROM nstats_maps WHERE id IN(?)`;

    const result = await simpleQuery(query, [names]);

    const data = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];
        data[r.id] = r.name;

    }

    return data;
}


export function getMapImageName(name){

    return genericGetMapImageName(name);
}


export async function getMapImages(names){

    if(names.length === 0) return {};

    const images = {};

    const namesToImageNames = {};

    for(const [id, name] of Object.entries(names)){
        namesToImageNames[name.toLowerCase()] = getMapImageName(name);
    }

    const files = await readdir("./public/images/maps/");

    for(const [name, imageName] of Object.entries(namesToImageNames)){

        const currentTarget = `${imageName}.jpg`;
        const index = files.indexOf(currentTarget);
        let targetImageFile = "default.jpg";
        if(index !== -1) targetImageFile = currentTarget;
        images[name] = targetImageFile;
    }
    
    return images;
}


async function calculateTotals(mapId){

    const query = `SELECT COUNT(*) as total_matches,SUM(playtime) as playtime,MIN(date) as first_match,MAX(date) as last_match FROM nstats_matches WHERE map_id=?`;

    const result = await simpleQuery(query, [mapId]);

    if(result[0].total_matches === 0) return null;

    return result[0];
}

export async function updateTotals(mapId){

    const totals = await calculateTotals(mapId);

    if(totals === null){
        new Message(`Failed to calculate map totals.`,`error`);
    }

    const query = `UPDATE nstats_maps SET matches=?, playtime=?, first_match=?, last_match=? WHERE id=?`;

    await simpleQuery(query, [totals.total_matches, totals.playtime, totals.first_match, totals.last_match, mapId]);
}


export async function getMostPlayedMaps(limit){

    limit = parseInt(limit);

    if(limit !== limit) throw new Error(`getMostPlayedMaps(limit) limit must be a valid integer`);

    const query = `SELECT * FROM nstats_maps ORDER by playtime DESC LIMIT ?`;

    return await simpleQuery(query, [limit]);
}


export async function getAllNames(){

    const result = await simpleQuery(`SELECT id,name FROM nstats_maps`);

    const data = {
        "0": "Any"
    };

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        data[r.id] = r.name;
    }

    return data;
}