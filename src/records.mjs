import { simpleQuery } from "./database.mjs";
import { getBasicPlayerInfo } from "./players.mjs";
import { getBasicMatchesInfo } from "./matches.mjs";
import { sanitizePagePerPage } from "./generic.mjs";
import { VALID_PLAYER_MATCH_TYPES, VALID_PLAYER_LIFETIME_TYPES, getRecordTypeInfo } from "./validRecordTypes.mjs";

function bValidPlayerMatchType(type){

    type = type.toLowerCase();

    for(let i = 0; i < VALID_PLAYER_MATCH_TYPES.length; i++){

        const v = VALID_PLAYER_MATCH_TYPES[i];

        if(v.value === type) return true;
    }

    return false;

}

function bValidPlayerLifetimeType(type){

    type = type.toLowerCase();

    for(let i = 0; i < VALID_PLAYER_LIFETIME_TYPES.length; i++){

        const v = VALID_PLAYER_LIFETIME_TYPES[i];
        
        if(v.value === type) return true;
    }

    return false;

}

async function getTotalPlayerMatchRecords(recordType, gametypeId, mapId){

    recordType = recordType.toLowerCase();

    //just incase im stupid and export this function at a later point
    if(!bValidPlayerMatchType(recordType)) throw new Error(`Not a valid player match record type`);

    gametypeId = parseInt(gametypeId);
    if(gametypeId !== gametypeId) gametypeId = 0;

    mapId = parseInt(mapId);
    if(mapId !== mapId) mapId = 0;

    const query = `SELECT COUNT(*) as total_rows FROM nstats_player_totals_max WHERE gametype_id=? AND map_id=? AND ${recordType}!=0`;

    const vars = [gametypeId, mapId];

    const result = await simpleQuery(query, vars);
    
    return result[0].total_rows;
}


async function getTotalPlayerMatchCTFRecords(recordType, gametypeId, mapId){

    //just incase im stupid and export this function at a later point
    if(!bValidPlayerMatchType(recordType)) throw new Error(`Not a valid player match record.(CTF)`);

    const query = `SELECT COUNT(*) as total_rows FROM nstats_player_totals_ctf WHERE nstats_player_totals_ctf.${recordType}!=0 AND gametype_id=? AND map_id=?`;

    const result = await simpleQuery(query, [gametypeId, mapId]);

    return result[0].total_rows;
}

async function getPlayerMatchCTFRecords(recordType, gametypeId, mapId, start, end){

    //just incase im stupid and export this function at a later point
    if(!bValidPlayerMatchType(recordType)) throw new Error(`Not a valid player match record.(CTF)`);

    start = parseInt(start);
    end = parseInt(end);

    if(start !== start || end !== end) throw new Error(`Not a valid start or end`);

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
    ${cT}.${recordType} as record_value
    FROM ${cT} 
    LEFT JOIN ${nameT} ON ${cT}.player_id = ${nameT}.id
    LEFT JOIN ${tT} ON ${cT}.player_id = ${tT}.player_id AND ${cT}.gametype_id = ${tT}.gametype_id AND ${cT}.map_id = ${tT}.map_id
    WHERE ${cT}.gametype_id=? AND ${cT}.map_id=? AND record_value!=0 ORDER BY ${cT}.${recordType} DESC LIMIT ${start}, ${end}`;


    const [result, totalResults] = await Promise.all([simpleQuery(query, [gametypeId, mapId]), getTotalPlayerMatchCTFRecords(recordType, gametypeId, mapId)]);

    return {"data": result, totalResults}
}


export async function getPlayerMatchRecords(recordType, gametypeId, mapId, dirtyPage, dirtyPerPage){

    recordType = recordType.toLowerCase();

    //if(!bValidPlayerMatchType(recordType)) throw new Error(`Not a valid player match record type`);

    const recordInfo = getRecordTypeInfo("player-match", recordType);

    if(recordInfo === null) throw new Error(`Not a valid player match record type`);


    const [page, perPage, start] = sanitizePagePerPage(dirtyPage, dirtyPerPage);


    if(recordInfo.group === "CTF"){

        return await getPlayerMatchCTFRecords(recordType, gametypeId, mapId, start, perPage);
    }

    const nameT = "nstats_players";
    const mT = "nstats_player_totals_max";
    const pT = "nstats_player_totals";

    const query = `SELECT ${mT}.player_id,
    ${mT}.${recordType} as record_value,
    ${pT}.last_active,
    ${pT}.playtime,
    ${pT}.total_matches,
    ${nameT}.name as player_name,
    ${nameT}.country as country
    FROM ${mT} 
    LEFT JOIN ${nameT} ON ${mT}.player_id = ${nameT}.id
    LEFT JOIN ${pT} ON ${mT}.player_id = ${pT}.player_id AND ${mT}.gametype_id = ${pT}.gametype_id AND ${mT}.map_id = ${pT}.map_id

    WHERE ${mT}.gametype_id=? AND ${mT}.map_id=? AND record_value !=0 ORDER BY record_value DESC LIMIT ${start}, ${perPage}`;

    const [data, totalResults] = await Promise.all([
        simpleQuery(query, [gametypeId, mapId]), 
        getTotalPlayerMatchRecords(recordType, gametypeId, mapId)
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

async function getTotalPlayerLifetimeRecords(recordType, gametypeId, mapId, bCTF){

    //just in case im stupid and export this function in future
    if(!bValidPlayerLifetimeType(recordType)) throw new Error(`Not a valid player lifetime record`);

    recordType = recordType.toLowerCase();

    const table = (bCTF) ? "nstats_player_totals_ctf" : "nstats_player_totals";

    const query = `SELECT COUNT(*) as total_rows FROM ${table} WHERE gametype_id=? AND map_id=? AND ${recordType}!=0`;

    const result = await simpleQuery(query, [gametypeId, mapId]);

    return result[0].total_rows;
}

async function getPlayerLifetimeCTFRecords(recordType, gametypeId, mapId, start, cleanPerPage){

    recordType = recordType.toLowerCase();

    if(!bValidPlayerLifetimeType(recordType)) throw new Error(`Not a valid player ctf lifetime record type`);


    const nameT = "nstats_players";
    const tT = "nstats_player_totals";
    const cT = "nstats_player_totals_ctf";

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
    LEFT JOIN ${tT} ON ${cT}.player_id = ${tT}.player_id AND ${cT}.gametype_id = ${tT}.gametype_id AND ${cT}.map_id = ${tT}.map_id
    WHERE ${cT}.gametype_id=? AND ${cT}.map_id=? AND record_value!=0 ORDER BY record_value DESC LIMIT ${start}, ${cleanPerPage}`;

    const [data, totalResults] = await Promise.all([
        simpleQuery(query, [gametypeId, mapId]), 
        getTotalPlayerLifetimeRecords(recordType, gametypeId, mapId, true)
    ]);

    return {data, totalResults}
}

export async function getPlayerLifetimeRecords(recordType, gametypeId, mapId, dirtyPage, dirtyPerPage){

    recordType = recordType.toLowerCase();

    const recordInfo = getRecordTypeInfo("player-lifetime", recordType);

    if(recordInfo === null) throw new Error(`Not a valid player lifetime record type`);

    const [page, perPage, start] = sanitizePagePerPage(dirtyPage, dirtyPerPage);

    gametypeId = parseInt(gametypeId);
    if(gametypeId !== gametypeId) throw new Error("GametypeId must be a valid integer");

    mapId = parseInt(mapId);
    if(mapId !== mapId) throw new Error("MapId must be a valid integer");

    if(recordInfo.group === "CTF"){

        return await getPlayerLifetimeCTFRecords(recordInfo.value, gametypeId, mapId, start, perPage);
    }

    const nameT = "nstats_players";
    const tT = "nstats_player_totals";

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
    WHERE ${tT}.gametype_id=? AND ${tT}.map_id=? AND record_value!=0
    ORDER BY record_value DESC LIMIT ${start}, ${perPage}`;

    const [data, totalResults] = await Promise.all([
        simpleQuery(query, [gametypeId, mapId]), 
        getTotalPlayerLifetimeRecords(recordType, gametypeId, mapId, false)
    ]);

    return {data, totalResults};
}