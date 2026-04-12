import { readdir } from "node:fs/promises";
import { DatabaseSync } from 'node:sqlite';
import { getAllNamesToImages } from "./maps.mjs";
const liteDatabase = new DatabaseSync(':memory:');

liteDatabase.exec(`
	CREATE TABLE images(
		key INTEGER PRIMARY KEY,
		folder TEXT,
		file TEXT
	) STRICT
`);

liteDatabase.exec(`
	CREATE TABLE maps_to_images(
		key INTEGER PRIMARY KEY,
		name TEXT,
		file TEXT
	) STRICT;
     CREATE INDEX n_idx ON maps_to_images(name);
`);

/**
 * 
 * @param {*} dir 
 * @param {*} folderName name used in nstats_images table
 */
export async function updateImageFolderCache(dir, folderName){

    if(folderName === undefined) throw new Error("folderName parameter must be set");

    const files = await readdir(dir);

    const reg = /^(.+?)\.(jpg|jpeg|png)$/i;

    const images = [];

    for(let i = 0; i < files.length; i++){

        const result = reg.exec(files[i]);
        if(result === null) continue;
        images.push([folderName, result[1]]);
    }


    const a = liteDatabase.prepare(`INSERT INTO images VALUES(NULL,?,?)`);

    for(let i = 0; i < images.length; i++){

        a.run(...images[i]);
    }
}

export async function setMapsToImages(){

    const cache = getImageFolderCache("maps");
    const imagesToNames = await getAllNamesToImages(cache);

    const query = `INSERT INTO maps_to_images VALUES(NULL,?,?)`;

    const prepare = liteDatabase.prepare(query);

    for(const [name, image] of Object.entries(imagesToNames)){
        prepare.run(name, image);
    }
}

/**
 * 
 * @returns <Object> names to images of all full or partial matches.
 */
export function cacheGetMapNamesToImages(){

    const query = `SELECT name,file FROM maps_to_images ORDER BY name ASC`;

    const prepare = liteDatabase.prepare(query);

    const result = prepare.all();

    const maps = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];
        maps[r.name] = r.file;
    }

    return maps;
}

export function getImageFolderCache(folderName){

	const query = `SELECT file FROM images WHERE folder=?`;

	const prepare = liteDatabase.prepare(query);

	const result = prepare.all(folderName);

	return result.map((r) =>{
		return r.file;
	});
}