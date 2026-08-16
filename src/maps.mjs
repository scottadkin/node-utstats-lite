import { bulkInsert, simpleQuery, sqlInsertOnDuplicateUpdate, sqlInsertReturnRowId } from "./database.mjs";
import { readdir } from 'node:fs/promises';
import { getMapImageName as genericGetMapImageName, 
    mysqlSetTotalsByDate, sanitizePagePerPage
} from "./generic.mjs";
import { getPlayerMapTotals as getPlayerCTFMapTotals } from "./ctf.mjs";
import { getPlayerMapTotals as getPlayerDOMMapTotals } from "./domination.mjs";
import Message from "./message.mjs";


const validBoth = [
    {"value": "score", "display": "Score", "group": "General"}, 
    {"value": "frags", "display": "Frags", "group": "General"}, 
    {"value": "kills", "display": "Kills", "group": "General"}, 
    {"value": "deaths", "display": "Deaths", "group": "General"}, 
    {"value": "suicides", "display": "Suicides", "group": "General"}, 
    {"value": "team_kills", "display": "Team Kills", "group": "General"},
    {"value": "headshots", "display": "Headshots", "group": "General"}, 
    {"value": "flag_taken", "display": "Flag Taken", "group": "CTF"}, 
    {"value": "flag_pickup", "display": "Flag Pickups", "group": "CTF"}, 
    {"value": "flag_drop", "display": "Flag Drops", "group": "CTF"}, 
    {"value": "flag_assist", "display": "Flag Assists", "group": "CTF"}, 
    {"value": "flag_cover", "display": "Flag Covers", "group": "CTF"}, 
    {"value": "flag_seal", "display": "Flag Seals", "group": "CTF"}, 
    {"value": "flag_cap", "display": "Flag Caps", "group": "CTF"}, 
    {"value": "flag_kill", "display": "Flag Kills", "group": "CTF"}, 
    {"value": "flag_return", "display": "Flag Returns", "group": "CTF"}, 
    {"value": "flag_return_base", "display": "Flag Returns Base", "group": "CTF"}, 
    {"value": "flag_return_mid", "display": "Flag Returns Mid", "group": "CTF"}, 
    {"value": "flag_return_enemy_base", "display": "Flag Returns Enemy Base", "group": "CTF"}, 
    {"value": "flag_return_save", "display": "Flag Returns Close Save", "group": "CTF"}, 
    {"value": "dom_caps", "display": "Domination Caps", "group": "Domination"},
    {"value": "item_amp", "display": "UDamage Taken", "group": "Items"}, 
    {"value": "item_belt", "display": "Shield Belts Taken", "group": "Items"}, 
    {"value": "item_boots", "display": "Jump Boots Taken", "group": "Items"}, 
    {"value": "item_body", "display": "Body Armour Taken", "group": "Items"}, 
    {"value": "item_pads", "display": "Thigh Pads Taken", "group": "Items"}, 
    {"value": "item_invis", "display": "Invisibilities Taken", "group": "Items"}, 
    {"value": "item_shp", "display": "Super Health Pack Taken", "group": "Items"},

    {"value": "spree_1", "display": "Killing Sprees", "group": "Special Events"},
    {"value": "spree_2", "display": "Rampage", "group": "Special Events"},
    {"value": "spree_3", "display": "Dominating", "group": "Special Events"},
    {"value": "spree_4", "display": "Unstoppable", "group": "Special Events"},
    {"value": "spree_5", "display": "Godlike", "group": "Special Events"},
    

    {"value": "multi_1", "display": "Double Kill", "group": "Special Events"},
    {"value": "multi_2", "display": "Multi Kill", "group": "Special Events"},
    {"value": "multi_3", "display": "Ultra Kill", "group": "Special Events"},
    {"value": "multi_4", "display": "Monster Kill", "group": "Special Events"},
];

export const VALID_PLAYER_MAP_MINUTE_AVERAGES = [
    ...validBoth.map((v) =>{
        return {"value": `avg_${v.value}`, "display": v.display, "group": v.group}
    }),
    {"value": "avg_spree_best", "display": "Best Spree", "group": "Special Events"},
    {"value": "avg_multi_best", "display": "Best Multi Kill", "group": "Special Events"}, 
];


export const VALID_PLAYER_EPM_AVERAGES = [
    ...validBoth.map((v) =>{
        return {"value": `epm_${v.value}`, "display": v.display, "group": v.group}
    }),
];


export const VALID_MAP_SEARCH_BY = ["name", "first_match", "matches", "playtime", "last_match"];



export const VALID_PLAYER_TOTALS = [
    {"value": "winrate", "display": "Win Rate", "group": "Match Results"}, 
    {"value": "wins", "display": "Wins", "group": "Match Results"}, 
    {"value": "draws", "display": "Draws", "group": "Match Results"}, 
    {"value": "losses", "display": "Losses", "group": "Match Results"}, 
    {"value": "playtime", "display": "Playtime", "group": "General"}, 
    {"value": "total_matches", "display": "Matches Played", "group": "General"}, 
    {"value": "score", "display": "Score", "group": "General"}, 
    {"value": "frags", "display": "Frags", "group": "General"}, 
    {"value": "kills", "display": "Kills", "group": "General"}, 
    {"value": "deaths", "display": "Deaths", "group": "General"}, 
    {"value": "suicides", "display": "Suicides", "group": "General"}, 
    {"value": "team_kills", "display": "Team Kills", "group": "General"},
    {"value": "efficiency", "display": "Efficiency", "group": "General"},
    {"value": "headshots", "display": "Headshots", "group": "General"}, 
    {"value": "flag_taken", "display": "Flag Taken", "group": "CTF"}, 
    {"value": "flag_pickup", "display": "Flag Pickups", "group": "CTF"}, 
    {"value": "flag_drop", "display": "Flag Drops", "group": "CTF"}, 
    {"value": "flag_assist", "display": "Flag Assists", "group": "CTF"}, 
    {"value": "flag_cover", "display": "Flag Covers", "group": "CTF"}, 
    {"value": "flag_seal", "display": "Flag Seals", "group": "CTF"}, 
    {"value": "flag_cap", "display": "Flag Caps", "group": "CTF"}, 
    {"value": "flag_kill", "display": "Flag Kills", "group": "CTF"}, 
    {"value": "flag_return", "display": "Flag Returns", "group": "CTF"}, 
    {"value": "flag_return_base", "display": "Flag Returns Base", "group": "CTF"}, 
    {"value": "flag_return_mid", "display": "Flag Returns Mid", "group": "CTF"}, 
    {"value": "flag_return_enemy_base", "display": "Flag Returns Enemy Base", "group": "CTF"}, 
    {"value": "flag_return_save", "display": "Flag Returns Close Save", "group": "CTF"}, 
    {"value": "dom_caps", "display": "Domination Caps", "group": "Domination"},
    {"value": "item_amp", "display": "UDamage Taken", "group": "Items"}, 
    {"value": "item_belt", "display": "Shield Belts Taken", "group": "Items"}, 
    {"value": "item_boots", "display": "Jump Boots Taken", "group": "Items"}, 
    {"value": "item_body", "display": "Body Armour Taken", "group": "Items"}, 
    {"value": "item_pads", "display": "Thigh Pads Taken", "group": "Items"}, 
    {"value": "item_invis", "display": "Invisibilities Taken", "group": "Items"}, 
    {"value": "item_shp", "display": "Super Health Pack Taken", "group": "Items"},

    {"value": "spree_1", "display": "Killing Sprees", "group": "Special Events"},
    {"value": "spree_2", "display": "Rampage", "group": "Special Events"},
    {"value": "spree_3", "display": "Dominating", "group": "Special Events"},
    {"value": "spree_4", "display": "Unstoppable", "group": "Special Events"},
    {"value": "spree_5", "display": "Godlike", "group": "Special Events"},
    {"value": "spree_best", "display": "Best Spree", "group": "Special Events"},
    

    {"value": "multi_1", "display": "Double Kill", "group": "Special Events"},
    {"value": "multi_2", "display": "Multi Kill", "group": "Special Events"},
    {"value": "multi_3", "display": "Ultra Kill", "group": "Special Events"},
    {"value": "multi_4", "display": "Monster Kill", "group": "Special Events"},
    {"value": "multi_best", "display": "Best Multi Kill", "group": "Special Events"},
];

async function getMapId(name){

    const query = `SELECT id FROM nstats_maps WHERE name=?`;

    const result = await simpleQuery(query, [name]);

    if(result.length > 0) return result[0].id;

    return null;
}


async function createMap(name){

    const query = `INSERT INTO nstats_maps VALUES(NULL,?,0,0,'1999-11-30 00:00:00','1999-11-30 00:00:00')`;

    const result = await sqlInsertReturnRowId(query, [name]);

 
    return result;
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

    const [fullSize, thumbs] = await Promise.all([readdir("./public/images/maps/"), readdir("./public/images/maps/thumbs/")]);

    for(const [name, imageName] of Object.entries(namesToImageNames)){

        let bFoundFullSize = false;
        let bFoundThumb = false;
        let bPartialFullSize = false;
        let bPartialThumb = false;

        const currentTarget = `${imageName}.jpg`;
        const fullSizeIndex = fullSize.indexOf(currentTarget);
        const thumbsIndex = thumbs.indexOf(currentTarget);

        let targetImageFile = "default.jpg";
        let targetThumbFile = "default.jpg";

        if(fullSizeIndex !== -1){
            targetImageFile = currentTarget;
            bFoundFullSize = true;
        }

        if(thumbsIndex !== -1){
            targetThumbFile = currentTarget;
            bFoundThumb = true;
        }

        
        if(fullSizeIndex === -1){

            const partial = getPartialNameMatchImage(fullSize, currentTarget);

            if(partial !== null){
                targetImageFile = partial;
                bPartialFullSize = true;
            }
        }

        if(thumbsIndex === -1){
            const partial = getPartialNameMatchImage(thumbs, currentTarget);

            if(partial !== null){
                targetThumbFile = partial;
                bPartialThumb = true;
            }
        }

        //bFoundFullsize and bFoundThumb just incase mapname is really "default"
        images[name] = {
            "fullSize": targetImageFile, 
            "thumb": targetThumbFile, 
            bFoundFullSize, bFoundThumb, bPartialFullSize, bPartialThumb
        };
    }
    
    return images;
}


async function calculateTotals(mapId){

    const query = `SELECT COUNT(*) as total_matches,SUM(playtime) as playtime,MIN(date) as first_match,MAX(date) as last_match FROM nstats_matches WHERE map_id=?`;

    const result = await simpleQuery(query, [mapId]);

    if(result[0].total_matches === 0) return null;

    return result[0];
}

export async function deleteMap(mapId){

    const query = `DELETE FROM nstats_maps WHERE id=?`;

    return await simpleQuery(query, [mapId]);
}

export async function updateTotals(mapId){

    const totals = await calculateTotals(mapId);

    if(totals === null){
        await deleteMap(mapId);
       // new Message(`Failed to calculate map totals.`,`error`);
       return
    }

    const query = `UPDATE nstats_maps SET matches=?, playtime=?, first_match=?, last_match=? WHERE id=?`;

    await simpleQuery(query, [totals.total_matches, totals.playtime, totals.first_match, totals.last_match, mapId]);
}


export async function getMostPlayedMaps(limit){

    limit = parseInt(limit);

    if(limit !== limit) throw new Error(`getMostPlayedMaps(limit) limit must be a valid integer`);

    const query = `SELECT * FROM nstats_maps ORDER by playtime DESC LIMIT ?`;

    const result = await simpleQuery(query, [limit]);

    const images = await getMapImages(result.map(r => r.name.toLowerCase()));

    for(let i = 0; i < result.length; i++){

        const r = result[i];
        r.image = images[r.name.toLowerCase()];
    }

    return result;
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

    const [fullSize, thumbs] = await Promise.all([
        readdir("./public/images/maps/"),
        readdir("./public/images/maps/thumbs/")
    ])

    const reg = /^.+?\.jpg$/i;
    const validFullSize = [];
    const validThumbs = [];


    for(let i = 0; i < fullSize.length; i++){

        const f = fullSize[i];
        if(reg.test(f)) validFullSize.push(f);
    }

    for(let i = 0; i < thumbs.length; i++){
   
        const f = thumbs[i];
        if(reg.test(f)) validThumbs.push(f);
    }

    return {"fullSize": validFullSize, "thumbs": validThumbs};
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

    const imageName = result[0].name;

    const images = await getMapImages([imageName]);

    result[0].image = images[Object.keys(images)[0]];
    result[0].requiredImageName = getMapImageName(imageName);

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
    IF(nstats_matches.solo_winner = 0, '', nstats_players.name) as solo_winner_name,
    IF(nstats_matches.solo_winner = 0, '', nstats_players.country) as solo_winner_country,
    nstats_servers.name as server_name,
    nstats_gametypes.name as gametype_name,
    nstats_matches.hash 
    FROM nstats_matches 
    LEFT JOIN nstats_players ON nstats_players.id = nstats_matches.solo_winner
    LEFT JOIN nstats_servers ON nstats_servers.id = nstats_matches.server_id
    LEFT JOIN nstats_gametypes ON nstats_gametypes.id = nstats_matches.gametype_id
    WHERE nstats_matches.map_id=? ORDER BY nstats_matches.date DESC, nstats_matches.id DESC LIMIT ?, ?`;


    const result = await simpleQuery(query, [mapId, start, perPage]);

    return result;
}


export async function getTotalMatches(id){

    const query = `SELECT COUNT(*) as total_matches FROM nstats_matches WHERE map_id=?`;

    const result = await simpleQuery(query, [id]);
    return result[0].total_matches;
}

export async function getTotalPlaytimeAndMatches(id, gametypeId){

    let where = "map_id=?";
    const vars = [id];

    if(gametypeId !== 0){
        where += ` AND gametype_id=?`;
        vars.push(gametypeId);
    }

    const query = `SELECT COUNT(*) as total_matches, SUM(playtime) as total_playtime FROM nstats_matches WHERE ${where}`;

    const result = await simpleQuery(query, vars);

    return {"playtime": result[0].total_playtime, "matches": result[0].total_matches};
}


export async function getAllMatchIds(id){

    const query = `SELECT id FROM nstats_matches WHERE map_id=?`;

    const result = await simpleQuery(query, [id]);

    return result.map((r) =>{
        return r.id;
    });
}


export async function getPlayerMapTotals(playerIds, mapId, bCTF, bDom){

    if(playerIds.length === 0) return [];

    const playerT = "nstats_match_players";
    const ctfT = "nstats_match_ctf";
    const domT = "nstats_match_dom";

    const query = `SELECT 
    ${playerT}.player_id, 
    COUNT(*) as total_matches, 
    SUM(time_on_server) as playtime, 
    SUM(score) as score,
    SUM(frags) as frags,
    SUM(kills) as kills, 
    SUM(deaths) as deaths, 
    SUM(suicides) as suicides, 
    SUM(team_kills) as team_kills,
    SUM( headshots) as headshots,
    SUM(item_amp) as item_amp,
    SUM( item_belt) as item_belt,
    SUM(item_boots) as item_boots,
    SUM( item_body) as item_body,
    SUM(item_pads) as item_pads,
    SUM(item_invis) as item_invis,
    SUM(item_shp) as item_shp,
    SUM(flag_taken) as flag_taken,
    SUM(flag_pickup) as flag_pickup, 
    SUM(flag_drop) as flag_drop, 
    SUM(flag_assist) as flag_assist, 
    SUM(flag_cover) as flag_cover,
    SUM(flag_seal) as flag_seal, 
    SUM(flag_cap) as flag_cap, 
    SUM(flag_kill) as flag_kill, 
    SUM(flag_return) as flag_return, 
    SUM(flag_return_base) as flag_return_base, 
    SUM(flag_return_mid) as flag_return_mid, 
    SUM(flag_return_enemy_base) as flag_return_enemy_base, 
    SUM(flag_return_save) as flag_return_save,
    SUM(${domT}.total_caps) as dom_caps 
    FROM ${playerT} 
    LEFT JOIN ${ctfT} ON ${playerT}.player_id=${ctfT}.player_id AND ${playerT}.match_id=${ctfT}.match_id
    LEFT JOIN ${domT} ON ${playerT}.player_id=${domT}.player_id AND ${playerT}.match_id=${domT}.match_id
    WHERE ${playerT}.player_id IN (?) AND ${playerT}.map_id=? GROUP BY ${playerT}.player_id`;


    return await simpleQuery(query, [playerIds, mapId]);

}



export function bValidMinuteCategory(type){

    for(let i = 0; i < VALID_PLAYER_MAP_MINUTE_AVERAGES.length; i++){

        const {value} = VALID_PLAYER_MAP_MINUTE_AVERAGES[i];
 
        if(value === type) return true;
    }
    return false;
} 

export async function getMapPlayerAveragesTotalCount(mapId, gametypeId){

    const query = `SELECT COUNT(*) as total_values FROM nstats_player_totals WHERE map_id=? AND gametype_id=?`;

    const result = await simpleQuery(query, [mapId, gametypeId]);

    return result[0].total_values;
}

function getMapAverageTitle(target){

    for(let i = 0; i < VALID_PLAYER_MAP_MINUTE_AVERAGES.length; i++){

        const {value, display} = VALID_PLAYER_MAP_MINUTE_AVERAGES[i];

        if(value === target) return display;
    }

    return "Not Found";
}

function getMapAverageType(averageType, target){

    const options = (averageType === "match-averages") ? VALID_PLAYER_MAP_MINUTE_AVERAGES : VALID_PLAYER_EPM_AVERAGES;

    for(let i = 0; i < options.length; i++){

        const {value, display} = options[i];

        if(value === target) return options[i];
    }
    return null;
}

export async function getMapPlayerAverages(averageType, mapId, gametypeId, category, initialPage, initialPerPage){

    averageType = averageType.toLowerCase();

    const averageTypes = ["match-averages", "epm"];

    if(averageTypes.indexOf(averageType) === -1) averageType = "match-averages";

    const [page, perPage, start] = sanitizePagePerPage(initialPage, initialPerPage);

    let title = "Score";

    category = category.toLowerCase();

    const typeInfo = getMapAverageType(averageType, category);

    if(typeInfo === null){
        category = "avg_score";
        
    }else{
        category = typeInfo.value;
        title = typeInfo.display;
    }


    const pTotals = "nstats_player_totals";
    const pT = "nstats_players";

    //need to add another join for ctf stuff

    let targetCol = "";
    let ctfJoin = "";

    if(typeInfo !== null && typeInfo.group === "CTF"){
        targetCol = `nstats_player_totals_ctf.${category}`;
        ctfJoin = `INNER JOIN nstats_player_totals_ctf ON nstats_player_totals_ctf.player_id = ${pTotals}.player_id 
        AND nstats_player_totals_ctf.gametype_id = ${pTotals}.gametype_id AND nstats_player_totals_ctf.map_id = ${pTotals}.map_id`;
    }else{
        targetCol = `${pTotals}.${category}`;
    }


    const query = `SELECT 
    ${pTotals}.player_id,
    ${pTotals}.last_active,
    ${pTotals}.total_matches,
    ${pTotals}.playtime,
    ${targetCol} as target_value,
    ${pT}.name,
    ${pT}.country
    FROM ${pTotals}
    INNER JOIN ${pT} ON ${pT}.id = ${pTotals}.player_id
    ${ctfJoin}
    WHERE ${pTotals}.map_id=? AND ${pTotals}.gametype_id=? ORDER BY target_value DESC LIMIT ?, ?`;
    

    const data = await simpleQuery(query, [mapId, gametypeId, start, perPage]);

    const totalEntries = await getMapPlayerAveragesTotalCount(mapId, gametypeId);

    return {data, title, totalEntries}
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

export async function getAllUniquePlayedGametypes(mapId, bReturnName){

    let query = "";
    

    if(!bReturnName){
        query = `SELECT DISTINCT gametype_id FROM nstats_matches WHERE map_id=?`
    }else{
        query = `SELECT DISTINCT nstats_matches.gametype_id,nstats_gametypes.name as gametype_name 
            FROM nstats_matches 
            LEFT JOIN nstats_gametypes ON nstats_gametypes.id = nstats_matches.gametype_id
            WHERE nstats_matches.map_id=?`;
    }

    const result = await simpleQuery(query, [mapId]);

    if(!bReturnName){
        return result.map((r) =>{
            return r.gametype_id;
        });
    }else{
        return result;
    }
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


async function getTotalPossibleMatches(nameSearch){


    const query = `SELECT COUNT(*) as total_rows FROM nstats_maps WHERE name LIKE ?`;

    const result = await simpleQuery(query, [`%${nameSearch}%`]);

    return result[0].total_rows;
}

export async function searchMaps(name, dirtyPage, dirtyPerPage, sortBy, order){
    
    if(VALID_MAP_SEARCH_BY.indexOf(sortBy) === -1) throw new Error(`Not a valid map search by type`);

    const [page, perPage, start] = sanitizePagePerPage(dirtyPage, dirtyPerPage);

    order = order.toUpperCase();

    if(order !== "ASC" && order !== "DESC") order = "ASC";


    const query = `SELECT id,name,first_match,last_match,matches,playtime 
    FROM nstats_maps 
    WHERE name LIKE ? 
    ORDER BY ${sortBy} ${order}
    LIMIT ?, ?`;


    const result = await simpleQuery(query, [`%${name}%`, start, perPage]);

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

    const totalMatches = await getTotalPossibleMatches(name);

    return {totalMatches, "maps": result};
}


export async function getAllMaps(){

    const query = `SELECT * FROM nstats_maps ORDER BY name ASC`;

    return await simpleQuery(query);
}

export function bValidMapPlayerTotalType(type){

    type = type.toLowerCase();

    for(let i = 0; i < VALID_PLAYER_TOTALS.length; i++){

        const v = VALID_PLAYER_TOTALS[i];

        if(v.value === type) return true;
    }

    return false;
}

/**
 * 
 * @param {string} type 
 * @returns matching setting or null if not found
 */
function getMapPlayerTotalInfo(type){

    type = type.toLowerCase();

    for(let i = 0; i < VALID_PLAYER_TOTALS.length; i++){

        const v = VALID_PLAYER_TOTALS[i];

        if(v.value === type) return v;

    }

    return null;
}

export async function getMapPlayerTotalsMaxResults(mapId, gametypeId){

    const query = `SELECT COUNT(*) as total_results FROM nstats_player_totals WHERE map_id=? AND gametype_id=?`;

    const result = await simpleQuery(query, [mapId, gametypeId]);

    return result[0].total_results;
}

export async function getMapPlayerTotals(mapId, gametypeId, category, dirtyPage, dirtyPerPage){

    const [page, perPage, start] = sanitizePagePerPage(dirtyPage, dirtyPerPage);

    category = category.toLowerCase();

    const setting = getMapPlayerTotalInfo(category);

    if(setting === null) throw new Error(`Not a valid player map total type.`);
    
    const pT = "nstats_player_totals";
    const nameT = "nstats_players";
    const ctfT = "nstats_player_totals_ctf";

    const targetCol = (setting.group === "CTF") ? `${ctfT}.${category}` : `${pT}.${category}`;

    let ctfJoin = "";

    if(setting.group === "CTF"){
        ctfJoin = `INNER JOIN ${ctfT} on ${ctfT}.player_id = ${pT}.player_id`;
        ctfJoin += ` AND ${ctfT}.gametype_id=${pT}.gametype_id AND ${ctfT}.map_id = ${pT}.map_id`;
    }


    const query = `SELECT 
    ${pT}.player_id,
    ${nameT}.name as name,
    ${nameT}.country as country,
    ${pT}.last_active,
    ${pT}.playtime,
    ${pT}.total_matches,
    ${targetCol} as total_value
    FROM ${pT} 
    INNER JOIN ${nameT} on ${nameT}.id = ${pT}.player_id
    ${ctfJoin}
    WHERE ${pT}.map_id=? AND ${pT}.gametype_id=? 
    ORDER BY ${targetCol} DESC
    LIMIT ${start}, ${perPage}`;

    const data = await simpleQuery(query, [mapId, gametypeId]);
    const totalResults = await getMapPlayerTotalsMaxResults(mapId, gametypeId);

    return {data, totalResults};
}


export async function getMapThumbnailSettings(){

    const query = `SELECT name,value FROM nstats_map_thumbnail_settings`;

    const result = await simpleQuery(query);

    const obj = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        obj[r.name.toLowerCase()] = {
            "value": r.value,
            "name": r.name
        };
    }

    return obj;
}


export async function saveThumbnailSettings(settings){

    const query = `UPDATE nstats_map_thumbnail_settings SET value=? WHERE name=?`;

    for(let i = 0; i < settings.length; i++){

        const {name, value} = settings[i];

        await simpleQuery(query, [value, name]);
    }
}