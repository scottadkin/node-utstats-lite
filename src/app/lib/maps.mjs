import { simpleQuery } from "./database.mjs";
import { readdir } from 'node:fs/promises';
import { getMapImageName as genericGetMapImageName } from "./generic.mjs";
import { getAll, getGametypeNames } from "./gametypes.mjs";
import { getServerNames } from "./servers.mjs";
import { getBasicPlayerInfo } from "./players.mjs";

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

function getPartialNameMatchImage(images, targetName){

    const strExt = /^(.+)\..+$/i;

    for(let i = 0; i < images.length; i++){

        const img = images[i];

        const result = strExt.exec(img);

        if(result === null) continue;

        if(targetName.indexOf(result[1]) !== -1){
            return img;
        }
    }

    return null;
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

        
        if(index === -1){

            const partial = getPartialNameMatchImage(files, currentTarget);

            if(partial !== null){
                targetImageFile = partial;
            }
        }

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

    const result = await simpleQuery(query, [limit]);

    const images = await getMapImages(...[result.map(r => r.name.toLowerCase())]);

    return {"data": result, images};
}


export async function getAllNames(bReturnArray){

    if(bReturnArray === undefined) bReturnArray = false;

    const result = await simpleQuery(`SELECT id,name FROM nstats_maps ORDER BY name ASC`);

    if(bReturnArray) return result;

    const data = {
        "0": "Any"
    };

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        data[r.id] = r.name;
    }

    return data;
}


export async function getAllImages(){

    const files = await readdir("./public/images/maps/");

    const reg = /^.+?\.jpg$/i;
    const valid = [];

    for(let i = 0; i < files.length; i++){

        const f = files[i];
        if(reg.test(f)) valid.push(f);
    }

    return valid;
}

async function getLatestMatchId(mapId){

    const query = `SELECT id from nstats_matches WHERE map_id=? ORDER BY date DESC LIMIT 1`;

    const result = await simpleQuery(query, [mapId]);

    if(result.length > 0) return result[0].id;

    return null;
}

async function getLatestMatches(mapIds){

    if(mapIds.length === 0) return {};

    const data = {};

    for(let i = 0; i < mapIds.length; i++){

        const m = mapIds[i];

        data[m] = await getLatestMatchId(m);
    }

    return data;
}

async function getFirstMatch(mapId){

    const query = `SELECT id from nstats_matches WHERE map_id=? ORDER BY date ASC LIMIT 1`;

    const result = await simpleQuery(query, [mapId]);

    if(result.length > 0) return result[0].id;

    return null;
}

async function getFirstMatches(mapIds){

    if(mapIds.length === 0) return {};

    const data = {};

    for(let i = 0; i < mapIds.length; i++){

        const m = mapIds[i];

        data[m] = await getFirstMatch(m);
    }

    return data;
}

export async function getFullImageList(){

    const query = `SELECT name FROM nstats_maps ORDER BY name ASC`;

    const result = await simpleQuery(query);

    const names = result.map((r) =>{
        return r.name;
    });

    return await getMapImages(names);

}

export async function getAllStats(){

    const [result, images] = await getAllBasicAndImages();

    const mapIds = result.map((r) =>{     
        return r.id;
    });

    const first = await getFirstMatches(mapIds);
    const latest = await getLatestMatches(mapIds);

    return {"maps": result, "earliest": first, "latest": latest, images};
}


export async function getAllBasicAndImages(){

    const query = `SELECT * FROM nstats_maps ORDER BY name ASC`;

    const result = await simpleQuery(query);

    const images = await getFullImageList();

    return {"maps": result, images};
}


export async function getMapInfo(mapId){

    const query = `SELECT * FROM nstats_maps WHERE id=?`;

    const result = await simpleQuery(query, [mapId]);

    if(result.length > 0) return result[0];

    return {
        "name": "Not Found"
    }
}


export async function getRecentMatches(mapId, page, perPage){

    page = parseInt(page);
    perPage = parseInt(perPage);

    if(page !== page) page = 1;
    page--;
    if(page < 0) page = 0;

    if(perPage !== perPage) perPage = 25;
    if(perPage < 0 || perPage > 100) perPage = 25;

    let start = page * perPage;
    if(start < 0) start = 0;


    const query = `SELECT id,server_id,gametype_id,date,playtime,players,total_teams,team_0_score,team_1_score,team_2_score,
    team_3_score,solo_winner,solo_winner_score,hash FROM nstats_matches WHERE map_id=? ORDER BY date DESC, id DESC LIMIT ?, ?`;


    const result = await simpleQuery(query, [mapId, start, perPage]);

    const serverIds = new Set();
    const gametypeIds = new Set();
    const soloIds = new Set();

    for(let i = 0; i < result.length; i++){

        const r = result[i];
        serverIds.add(r.server_id);
        gametypeIds.add(r.gametype_id);
        if(r.solo_winner !== 0) soloIds.add(r.solo_winner);
    }

    const gametypeNames = await getGametypeNames([...gametypeIds]);
    const serverNames = await getServerNames([...serverIds]);
    const soloWinners = await getBasicPlayerInfo([...soloIds]);

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        r.serverName = serverNames[r.server_id] ?? "Not Found";
        r.gametypeName = gametypeNames[r.gametype_id] ?? "Not Found";
        if(r.solo_winner !== 0){
            r.soloWinnerName = soloWinners[r.solo_winner].name ?? "Not Found";
        }
    }

    return result;
}


export async function getTotalMatches(id){

    const query = `SELECT COUNT(*) as total_matches FROM nstats_matches WHERE map_id=?`;

    const result = await simpleQuery(query, [id]);
    return result[0].total_matches;
}


export async function getAllMatchIds(id){

    const query = `SELECT id FROM nstats_matches WHERE map_id=?`;

    const result = await simpleQuery(query, [id]);

    return result.map((r) =>{
        return r.id;
    });
}