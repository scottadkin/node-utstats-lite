import { bulkInsert, simpleQuery } from "./database.mjs";
import { readdir } from 'node:fs/promises';
import { getMapImageName as genericGetMapImageName, 
    mysqlSetTotalsByDate, sanitizePagePerPage,
    removeGametypePrefix
} from "./generic.mjs";
import { getAll, getGametypeNames } from "./gametypes.mjs";
import { getServerNames } from "./servers.mjs";
import { getBasicPlayerInfo } from "./players.mjs";
import { getPlayerMapTotals as getPlayerCTFMapTotals } from "./ctf.mjs";
import { getPlayerMapTotals as getPlayerDOMMapTotals } from "./domination.mjs";
import Message from "./message.mjs";


export const VALID_PLAYER_MAP_MINUTE_AVERAGES = [
    {"value": "score", "display": "Score"}, 
    {"value": "frags", "display": "Frags"}, 
    {"value": "kills", "display": "Kills"}, 
    {"value": "deaths", "display": "Deaths"}, 
    {"value": "suicides", "display": "Suicides"}, 
    {"value": "team_kills", "display": "Team Kills"},
    {"value": "headshots", "display": "Headshots"}, 
    {"value": "item_amp", "display": "UDamage Taken"}, 
    {"value": "item_belt", "display": "Shield Belts Taken"}, 
    {"value": "item_boots", "display": "Jump Boots Taken"}, 
    {"value": "item_body", "display": "Body Armour Taken"}, 
    {"value": "item_pads", "display": "Thigh Pads Taken"}, 
    {"value": "item_invis", "display": "Invisibilities Taken"}, 
    {"value": "item_shp", "display": "Super Health Pack Taken"},
    {"value": "flag_taken", "display": "Flag Taken"}, 
    {"value": "flag_pickup", "display": "Flag Pickups"}, 
    {"value": "flag_drop", "display": "Flag Drops"}, 
    {"value": "flag_assist", "display": "Flag Assists"}, 
    {"value": "flag_cover", "display": "Flag Covers"}, 
    {"value": "flag_seal", "display": "Flag Seals"}, 
    {"value": "flag_cap", "display": "Flag Caps"}, 
    {"value": "flag_kills", "display": "Flag Kills"}, 
    {"value": "flag_return", "display": "Flag Returns"}, 
    {"value": "flag_return_base", "display": "Flag Returns Base"}, 
    {"value": "flag_return_mid", "display": "Flag Returns Mid"}, 
    {"value": "flag_return_enemy_base", "display": "Flag Returns Enemy Base"}, 
    {"value": "flag_return_save", "display": "Flag Returns Close Save"}, 
    {"value": "dom_caps", "display": "Domination Caps"}
];

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


export async function getAllNames(bReturnArray, bIgnoreAny){

    if(bReturnArray === undefined) bReturnArray = false;
    if(bIgnoreAny === undefined) bIgnoreAny = false;

    const result = await simpleQuery(`SELECT id,name FROM nstats_maps ORDER BY name ASC`);

    if(bReturnArray){
        result.unshift({"id": 0, "name": "All"});
        return result;
    }

    const data = {};

    if(!bIgnoreAny){
        data[0] = "Any";
    }

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        data[r.id] = r.name;
    }

    return data;
}


export async function getAllMapImages(){

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

    if(result.length === 0) return null;

    //const mapImageName = genericGetMapImageName(result[0].name);

    const imageName = result[0].name.toLowerCase();

    const images = await getMapImages([imageName]);
    result[0].image = images[imageName] ?? "default.jpg";
    return result[0];
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


    const query = `SELECT 
    nstats_matches.id,
    nstats_matches.server_id,
    nstats_matches.gametype_id,
    nstats_matches.date,
    nstats_matches.playtime,
    nstats_matches.players,
    nstats_matches.total_teams,
    nstats_matches.team_0_score,
    nstats_matches.team_1_score,
    nstats_matches.team_2_score,
    nstats_matches.team_3_score,
    nstats_matches.solo_winner,
    nstats_matches.solo_winner_score,
    IF(nstats_matches.solo_winner = 0, "", nstats_players.name) as solo_winner_name,
    IF(nstats_matches.solo_winner = 0, "", nstats_players.country) as solo_winner_country,
    nstats_servers.name as server_name,
    nstats_gametypes.name as gametype_name,
    nstats_matches.hash 
    FROM nstats_matches 
    LEFT JOIN nstats_players ON nstats_players.id = nstats_matches.solo_winner
    LEFT JOIN nstats_servers ON nstats_servers.id = nstats_matches.server_id
    LEFT JOIN nstats_gametypes ON nstats_gametypes.id = nstats_matches.gametype_id
    WHERE map_id=? ORDER BY date DESC, id DESC LIMIT ?, ?`;


    const result = await simpleQuery(query, [mapId, start, perPage]);

    return result;
}


export async function getTotalMatches(id){

    const query = `SELECT COUNT(*) as total_matches FROM nstats_matches WHERE map_id=?`;

    const result = await simpleQuery(query, [id]);
    return result[0].total_matches;
}

export async function getTotalPlaytimeAndMatches(id){

    const query = `SELECT COUNT(*) as total_matches, SUM(playtime) as total_playtime FROM nstats_matches WHERE map_id=?`;

    const result = await simpleQuery(query, [id]);

    return {"playtime": result[0].total_playtime, "matches": result[0].total_matches};
}


export async function getAllMatchIds(id){

    const query = `SELECT id FROM nstats_matches WHERE map_id=?`;

    const result = await simpleQuery(query, [id]);

    return result.map((r) =>{
        return r.id;
    });
}


export async function getPlayerMapTotals(playerIds, mapId){

    if(playerIds.length === 0) return {"data": [], "bFoundCTF": false, "bFoundDom": false};


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

    for(let i = 0; i < VALID_PLAYER_MAP_MINUTE_AVERAGES.length; i++){

        const {value} = VALID_PLAYER_MAP_MINUTE_AVERAGES[i];
 
        if(value === type) return true;
    }
    return false;
} 

export async function getMapPlayerAveragesTotalCount(mapId){

    const query = `SELECT COUNT(*) as total_values FROM nstats_player_map_minute_averages WHERE map_id=?`;

    const result = await simpleQuery(query, [mapId]);

    return result[0].total_values;
}

function getMapAverageTitle(target){

    for(let i = 0; i < VALID_PLAYER_MAP_MINUTE_AVERAGES.length; i++){

        const {value, display} = VALID_PLAYER_MAP_MINUTE_AVERAGES[i];

        if(value === target) return display;
    }

    return "Not Found";
}

export async function getMapPlayerAverages(mapId, category, initialPage, initialPerPage){

    const [page, perPage, start] = sanitizePagePerPage(initialPage, initialPerPage);

    let title = "Kills";

    category = category.toLowerCase();

    if(bValidMinuteCategory(category)){
        
        title = getMapAverageTitle(category);
        
    }else{
        category = "kills";
    }

    const query = `SELECT 
    nstats_player_map_minute_averages.player_id,
    nstats_player_map_minute_averages.total_playtime,
    nstats_players.name,
    nstats_players.country,
    ${category} as target_value 
    FROM nstats_player_map_minute_averages 
    LEFT JOIN nstats_players ON nstats_player_map_minute_averages.player_id = nstats_players.id
    WHERE map_id=? ORDER BY target_value DESC LIMIT ?, ?`;

    const result = await simpleQuery(query, [mapId, start, perPage]);

    const totalEntries = await getMapPlayerAveragesTotalCount(mapId);

    return {"data": result, "title": title, "totalEntries": totalEntries};
}


export async function getUniquePlayerIdsOnMap(mapId){

    const query = `SELECT DISTINCT player_id FROM nstats_match_players WHERE map_id=?`;

    const result = await simpleQuery(query, [mapId]);

    return result.map((r) => r.player_id);
}

export async function getAllMapIds(){

    const query = `SELECT DISTINCT id FROM nstats_maps`;

    const result = await simpleQuery(query);

    return result.map((r) => r.id);
}



export async function getAllPlayedMatchIds(mapId){

    const query = `SELECT DISTINCT id FROM nstats_matches WHERE map_id=?`;

    const result = await simpleQuery(query,[mapId]);


    return result.map((r) =>{   
        return r.id;
    });
}



export async function getNameById(mapId){

    const query = `SELECT name FROM nstats_maps WHERE id=?`;
    const result = await simpleQuery(query, [mapId]);

    if(result.length === 0){
        return null;
    }

    return result[0].name;
}

export async function getNamesByIds(mapIds){

    if(mapIds.length === 0) return {};

    const query = `SELECT id,name FROM nstats_maps WHERE id IN(?)`;

    const result = await simpleQuery(query, [mapIds]);

    const data = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        data[r.id] = r.name;
    }

    return data;
}


export async function getMatchesPlayedCountBetween(mapId, start, end){

    const query = `SELECT id,date,playtime FROM nstats_matches WHERE map_id=? AND date>=? AND date<=? ORDER BY date DESC`;

    const result = await simpleQuery(query, [mapId, start, end]);

    return mysqlSetTotalsByDate(result, "date", ["playtime"]);

}


export async function getLastPlayedMapId(){

    const query = `SELECT map_id FROM nstats_matches ORDER BY date DESC LIMIT 1`;

    const result = await simpleQuery(query);

    if(result.length > 0) return result[0].map_id;

    return null;
}

export async function getLastPlayedGametypeId(mapId){

    const query = `SELECT gametype_id FROM nstats_matches WHERE map_id=? ORDER BY date DESC LIMIT 1`;

    const result = await simpleQuery(query, [mapId]);

    if(result.length === 0) return null;

    return result[0].gametype_id;
}

export async function getPlayedGametypes(mapId){

    const query = `SELECT DISTINCT gametype_id FROM nstats_matches WHERE map_id=?`;

    const result = await simpleQuery(query, [mapId]);

    return result.map((r) =>{
        return r.gametype_id;
    });
}


export async function search(name){

    const query = `SELECT id,name,first_match,last_match,matches,playtime FROM nstats_maps WHERE name LIKE ? ORDER BY name ASC`;

    const result = await simpleQuery(query, [`%${name}%`]);

    const images = new Set();

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        images.add(r.name);

    }

    const mapImages = await getMapImages([...images]);

    for(let i = 0; i < result.length; i++){

        const r = result[i];
        r.image = mapImages?.[r.name.toLowerCase()] ?? "default.jpg";
    }

    return result;
}


export async function getAllMaps(){

    const query = `SELECT * FROM nstats_maps ORDER BY name ASC`;

    return await simpleQuery(query);
}

