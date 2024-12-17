import { bulkInsert, simpleQuery } from "./database.mjs";
import { readdir } from 'node:fs/promises';
import { getMapImageName as genericGetMapImageName, sanitizePagePerPage } from "./generic.mjs";
import { getAll, getGametypeNames } from "./gametypes.mjs";
import { getServerNames } from "./servers.mjs";
import { getBasicPlayerInfo } from "./players.mjs";
import { getPlayerMapTotals as getPlayerCTFMapTotals } from "./ctf.mjs";
import { getPlayerMapTotals as getPlayerDOMMapTotals } from "./domination.mjs";


export const VALID_PLAYER_MAP_MINUTE_AVERAGES = {
    "score": "Score", 
    "frags": "Frags", 
    "kills": "Kills", 
    "deaths": "Deaths", 
    "suicides": "Suicides", 
    "team_kills": "Team Kills",
    "headshots": "Headshots", 
    "item_amp": "UDamage", 
    "item_belt": "Shield Belts", 
    "item_boots": "Jump Boots", 
    "item_body": "Body Armour", 
    "item_pads": "Thigh Pads", 
    "item_invis": "Invisibility", 
    "item_shp": "Super Health Pack",
    "flag_taken": "Flag Taken", 
    "flag_pickup": "Flag Pickups", 
    "flag_drop": "Flag Drops", 
    "flag_assist": "Flag Assists", 
    "flag_cover": "Flag Covers", 
    "flag_seal": "Flag Seals", 
    "flag_cap": "Flag Caps", 
    "flag_kills": "Flag Kills", 
    "flag_return": "Flag Returns", 
    "flag_return_base": "Flag Returns Base", 
    "flag_return_mid": "Flag Returns Mid", 
    "flag_return_enemy_base": "Flag Returns Enemy Base", 
    "flag_return_save": "Flag Returns Close Save", 
    "dom_caps": "Domination Caps"
};

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


export async function getPlayerMapTotals(playerIds, mapId){

    if(playerIds.length === 0) return {};


    const query = `SELECT player_id, COUNT(*) as total_matches, SUM(time_on_server) as playtime, SUM(score) as score,SUM(frags) as frags,
    SUM(kills) as kills, SUM(deaths) as deaths, SUM(suicides) as suicides, SUM(team_kills) as team_kills,
    SUM(headshots) as headshots,
    SUM(item_amp) as item_amp,
    SUM(item_belt) as item_belt,
    SUM(item_boots) as item_boots,
    SUM(item_body) as item_body,
    SUM(item_pads) as item_pads,
    SUM(item_invis) as item_invis,
    SUM(item_shp) as item_shp
    FROM nstats_match_players WHERE player_id IN (?) AND map_id=? GROUP BY player_id`;

    const data = await simpleQuery(query, [playerIds, mapId]);

    const ctfData = await getPlayerCTFMapTotals(playerIds, mapId);
    const domData = await getPlayerDOMMapTotals(playerIds, mapId);

    let bFoundCTF = false;
    let bFoundDOM = false;

    if(Object.keys(ctfData).length > 0){

        bFoundCTF = true;
    }

    if(Object.keys(domData).length > 0){

        bFoundDOM = true;
    }
        
    for(let i = 0; i < data.length; i++){

        const d = data[i];

        const ctf = ctfData[d.player_id];
        const dom = domData[d.player_id];


        if(ctf !== undefined){

            data[i] = {...data[i], ...ctf};
        }

        if(dom !== undefined){
            data[i] = {...data[i], ...dom};
        }
    }
    
    
    //get dom totals


    return {data, bFoundCTF, bFoundDOM};

}


export async function deleteCurrentPlayerMapAverages(playerIds, gametypeId, mapId){

    if(playerIds.length === 0) return;

    const query = `DELETE FROM nstats_player_map_minute_averages WHERE player_id=? AND gametype_id=? AND map_id=?`;

    const promises = [];

    for(let i = 0; i < playerIds.length; i++){

        const pId = playerIds[i];

        promises.push(simpleQuery(query, [pId, gametypeId, mapId]));
    }


    await Promise.all(promises);
}


export async function updateCurrentPlayerMapAverages(players, gametypeId, mapId){

    if(players.length === 0) return;

    const insertVars = [];

    for(let i = 0; i < players.length; i++){

        const p = players[i];

        insertVars.push([
            p.player_id, mapId, gametypeId, p.playtime, p.total_matches, p.score, p.frags, p.kills, p.deaths, p.suicides, p.team_kills,
            p.headshots, p.item_amp,p.item_belt,p.item_boots,p.item_body,p.item_pads,p.item_invis,p.item_shp,
            p?.flag_taken ?? 0, p?.flag_pickup ?? 0, p?.flag_drop ?? 0, p?.flag_assist ?? 0, p?.flag_cover ?? 0,
            p?.flag_seal ?? 0, p?.flag_cap ?? 0, p?.flag_kill ?? 0, p?.flag_return ?? 0, p?.flag_return_base ?? 0,
            p?.flag_return_mid ?? 0, p?.flag_return_enemy_base ?? 0, p?.flag_return_save ?? 0, p?.dom_caps ?? 0
        ]);
    }


    const query = `INSERT INTO nstats_player_map_minute_averages 
    (player_id, map_id, gametype_id, total_playtime, total_matches, score, frags, kills, deaths, suicides, team_kills,
    headshots, item_amp, item_belt, item_boots, item_body, item_pads, item_invis, item_shp,
    flag_taken, flag_pickup, flag_drop, flag_assist, flag_cover, flag_seal, flag_cap, flag_kills, flag_return, flag_return_base, 
    flag_return_mid, flag_return_enemy_base, flag_return_save, dom_caps

    ) VALUES ?`;

    await bulkInsert(query, insertVars);
}


export function bValidMinuteCategory(type){

    const keys = Object.keys(VALID_PLAYER_MAP_MINUTE_AVERAGES);


    return keys.indexOf(type) !== -1;
} 

export async function getMapPlayerAveragesTotalCount(mapId){

    const query = `SELECT COUNT(*) as total_values FROM nstats_player_map_minute_averages WHERE map_id=?`;

    const result = await simpleQuery(query, [mapId]);

    return result[0].total_values;
}

export async function getMapPlayerAverages(mapId, category, initialPage, initialPerPage){

    const [page, perPage, start] = sanitizePagePerPage(initialPage, initialPerPage);

    let title = "Kills";

    category = category.toLowerCase();

    if(bValidMinuteCategory(category)){
        
        title = VALID_PLAYER_MAP_MINUTE_AVERAGES[category];
        
    }else{
        category = "kills";
    }

    const query = `SELECT player_id,total_playtime,${category} as target_value FROM nstats_player_map_minute_averages WHERE map_id=? ORDER BY target_value DESC LIMIT ?, ?`;

    const result = await simpleQuery(query, [mapId, start, perPage]);

    const uniquePlayerIds = [...new Set(result.map((r) =>{
        return r.player_id;
    }))];

    const players = await getBasicPlayerInfo(uniquePlayerIds);

    const totalEntries = await getMapPlayerAveragesTotalCount(mapId);

    return {"data": result, "players": players, "title": title, "totalEntries": totalEntries};
}