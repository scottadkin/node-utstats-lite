import { simpleQuery } from "./database.mjs";
import { sanitizePagePerPage } from "./generic.mjs";
import { getSeasonById } from "./seasons.mjs";
import { getRecordTypeInfo,  bValidPlayerMatchType, bValidRecordMode, sanitizeRecordMode, sanitizeRecordType, getTypeDisplayName, MODE_TITLES } from "./validRecordTypes.mjs";

/**
 * parseInt, if NaN return 0
 * @param {*} value 
 * @returns 
 */
function sanitizeId(value){

    value = parseInt(value);

    if(value !== value) return 0;

    return value;
}


async function getPlayerMatchCTFRecords(recordInfo, gametypeId, mapId, cleanStart, cleanPerPage, cleanMinimumMatchesPlayed, seasonId){


    const nameT = "nstats_players"
    const tT = "nstats_player_totals";
    const cT = "nstats_player_totals_ctf";

    let seasonCheck = ``;
    let where = ``;
    const vars = [gametypeId, mapId, cleanMinimumMatchesPlayed];

   // if(seasonId !== 0){
        seasonCheck += ` AND ${tT}.season_id = ${cT}.season_id`;
        where += ` AND ${tT}.season_id=?`;
        vars.push(seasonId);
   // }

    vars.push(cleanStart, cleanPerPage);

    const query = `SELECT 
    
    ${tT}.player_id,
    ${tT}.gametype_id,
    ${tT}.map_id,
    ${nameT}.name as player_name,
    ${nameT}.country as country,
    ${tT}.last_active,
    ${tT}.playtime,
    ${tT}.total_matches,
    ${cT}.${recordInfo.value} as record_value
    FROM ${tT} 
    LEFT JOIN ${nameT} ON ${tT}.player_id = ${nameT}.id
    LEFT JOIN ${cT} ON ${tT}.player_id = ${cT}.player_id AND ${tT}.gametype_id = ${cT}.gametype_id AND ${tT}.map_id = ${cT}.map_id${seasonCheck}
    WHERE ${tT}.gametype_id=? AND ${tT}.map_id=? AND record_value!=0 AND ${tT}.total_matches>=?${where}
    ORDER BY record_value DESC LIMIT ?, ?`;


    const [result, totalResults] = await Promise.all([
        simpleQuery(query, vars), 
        getTotalEntries("player-match", recordInfo, gametypeId, mapId, cleanMinimumMatchesPlayed, seasonId)
    ]);

    return {"data": result, totalResults}
}


function getTotalsTableQuery(seasonId, recordType, gametypeId, mapId, cleanMinimumMatchesPlayed, cleanStart, cleanPerPage){


    const nameT = "nstats_players";
    const tT = "nstats_player_totals";

    let where = ``;
    const vars = [gametypeId, mapId, cleanMinimumMatchesPlayed,];

    //if(seasonId !== 0){
        vars.push(seasonId);
        where += ` AND ${tT}.season_id=?`;
    //}

    vars.push(cleanStart, cleanPerPage);

    const query = `SELECT
    ${tT}.player_id,
    ${nameT}.name as player_name,
    ${nameT}.country as country,
    ${tT}.last_active,
    ${tT}.playtime,
    ${tT}.total_matches,
    ${tT}.${recordType} as record_value
    FROM ${tT} 
    LEFT JOIN ${nameT} ON ${tT}.player_id = ${nameT}.id
    WHERE ${tT}.gametype_id=? AND ${tT}.map_id=? AND record_value!=0 AND ${tT}.total_matches>=?${where}
    ORDER BY record_value DESC LIMIT ?, ?`;

    return {query, vars}
}

function getTotalsCTFTableQuery(seasonId, recordType, gametypeId, mapId, cleanMinimumMatchesPlayed, cleanStart, cleanPerPage){

    const nameT = "nstats_players";
    const tT = "nstats_player_totals";
    const cT = "nstats_player_totals_ctf";

    const vars = [gametypeId, mapId, cleanMinimumMatchesPlayed];

    let where = ``;

   // if(seasonId !== 0){
        vars.push(seasonId);
        where += ` AND ${tT}.season_id=?`;
   // }


    vars.push(cleanStart, cleanPerPage);

    const query = `SELECT 
    ${cT}.player_id,
    ${tT}.total_matches,
    ${tT}.playtime,
    ${tT}.last_active,
    ${cT}.${recordType} as record_value,
    ${nameT}.name as player_name,
    ${nameT}.country as country

    FROM ${cT}
    LEFT JOIN ${nameT} ON ${cT}.player_id = ${nameT}.id
    LEFT JOIN ${tT} ON ${cT}.player_id = ${tT}.player_id AND ${cT}.gametype_id = ${tT}.gametype_id AND ${cT}.map_id = ${tT}.map_id AND ${cT}.season_id = ${tT}.season_id
    WHERE ${cT}.gametype_id=? AND ${cT}.map_id=? AND record_value!=0 AND ${tT}.total_matches>=?${where}
    ORDER BY record_value DESC LIMIT ?, ?`;

    return {query, vars}
}

function getMaxTableQuery(seasonId, recordType, cleanStart, cleanPerPage, gametypeId, mapId, cleanMinimumMatchesPlayed){

    const nameT = "nstats_players";
    const mT = "nstats_player_totals_max";
    const pT = "nstats_player_totals"
    
    let where = ``;

    const vars = [gametypeId, mapId, cleanMinimumMatchesPlayed];

    //if(seasonId !== 0){
        where += `AND ${pT}.season_id=?`;
        vars.push(seasonId);
    //}

    let query = `SELECT ${mT}.player_id,
    ${mT}.${recordType} as record_value,
    ${pT}.last_active,
    ${pT}.playtime,
    ${pT}.total_matches,
    ${nameT}.name as player_name,
    ${nameT}.country as country
    FROM ${mT} 
    LEFT JOIN ${nameT} ON ${mT}.player_id = ${nameT}.id
    LEFT JOIN ${pT} ON ${mT}.player_id = ${pT}.player_id AND ${mT}.gametype_id = ${pT}.gametype_id AND ${mT}.map_id = ${pT}.map_id AND ${mT}.season_id=${pT}.season_id
    WHERE ${mT}.gametype_id=? AND ${mT}.map_id=? AND record_value !=0 AND ${pT}.total_matches>=? ${where}
    ORDER BY record_value DESC LIMIT ?, ?`;

    vars.push(cleanStart, cleanPerPage);

    return {query, vars}
}

async function getTotalEntries(cleanMode, recordInfo, cleanGametypeId, cleanMapId, cleanMinimumMatchesPlayed, seasonId){

    if(recordInfo === null){
        throw new Error(`recordInfo is null getTotalEntries`);
    }

    const bCTF = recordInfo.group === "CTF";
   
    let table = "";

    if(cleanMode === "player-lifetime"){
        table = (bCTF) ? "nstats_player_totals_ctf" : "nstats_player_totals";
    }else if(cleanMode === "player-match"){
        table = (bCTF) ? "nstats_player_totals_ctf" : "nstats_player_totals_max";
    }else if(cleanMode === "player-epm"){
        table = (bCTF) ? "nstats_player_totals_ctf" : "nstats_player_totals";
    }else if(cleanMode === "player-avg"){
        table = (bCTF) ? "nstats_player_totals_ctf" : "nstats_player_totals";
    }

    if(table === "") throw new Error("No table found");

    const vars = [cleanGametypeId, cleanMapId, cleanMinimumMatchesPlayed];

    let query = `SELECT COUNT(*) as total_rows FROM ${table} WHERE ${recordInfo.value}!=0 
    AND gametype_id=? AND map_id=? AND ${table}.total_matches>=?`;

    

    if(table === "nstats_player_totals_max" && !bCTF){

        query = `SELECT COUNT(*) as total_rows FROM ${table} 
        LEFT JOIN nstats_player_totals ON ${table}.player_id = nstats_player_totals.player_id 
        AND ${table}.gametype_id=nstats_player_totals.gametype_id 
        AND ${table}.map_id=nstats_player_totals.map_id AND ${table}.season_id=nstats_player_totals.season_id
        WHERE ${recordInfo.value}!=0 AND ${table}.gametype_id=? AND ${table}.map_id=? AND nstats_player_totals.total_matches>=?`;

        query += ` AND nstats_player_totals.season_id=?`;
        vars.push(seasonId);
        
    }else{

        query += ` AND ${table}.season_id=?`;
        vars.push(seasonId);
    }

    //if(seasonId !== 0){
        
   // }

    const result = await simpleQuery(query, vars);

    return result[0].total_rows;

}

async function getPlayerMatchRecords(recordInfo, gametypeId, mapId, cleanStart, cleanPerPage, cleanMinimumMatchesPlayed, seasonId){


    if(recordInfo.group === "CTF"){
        return await getPlayerMatchCTFRecords(recordInfo, gametypeId, mapId, cleanStart, cleanPerPage, cleanMinimumMatchesPlayed, seasonId);
    }

    const {query, vars} = getMaxTableQuery(seasonId, recordInfo.value, cleanStart, cleanPerPage, gametypeId, mapId, cleanMinimumMatchesPlayed);

    const [data, totalResults] = await Promise.all([
        simpleQuery(query, vars), 
        getTotalEntries("player-match", recordInfo, gametypeId, mapId, cleanMinimumMatchesPlayed, seasonId)
    ]);

    return {data, totalResults};

}


export async function getUniqueGametypeMapCombinations(){

    const query = `SELECT DISTINCT nstats_player_totals.gametype_id,
    nstats_player_totals.map_id,
    nstats_maps.name as map_name,
    nstats_maps.b_ctf as b_map_ctf,
    nstats_maps.b_dom as b_map_dom,
    nstats_gametypes.name as gametype_name,
    nstats_gametypes.b_ctf as b_gametype_ctf,
    nstats_gametypes.b_dom as b_gametype_dom
    FROM nstats_player_totals 
    LEFT JOIN nstats_gametypes ON nstats_player_totals.gametype_id = nstats_gametypes.id
    LEFT JOIN nstats_maps ON nstats_player_totals.map_id = nstats_maps.id
    WHERE nstats_player_totals.gametype_id!=0 AND nstats_player_totals.map_id!=0`;

    const result = await simpleQuery(query);

    const usedGametypes = new Set();
    const gametypes = [];
    const usedMaps = new Set();
    const maps = [];

    const ctfGametypes = new Set();
    const ctfMaps = new Set();
    const domGametypes = new Set();
    const domMaps = new Set();

    const combos = [];

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        if(r.b_map_ctf){
            ctfMaps.add(r.map_id);
        }

        if(r.b_map_dom){
            domMaps.add(r.map_id);
        }

        if(r.b_gametype_ctf){
            ctfGametypes.add(r.gametype_id);
        }

        if(r.b_gametype_dom){
            domGametypes.add(r.gametype_id);
        }

        if(!usedGametypes.has(r.gametype_id)){
            gametypes.push({"id": r.gametype_id, "name": r.gametype_name});
            usedGametypes.add(r.gametype_id);
        }

        if(!usedMaps.has(r.map_id)){
            maps.push({"id": r.map_id, "name": r.map_name});
            usedMaps.add(r.map_id);
        }

        combos.push({"gId": r.gametype_id, "mId": r.map_id});
    }

  

    return {
        gametypes, maps, combos, 
        "ctfGametypes": [...ctfGametypes], 
        "ctfMaps": [...ctfMaps], 
        "domGametypes": [...domGametypes], 
        "domMaps": [...domMaps]};
}

async function getPlayerLifetimeCTFRecords(recordInfo, gametypeId, mapId, cleanStart, cleanPerPage, cleanMinimumMatchesPlayed, seasonId){


    const {query, vars} = getTotalsCTFTableQuery(seasonId, recordInfo.value, gametypeId, mapId, cleanMinimumMatchesPlayed, cleanStart, cleanPerPage);

    const [data, totalResults] = await Promise.all([
        simpleQuery(query, vars), 
        getTotalEntries("player-lifetime", recordInfo, gametypeId, mapId, cleanMinimumMatchesPlayed, seasonId)
    ]);

    return {data, totalResults}
}

async function getPlayerLifetimeRecords(recordInfo, gametypeId, mapId, cleanStart, cleanPerPage, cleanMinimumMatchesPlayed, seasonId){

    if(recordInfo.group === "CTF"){
        return await getPlayerLifetimeCTFRecords(recordInfo, gametypeId, mapId, cleanStart, cleanPerPage, cleanMinimumMatchesPlayed, seasonId);
    }
    
    const {query, vars} = getTotalsTableQuery(seasonId, recordInfo.value, gametypeId, mapId, cleanMinimumMatchesPlayed, cleanStart, cleanPerPage);

    const [data, totalResults] = await Promise.all([
        simpleQuery(query, vars), 
        getTotalEntries("player-lifetime", recordInfo, gametypeId, mapId, cleanMinimumMatchesPlayed, seasonId)
    ]);

    return {data, totalResults};
}


async function getPlayerEPMCTFRecords(recordInfo, gametypeId, mapId, cleanStart, cleanPerPage, cleanMinimumMatchesPlayed, seasonId){

    const {query,vars} = getTotalsCTFTableQuery(seasonId, recordInfo.value, gametypeId, mapId, cleanMinimumMatchesPlayed, cleanStart, cleanPerPage);

    const [data, totalResults] = await Promise.all([
        simpleQuery(query, vars), 
        getTotalEntries("player-epm",recordInfo, gametypeId, mapId,cleanMinimumMatchesPlayed, seasonId)
    ]);

    return {data, totalResults}
}

async function getPlayerEPMRecords(recordInfo, gametypeId, mapId, cleanStart, cleanPerPage, cleanMinimumMatchesPlayed, seasonId){

    if(recordInfo.group === "CTF"){

        return await getPlayerEPMCTFRecords(recordInfo, gametypeId, mapId, cleanStart, cleanPerPage, cleanMinimumMatchesPlayed, seasonId);
    }

    const {query, vars} = getTotalsTableQuery(seasonId, recordInfo.value, gametypeId, mapId, cleanMinimumMatchesPlayed, cleanStart, cleanPerPage);

    const [data, totalResults] = await Promise.all([
        simpleQuery(query, vars), 
        getTotalEntries("player-epm", recordInfo, gametypeId, mapId, cleanMinimumMatchesPlayed, seasonId)
    ]);

    return {data, totalResults};

}


async function getPlayerAVGCTFRecords(recordInfo, gametypeId, mapId, cleanStart, cleanPerPage, cleanMinimumMatchesPlayed, seasonId){

    const {query,vars} = getTotalsCTFTableQuery(seasonId, recordInfo.value, gametypeId, mapId, cleanMinimumMatchesPlayed, cleanStart, cleanPerPage);

    const [data, totalResults] = await Promise.all([
        simpleQuery(query, vars), 
        getTotalEntries("player-epm",recordInfo, gametypeId, mapId, cleanMinimumMatchesPlayed, seasonId)
    ]);

    return {data, totalResults}
}


async function getPlayerAVGRecords(recordInfo, gametypeId, mapId, cleanStartOffset, cleanPerPage, cleanMinimumMatchesPlayed, seasonId){

    if(recordInfo.group === "CTF"){
        return await getPlayerAVGCTFRecords(recordInfo, gametypeId, mapId, cleanStartOffset, cleanPerPage, cleanMinimumMatchesPlayed, seasonId);
    }

    const {query, vars} = getTotalsTableQuery(seasonId, recordInfo.value, gametypeId, mapId, cleanMinimumMatchesPlayed, cleanStartOffset, cleanPerPage);

    const [data, totalResults] = await Promise.all([
        simpleQuery(query, vars), 
        getTotalEntries("player-avg", recordInfo, gametypeId, mapId, cleanMinimumMatchesPlayed, seasonId)
    ]);

    return {data, totalResults};

}


export async function getRecords(mode, recordType, gametypeId, mapId, dirtyPage, dirtyPerPage, dirtyMinimumMatchesPlayed, seasonId){

    if(!bValidRecordMode(mode)) throw new Error(`Not a valid record mode`);

    const recordInfo = getRecordTypeInfo(mode, recordType);
    if(recordInfo === null) throw new Error(`Not a valid recordType for ${mode}, looking for ${recordType}`);

    seasonId = parseInt(seasonId);
    if(seasonId !== seasonId) throw new Error(`seasonId must be a valid integer`);

    gametypeId = sanitizeId(gametypeId);
    mapId = sanitizeId(mapId);
    const cleanMinimumMatchesPlayed = sanitizeId(dirtyMinimumMatchesPlayed);

    const [page, perPage, start] = sanitizePagePerPage(dirtyPage, dirtyPerPage);

    let result = null;

    if(mode === "player-avg"){
        result = await getPlayerAVGRecords(recordInfo, gametypeId, mapId, start, perPage, cleanMinimumMatchesPlayed, seasonId);
    }else if(mode === "player-match"){
        result = await getPlayerMatchRecords(recordInfo, gametypeId, mapId, start, perPage, cleanMinimumMatchesPlayed, seasonId);
    }else if(mode === "player-lifetime"){
        result = await getPlayerLifetimeRecords(recordInfo, gametypeId, mapId, start, perPage, cleanMinimumMatchesPlayed, seasonId);
    }else if(mode === "player-epm"){
        result = await getPlayerEPMRecords(recordInfo, gametypeId, mapId, start, perPage, cleanMinimumMatchesPlayed, seasonId);
    }

    if(result === null){
        return {page, perPage, "data": [], "totalResults": 0}
    }

    return {page, perPage, "data": result.data, "totalResults": result.totalResults};
  
}

function bRecordsPageIdExists(data, id){

    for(let i = 0; i < data.length; i++){
        if(data[i].id === id) return true;
    }

    return false;
}

export async function sanitizeRecordsPageReq(req, res, pageSettings, gametypes, maps){

    let mode = (req.query.mode !== undefined) ? req.query.mode.toLowerCase() : "player-match";
    let recordType = (req.query.rec !== undefined) ? req.query.rec.toLowerCase() : "score";
    let selectedGametype = (req.query.gid !== undefined) ? parseInt(req.query.gid) : 0;
    let selectedMap = (req.query.mid !== undefined) ? parseInt(req.query.mid) : 0;
    let dirtyPerPage = (req.query.pp !== undefined) ? parseInt(req.query.pp) : parseInt(pageSettings["Results Per Page"]);
    let dirtyPage = (req.query.page !== undefined) ? parseInt(req.query.page) : 1;
    let selectedMinimumMatchesPlayed = (req.query.mm !== undefined) ? parseInt(req.query.mm) : 0;
    let seasonId = (req.params.season !== undefined) ? parseInt(req.params.season) : 0;

    if(seasonId !== seasonId) throw new Error(`seasonId must be a valid integer`);

    let seasonInfo = null;

    if(seasonId !== 0){
        seasonInfo = await getSeasonById(seasonId);
    }

    if(selectedMinimumMatchesPlayed !== selectedMinimumMatchesPlayed) selectedMinimumMatchesPlayed = 0;
    
    if(dirtyPerPage !== dirtyPerPage) dirtyPerPage = 25;
    if(dirtyPage !== dirtyPage) dirtyPage = 1;
    
    if(selectedGametype !== selectedGametype) selectedGametype = 0;
    if(selectedMap !== selectedMap) selectedMap = 0;

    if(selectedGametype !== 0 && !bRecordsPageIdExists(gametypes, selectedGametype)){
        selectedGametype = 0;
    }

    if(selectedMap !== 0 && !bRecordsPageIdExists(maps, selectedMap)){
        selectedMap = 0;
    }

    mode = sanitizeRecordMode(mode);
    recordType = sanitizeRecordType(mode, recordType);

    return {dirtyPage, dirtyPerPage, mode, recordType, selectedGametype, selectedMap, selectedMinimumMatchesPlayed, seasonInfo, seasonId}
}

function getIdName(data, id){

    for(let i = 0; i < data.length; i++){

        if(data[i].id === id) return data[i].name;
    }

    return "Not Found";
}

export function createRecordsPageMetaData(mode, recordType, gametypes, maps, selectedGametype, selectedMap, brandingSettings){

    const modeDisplayName = getTypeDisplayName(mode, recordType);
    
    let title = `${MODE_TITLES[mode]} - ${modeDisplayName} - ${brandingSettings["Site Name"]}`;

    let description = `View the top ${modeDisplayName} ${MODE_TITLES[mode].toLowerCase()}`;

    if(selectedMap !== 0){
        description += `, where the map played was ${getIdName(maps, selectedMap)}`;
    }

    if(selectedGametype !== 0){
        description += `, ${(selectedMap !== 0) ? "and " : "where "}the gametype played was ${getIdName(gametypes, selectedGametype)}`;
    }

    description += `.`;

    return {title, description, modeDisplayName}
}