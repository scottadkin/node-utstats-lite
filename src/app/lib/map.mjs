import { simpleQuery } from "./database.mjs";
import { readdir } from 'node:fs/promises';

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

    const reg = /^.+?-(.+)$/i;

    const result = reg.exec(name);

    if(result === null) return name;

    name = result[1].toLowerCase();
    name = name.replace(/[\[\]\'\`]/ig,"");

    return name;
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