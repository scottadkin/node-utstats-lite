import { simpleQuery } from "./database.mjs";
import { sanitizePagePerPage } from "./generic.mjs";
import { getRecordTypeInfo,  bValidPlayerMatchType, bValidRecordMode } from "./validRecordTypes.mjs";

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


async function getPlayerMatchCTFRecords(recordInfo, gametypeId, mapId, cleanStart, cleanPerPage, cleanMinimumMatchesPlayed){


    const nameT = "nstats_players"
    const tT = "nstats_player_totals";
    const cT = "nstats_player_totals_ctf";

    const query = `SELECT 
    
    ${cT}.player_id,
    ${cT}.gametype_id,
    ${cT}.map_id,
    ${nameT}.name as player_name,
    ${nameT}.country as country,
    ${tT}.last_active as last_active,
    ${cT}.playtime,
    ${cT}.total_matches,
    ${cT}.${recordInfo.value} as record_value
    FROM ${cT} 
    LEFT JOIN ${nameT} ON ${cT}.player_id = ${nameT}.id
    LEFT JOIN ${tT} ON ${cT}.player_id = ${tT}.player_id AND ${cT}.gametype_id = ${tT}.gametype_id AND ${cT}.map_id = ${tT}.map_id
    WHERE ${cT}.gametype_id=? AND ${cT}.map_id=? AND record_value!=0 AND ${cT}.total_matches>=?
    ORDER BY ${cT}.${recordInfo.value} DESC LIMIT ${cleanStart}, ${cleanPerPage}`;


    const [result, totalResults] = await Promise.all([
        simpleQuery(query, [gametypeId, mapId, cleanMinimumMatchesPlayed]), 
        getTotalEntries("player-match", recordInfo, gametypeId, mapId, cleanMinimumMatchesPlayed)
    ]);

    return {"data": result, totalResults}
}


function getTotalsTableQuery(recordType){

    const nameT = "nstats_players";
    const tT = "nstats_player_totals";

    return `SELECT
    ${tT}.player_id,
    ${nameT}.name as player_name,
    ${nameT}.country as country,
    ${tT}.last_active,
    ${tT}.playtime,
    ${tT}.total_matches,
    ${tT}.${recordType} as record_value
    FROM ${tT} 
    LEFT JOIN ${nameT} ON ${tT}.player_id = ${nameT}.id
    WHERE ${tT}.gametype_id=? AND ${tT}.map_id=? AND record_value!=0 AND ${tT}.total_matches>=?
    ORDER BY record_value DESC LIMIT ?, ?`;
}

function getTotalsCTFTableQuery(recordType){

    const nameT = "nstats_players";
    const tT = "nstats_player_totals";
    const cT = "nstats_player_totals_ctf";

    return `SELECT 
    ${cT}.player_id,
    ${tT}.total_matches,
    ${tT}.playtime,
    ${tT}.last_active,
    ${cT}.${recordType} as record_value,
    ${nameT}.name as player_name,
    ${nameT}.country as country

    FROM ${cT}
    LEFT JOIN ${nameT} ON ${cT}.player_id = ${nameT}.id
    LEFT JOIN ${tT} ON ${cT}.player_id = ${tT}.player_id AND ${cT}.gametype_id = ${tT}.gametype_id AND ${cT}.map_id = ${tT}.map_id
    WHERE ${cT}.gametype_id=? AND ${cT}.map_id=? AND record_value!=0 AND ${tT}.total_matches>=?
    ORDER BY record_value DESC LIMIT ?, ?`;
}

function getMaxTableQuery(recordType, cleanStart, cleanPerPage){

    const nameT = "nstats_players";
    const mT = "nstats_player_totals_max";
    const pT = "nstats_player_totals";

    return `SELECT ${mT}.player_id,
    ${mT}.${recordType} as record_value,
    ${pT}.last_active,
    ${pT}.playtime,
    ${pT}.total_matches,
    ${nameT}.name as player_name,
    ${nameT}.country as country
    FROM ${mT} 
    LEFT JOIN ${nameT} ON ${mT}.player_id = ${nameT}.id
    LEFT JOIN ${pT} ON ${mT}.player_id = ${pT}.player_id AND ${mT}.gametype_id = ${pT}.gametype_id AND ${mT}.map_id = ${pT}.map_id
    WHERE ${mT}.gametype_id=? AND ${mT}.map_id=? AND record_value !=0 AND ${pT}.total_matches>=?
    ORDER BY record_value DESC LIMIT ${cleanStart}, ${cleanPerPage}`;
}

async function getTotalEntries(cleanMode, recordInfo, cleanGametypeId, cleanMapId, cleanMinimumMatchesPlayed){

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

    let query = `SELECT COUNT(*) as total_rows FROM ${table} WHERE ${recordInfo.value}!=0 AND gametype_id=? AND map_id=? AND ${table}.total_matches>=?`;

    if(table === "nstats_player_totals_max" && !bCTF){

        query = `SELECT COUNT(*) as total_rows FROM ${table} 
        LEFT JOIN nstats_player_totals ON ${table}.player_id = nstats_player_totals.player_id 
        AND ${table}.gametype_id=nstats_player_totals.gametype_id 
        AND ${table}.map_id=nstats_player_totals.map_id
        WHERE ${recordInfo.value}!=0 AND ${table}.gametype_id=? AND ${table}.map_id=? AND nstats_player_totals.total_matches>=?`
        ;
    }

    const result = await simpleQuery(query, [cleanGametypeId, cleanMapId, cleanMinimumMatchesPlayed]);

    return result[0].total_rows;

}

async function getPlayerMatchRecords(recordInfo, gametypeId, mapId, cleanStart, cleanPerPage, cleanMinimumMatchesPlayed){


    if(recordInfo.group === "CTF"){
        return await getPlayerMatchCTFRecords(recordInfo, gametypeId, mapId, cleanStart, cleanPerPage, cleanMinimumMatchesPlayed);
    }

    const query = getMaxTableQuery(recordInfo.value, cleanStart, cleanPerPage);

    const [data, totalResults] = await Promise.all([
        simpleQuery(query, [gametypeId, mapId, cleanMinimumMatchesPlayed]), 
        getTotalEntries("player-match", recordInfo, gametypeId, mapId, cleanMinimumMatchesPlayed)
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

async function getPlayerLifetimeCTFRecords(recordInfo, gametypeId, mapId, cleanStart, cleanPerPage, cleanMinimumMatchesPlayed){


    const query = getTotalsCTFTableQuery(recordInfo.value);

    const [data, totalResults] = await Promise.all([
        simpleQuery(query, [gametypeId, mapId, cleanMinimumMatchesPlayed, cleanStart, cleanPerPage]), 
        getTotalEntries("player-lifetime", recordInfo, gametypeId, mapId, cleanMinimumMatchesPlayed)
    ]);

    return {data, totalResults}
}

async function getPlayerLifetimeRecords(recordInfo, gametypeId, mapId, cleanStart, cleanPerPage, cleanMinimumMatchesPlayed){

  
    if(recordInfo.group === "CTF"){
        return await getPlayerLifetimeCTFRecords(recordInfo.value, gametypeId, mapId, cleanStart, cleanPerPage, cleanMinimumMatchesPlayed);
    }
    
    const query = getTotalsTableQuery(recordInfo.value);

    const [data, totalResults] = await Promise.all([
        simpleQuery(query, [gametypeId, mapId, cleanMinimumMatchesPlayed, cleanStart, cleanPerPage]), 
        getTotalEntries("player-lifetime", recordInfo, gametypeId, mapId, cleanMinimumMatchesPlayed)
    ]);

    return {data, totalResults};
}


async function getPlayerEPMCTFRecords(recordInfo, gametypeId, mapId, cleanStart, cleanPerPage, cleanMinimumMatchesPlayed){

    const query = getTotalsCTFTableQuery(recordInfo.value);

    const [data, totalResults] = await Promise.all([
        simpleQuery(query, [gametypeId, mapId, cleanMinimumMatchesPlayed, cleanStart, cleanPerPage]), 
        getTotalEntries("player-epm",recordInfo, gametypeId, mapId,cleanMinimumMatchesPlayed)
    ]);

    return {data, totalResults}
}

async function getPlayerEPMRecords(recordInfo, gametypeId, mapId, cleanStart, cleanPerPage, cleanMinimumMatchesPlayed){

    if(recordInfo.group === "CTF"){

        return await getPlayerEPMCTFRecords(recordInfo, gametypeId, mapId, cleanStart, cleanPerPage, cleanMinimumMatchesPlayed);
    }

    const query = getTotalsTableQuery(recordInfo.value);

    const [data, totalResults] = await Promise.all([
        simpleQuery(query, [gametypeId, mapId, cleanMinimumMatchesPlayed, cleanStart, cleanPerPage]), 
        getTotalEntries("player-epm", recordInfo, gametypeId, mapId, cleanMinimumMatchesPlayed)
    ]);

    return {data, totalResults};

}


async function getPlayerAVGCTFRecords(recordInfo, gametypeId, mapId, cleanStart, cleanPerPage, cleanMinimumMatchesPlayed){

    const query = getTotalsCTFTableQuery(recordInfo.value);

    const [data, totalResults] = await Promise.all([
        simpleQuery(query, [gametypeId, mapId, cleanMinimumMatchesPlayed, cleanStart, cleanPerPage]), 
        getTotalEntries("player-epm",recordInfo, gametypeId, mapId, cleanMinimumMatchesPlayed)
    ]);

    return {data, totalResults}
}


async function getPlayerAVGRecords(recordInfo, gametypeId, mapId, cleanStartOffset, cleanPerPage, cleanMinimumMatchesPlayed){

    if(recordInfo.group === "CTF"){
        return await getPlayerAVGCTFRecords(recordInfo, gametypeId, mapId, cleanStartOffset, cleanPerPage, cleanMinimumMatchesPlayed);
    }

    const query = getTotalsTableQuery(recordInfo.value, cleanMinimumMatchesPlayed);

    const [data, totalResults] = await Promise.all([
        simpleQuery(query, [gametypeId, mapId, cleanMinimumMatchesPlayed, cleanStartOffset, cleanPerPage]), 
        getTotalEntries("player-avg", recordInfo, gametypeId, mapId, cleanMinimumMatchesPlayed)
    ]);

    return {data, totalResults};

}


export async function getRecords(mode, recordType, gametypeId, mapId, dirtyPage, dirtyPerPage, dirtyMinimumMatchesPlayed){

    if(!bValidRecordMode(mode)) throw new Error(`Not a valid record mode`);

    const recordInfo = getRecordTypeInfo(mode, recordType);
    if(recordInfo === null) throw new Error(`Not a valid recordType for ${mode}`);

    gametypeId = sanitizeId(gametypeId);
    mapId = sanitizeId(mapId);
    const cleanMinimumMatchesPlayed = sanitizeId(dirtyMinimumMatchesPlayed);

    const [page, perPage, start] = sanitizePagePerPage(dirtyPage, dirtyPerPage);

    let result = null;

    if(mode === "player-avg"){
        result = await getPlayerAVGRecords(recordInfo, gametypeId, mapId, start, perPage, cleanMinimumMatchesPlayed);
    }else if(mode === "player-match"){
        result = await getPlayerMatchRecords(recordInfo, gametypeId, mapId, start, perPage, cleanMinimumMatchesPlayed);
    }else if(mode === "player-lifetime"){
        result = await getPlayerLifetimeRecords(recordInfo, gametypeId, mapId, start, perPage, cleanMinimumMatchesPlayed);
    }else if(mode === "player-epm"){
        result = await getPlayerEPMRecords(recordInfo, gametypeId, mapId, start, perPage, cleanMinimumMatchesPlayed);
    }

    if(result === null){
        return {page, perPage, "data": [], "totalResults": 0}
    }

    return {page, perPage, "data": result.data, "totalResults": result.totalResults};

}