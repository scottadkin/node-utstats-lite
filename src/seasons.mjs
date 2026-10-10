import { ctfRecalculatePlayerTotals } from "./ctf.mjs";
import { ctfLeagueRecalculateSeason, refreshAllTables } from "./ctfLeague.mjs";
import { simpleQuery, sqlInsertOnDuplicateUpdate } from "./database.mjs";
import { getMapImageName, sanitizePagePerPage } from "./generic.mjs";
import { getMapImages, setMatchResultsMapImages } from "./maps.mjs";
import { calculateSeasonPlayerTotals } from "./players.mjs";
import { playerWeaponDamageRecalculateSeasonTotals } from "./playerWeaponDamage.mjs";
import { recalculateSeasonRankings } from "./rankings.mjs";
import { deleteAllMapWeaponsTotals, updatePlayerTotals as weaponsUpdatePlayerTotals } from "./weapons.mjs";

export const VALID_OBJECT_TYPES = {
        "gametypes": "gametype_id",
        "maps": "map_id",
        "servers": "server_id"
    };

export async function getSeasonByMatchDate(matchDate){

    const query = `SELECT * FROM nstats_seasons WHERE end_date >=? AND start_date <=? ORDER BY id ASC`;

    const result = await simpleQuery(query, [matchDate, matchDate]);

    if(result.length === 0) return null;

    return result[0];
}


/**
 * 
 * @param {Number} id 
 * @returns sql row, or null if no match found
 */
export async function getSeasonById(id){

    id = parseInt(id);

    if(id !== id) throw new Error(`id must be a valid integer`);

    const query = `SELECT * FROM nstats_seasons WHERE id=?`;

    const result =  await simpleQuery(query, [id]);

    if(result.length === 0) return null;

    return result[0];
}

export async function getAllSeasons(){

    const query = `SELECT * FROM nstats_seasons ORDER BY end_date DESC, start_date DESC`;

    const result = await simpleQuery(query);
    
    return result;
}



export async function seasonsGetMostPlayedMaps(seasonId, maxMaps){

    const DEFAULT_MAX_MAPS = 3;

    maxMaps = parseInt(maxMaps);
    if(maxMaps !== maxMaps) maxMaps = DEFAULT_MAX_MAPS;

    if(maxMaps < 1 || maxMaps > 10){
        maxMaps = DEFAULT_MAX_MAPS;
    }

    const mT = "nstats_seasons_unique_match_combinations";

    const query = `SELECT ${mT}.map_id,
    SUM(${mT}.matches) as total_matches, 
    SUM(${mT}.playtime) as total_playtime,
    nstats_maps.name
    FROM ${mT} 
    LEFT JOIN nstats_maps ON nstats_maps.id = ${mT}.map_id
     WHERE ${mT}.season_id=? GROUP BY ${mT}.map_id ORDER BY total_matches DESC LIMIT ?`;

    const result = await simpleQuery(query, [seasonId, maxMaps]);

    const mapNames = [];

    for(let i = 0; i < result.length; i++){

        const r = result[i];
        if(r.name !== null){
            mapNames.push(r.name);
        }
    }
    
    const mapImages = await getMapImages(mapNames);

    for(let i = 0; i < result.length; i++){

        const r = result[i];
        r.image = mapImages[r.name.toLowerCase()];
    }
    

    return result;
}

export async function getAllSeasonsMostPlayedMaps(seasonIds, maxMaps){

    if(seasonIds.length === 0) return {};

    const data = {};

    for(let i = 0; i < seasonIds.length; i++){

        const seasonId = seasonIds[i];

        data[seasonId] = await seasonsGetMostPlayedMaps(seasonId, maxMaps);
    }

    return data;
}

/**
 * 
 * @param {Boolean} bSkip0 ignore season 0(no season)
 */
export async function getAllSeasonIds(bSkip0){

    const query = `SELECT id FROM nstats_seasons`;

    const result = await simpleQuery(query);

    const ids = result.map((r) => r.id);

    if(!bSkip0) ids.push(0);

    return ids;
}

export async function getSeasonConflicts(startDate, endDate, ignoreSeasonId){

   /* if(currentStartDate <= startDate && currentEndDate >= startDate){
                console.log("START");
            }

            if(currentStartDate <= endDate && currentEndDate >= endDate){
                console.log("END");
            }*/

    //return simpleQuery(`SELECT * FROM nstats_seasons`);

    let query = `SELECT * FROM nstats_seasons WHERE `;

    const vars = [];
    if(ignoreSeasonId !== undefined){
        query += ` id != ? AND `;
        vars.push(ignoreSeasonId);
    }


    query += `((start_date<=? AND end_date>=?) OR (start_date<=? AND end_date>=?))`;

    vars.push(startDate, startDate, endDate, endDate);

    return await simpleQuery(query, vars);
}



async function bSeasonNameExists(name, ignoreSeasonId){

    let query = `SELECT COUNT(*) as total_rows FROM nstats_seasons WHERE name=?`;
    const vars = [name];

    if(ignoreSeasonId !== undefined){
        query += ` AND id !=?`;
        vars.push(ignoreSeasonId);
    }

    const result = await simpleQuery(query, vars);

    return result[0].total_rows !== 0;
}

export async function createSeason(name, startDate, endDate){

    if(name === "") throw new Error("Season name can't be an empty string.");
    if(startDate >= endDate) throw new Error(`StartDate is later than or equal to endDate.`);
    
    const conficts = await getSeasonConflicts(startDate, endDate);

    if(conficts.length > 0){


        return {
            "error": `Dates conflict with the following seasons:${conficts.map((c) =>{ return ` ${c.name}`})}.`,
            conficts
        };
    }


    const bNameAlreadyInUse = await bSeasonNameExists(name);

    if(bNameAlreadyInUse) return {"error": `There is already a season called ${name}`};

    const query = `INSERT INTO nstats_seasons VALUES(NULL,?,?,?,0,0,0)`;

    await simpleQuery(query, [startDate, endDate, name]);

    return {"message": "passed"}
}

export async function editSeason(seasonId, name, startDate, endDate){

    seasonId = parseInt(seasonId);
    if(seasonId !== seasonId) throw new Error(`seasonId must be valid integer`);
    if(name === "") throw new Error("Season name can't be an empty string.");
    if(startDate >= endDate) throw new Error(`StartDate is later than or equal to endDate.`);
    
    const conficts = await getSeasonConflicts(startDate, endDate, seasonId);

    if(conficts.length > 0){


        return {
            "error": `Dates conflict with the following seasons:${conficts.map((c) =>{ return ` ${c.name}`})}.`,
            conficts
        };
    }


    const bNameAlreadyInUse = await bSeasonNameExists(name, seasonId);

    if(bNameAlreadyInUse) return {"error": `There is already a season called ${name}`};

    //const query = `INSERT INTO nstats_seasons VALUES(NULL,?,?,?,0,0,0)`;
    const query = `UPDATE nstats_seasons SET name=?,start_date=?,end_date=? WHERE id=?`;

    await simpleQuery(query, [name, startDate, endDate, seasonId]);

    return {"message": "passed"}
}


export async function getSeasonMatchesData(seasonId){

    const query = `SELECT * FROM nstats_matches WHERE season_id=? ORDER BY date DESC, id DESC`;

    return await simpleQuery(query,[seasonId]);
}

/**
 * 
 * @param {Number} seasonId 
 * @param {String} objectName gametypes,servers,maps
 */
async function calculateSeasonObjectStats(seasonId, objectName){


    if(VALID_OBJECT_TYPES[objectName] === undefined) throw new Error(`Not a valid object for calculate object stats`);

    const targetCol = VALID_OBJECT_TYPES[objectName];


    const query = `SELECT ${targetCol} as target_id,
    COUNT(*) as total_matches,
    SUM(playtime) as total_playtime,
    MIN(date) as first_match,
    MAX(date) as last_match FROM nstats_matches WHERE season_id=? GROUP BY target_id`;

    return await simpleQuery(query, [seasonId]);

}


async function updateSeasonObjectStats(seasonId, data, objectName){

    if(VALID_OBJECT_TYPES[objectName] === undefined) throw new Error(`Not a valid object for calculate object stats`);

    const targetCol = VALID_OBJECT_TYPES[objectName];

    const insertVars = data.map((d) =>{

        return [seasonId, d.target_id, d.total_matches, d.total_playtime, d.first_match, d.last_match]
    });

    const columns = ["season_id", targetCol, "matches", "playtime", "first_match", "last_match"];
    const conflicts = ["season_id",targetCol];

    await sqlInsertOnDuplicateUpdate(`nstats_seasons_${objectName}`, columns, insertVars, conflicts);
}


async function calculateSeasonUniqueCombinations(seasonId){

    seasonId = parseInt(seasonId);
    if(seasonId !== seasonId) throw new Error(`SeasonId must be a valid integer`);

    let where = ``;
    const vars = [];

    if(seasonId !== 0){
        where = `WHERE season_id=?`;
        vars.push(seasonId);
    }

    const query = `SELECT server_id,gametype_id,map_id,SUM(playtime) as total_playtime,
    COUNT(*) as total_matches,
    MAX(date) as last_match,
    MIN(date) as first_match 
    FROM nstats_matches ${where} GROUP BY server_id,gametype_id,map_id`;

    return await simpleQuery(query, vars);
}

export async function updateSeasonUniqueCombinations(seasonId){

    
    const totals = await calculateSeasonUniqueCombinations(seasonId);

    const insertVars = totals.map((t) =>{

        return [
            seasonId,
            t.server_id,
            t.gametype_id,
            t.map_id,
            t.total_matches,
            t.total_playtime,
            t.first_match,
            t.last_match
        ];
    });


    const columns = ["season_id", "server_id", "gametype_id", "map_id", "matches", "playtime", "first_match", "last_match"];
    const conflicts = ["season_id","server_id","gametype_id", "map_id"];

    await sqlInsertOnDuplicateUpdate("nstats_seasons_unique_match_combinations", columns, insertVars, conflicts);

    
}


async function calculateSeasonBasicTotals(seasonId){

    const query = `SELECT COUNT(*) as total_matches,SUM(playtime) as total_playtime FROM nstats_matches WHERE season_id=?`;

    const result = await simpleQuery(query, [seasonId]);

    if(result.length === 0) return null;

    const totalPlayers = await getSeasonTotalPlayers(seasonId);

    result[0].total_players = totalPlayers;

    return result[0];
}

async function updateSeasonBasicTotals(seasonId, data){

    const query = `UPDATE nstats_seasons SET total_matches=?, total_playtime=?, total_players=? WHERE id=?`;

    await simpleQuery(query, [data.total_matches, data.total_playtime, data.total_players, seasonId]);
}

async function getSeasonTotalPlayers(seasonId){

    const query = `SELECT COUNT(*) as total_players FROM nstats_player_totals WHERE season_id=? AND gametype_id=0 AND map_id=0`;

    const result = await simpleQuery(query, [seasonId]);

    if(result.length === 0) return 0;

    return result[0].total_players;
}

/**
 * Update basic stats such as unique match combinations, gametype + map totals
 * @param {*} seasonId 
 * @returns 
 */
export async function calculateSeasonStats(seasonId){

    const basicTotals = await calculateSeasonBasicTotals(seasonId);
    

    if(basicTotals === null) throw new Error(`No season data found`);


    const [serverTotals, gametypeTotals, mapTotals] = await Promise.all([
        calculateSeasonObjectStats(seasonId, "servers"),
        calculateSeasonObjectStats(seasonId, "gametypes"),
        calculateSeasonObjectStats(seasonId, "maps"),
    ]);
    
    return await Promise.all([
        updateSeasonUniqueCombinations(seasonId),
        updateSeasonObjectStats(seasonId, serverTotals, "servers"),
        updateSeasonObjectStats(seasonId, gametypeTotals, "gametypes"),
        updateSeasonObjectStats(seasonId, mapTotals, "maps"),
        updateSeasonBasicTotals(seasonId, basicTotals)
    ]);
}


async function getSeasonObjectStats(seasonId, type){

    if(VALID_OBJECT_TYPES[type] === undefined) throw new Error(`Not a valid type for getSeasonObjectStats`);

    const seasonTable = `nstats_seasons_${type}`
    let joinTable = ``;
    let joinColumn = ``;

    if(type === "servers"){

        joinTable = "nstats_servers";
        joinColumn = "server_id";

    }else if(type === "maps"){

        joinTable = "nstats_maps";
        joinColumn = "map_id";

    }else if(type === "gametypes"){

        joinTable = "nstats_gametypes";
        joinColumn = "gametype_id";

    }else{

        throw new Error(`missing option`);
    }

    const query = `SELECT ${seasonTable}.*,${joinTable}.name as object_name FROM nstats_seasons_${type} 
    LEFT JOIN ${joinTable} on ${seasonTable}.${joinColumn} = ${joinTable}.id
    WHERE season_id=? ORDER BY matches DESC`;

    return await simpleQuery(query, [seasonId]);
}


export async function getSeasonBasicObjectStats(seasonId){

    seasonId = parseInt(seasonId);

    if(seasonId !== seasonId) throw new Error(`SeasonId must be a valid integer`);

    const [servers, gametypes, maps] = await Promise.all([
        getSeasonObjectStats(seasonId, "servers"),
        getSeasonObjectStats(seasonId, "gametypes"),
        getSeasonObjectStats(seasonId, "maps"),
    ]);

    return {servers, gametypes, maps}
}


export async function getSeasonUniqueMatchCombinations(seasonId){

    seasonId = parseInt(seasonId);

    if(seasonId !== seasonId) throw new Error(`SeasonId must be a valid integer`);

    const mT = `nstats_seasons_unique_match_combinations`;

    let where = ``;
    const vars = [];

    if(seasonId !== 0){
        where =`WHERE ${mT}.season_id=?`;
        vars.push(seasonId);
    }

    const query = `SELECT ${mT}.*,
    nstats_servers.name as server_name,
    nstats_gametypes.name as gametype_name,
    nstats_maps.name as map_name
    FROM ${mT}
    LEFT JOIN nstats_servers ON nstats_servers.id = ${mT}.server_id
    LEFT JOIN nstats_gametypes ON nstats_gametypes.id = ${mT}.gametype_id
    LEFT JOIN nstats_maps ON nstats_maps.id = ${mT}.map_id
    ${where} ORDER BY map_name ASC`;

   
    return await simpleQuery(query, vars);
   
}


function setSearchWhereAndVars(serverId, gametypeId, mapId){

    let where = ``;
    const vars = [];

    if(serverId !== 0){
        where += ` AND server_id=?`;
        vars.push(serverId);
    }

    if(gametypeId !== 0){
        where += ` AND gametype_id=?`;
        vars.push(gametypeId);
    }

    if(mapId !== 0){
        where += ` AND map_id=?`;
        vars.push(mapId);
    }


    return {where, vars}
    
}

async function getTotalPossibleMatches(seasonId, serverId, gametypeId, mapId){

    const {where, vars} = setSearchWhereAndVars(serverId, gametypeId, mapId);

    vars.unshift(seasonId);
    const query = `SELECT COUNT(*) as total_matches FROM nstats_matches WHERE season_id=?${where}`;


    const result = await simpleQuery(query, vars);


    return result[0].total_matches;

}

export async function searchSeasonMatches(seasonId, serverId, gametypeId, mapId, dirtyPage, dirtyPerPage){

    serverId = parseInt(serverId);
    if(serverId !== serverId) throw new Error(`ServerId must be a valid integer`);

    gametypeId = parseInt(gametypeId);
    if(gametypeId !== gametypeId) throw new Error(`gametypeId must be a valid integer`);

    mapId = parseInt(mapId);
    if(mapId !== mapId) throw new Error(`mapId must be a valid integer`);

    const [page, perPage, start] = sanitizePagePerPage(dirtyPage, dirtyPerPage);

    const {where, vars} = setSearchWhereAndVars(serverId, gametypeId, mapId);

    vars.unshift(seasonId);

    const query = `SELECT nstats_matches.id,
    gametype_id,
    nstats_gametypes.name as gametype_name,
    map_id,
    nstats_maps.name as map_name,
    date,
    nstats_matches.playtime,
    players,
    total_teams,
    team_0_score,
    team_1_score,
    team_2_score,
    team_3_score,
    solo_winner,
    solo_winner_score,
    IF(solo_winner != 0, nstats_players.name, '') as solo_winner_name,
    IF(solo_winner != 0, nstats_players.country, '') as solo_winner_country
    
    FROM nstats_matches 
    LEFT JOIN nstats_players ON nstats_players.id = solo_winner
    LEFT JOIN nstats_gametypes ON nstats_gametypes.id = gametype_id
    LEFT JOIN nstats_maps ON nstats_maps.id = map_id
    WHERE season_id=? ${where} ORDER BY date DESC, nstats_matches.id DESC LIMIT ?, ?`;


    vars.push(start, perPage);
    

    const [result, totalResults] = await  Promise.all([
        simpleQuery(query, vars), 
        getTotalPossibleMatches(seasonId, serverId, gametypeId, mapId)
    ]);
    

    await setMatchResultsMapImages(result);



    return {"data": result, totalResults};
}


export async function seasonGetAllGametypeIds(seasonId){

    const query = `SELECT DISTINCT gametype_id FROM nstats_seasons_gametypes WHERE season_id=?`;

    const result = await simpleQuery(query, [seasonId]);
    
    return result.map((r) =>{
        return r.gametype_id
    });
}

export async function seasonGetAllMapIds(seasonId){

    const query = `SELECT DISTINCT map_id FROM nstats_seasons_maps WHERE season_id=?`;

    const result = await simpleQuery(query, [seasonId]);
    
    return result.map((r) =>{
        return r.map_id
    });
}


export async function seasonGetAllMapNames(seasonId){

    const query = `SELECT DISTINCT nstats_seasons_maps.map_id, nstats_maps.name FROM nstats_seasons_maps 
    LEFT JOIN nstats_maps ON nstats_maps.id = nstats_seasons_maps.map_id
    WHERE nstats_seasons_maps.season_id=?`;


    const result = await simpleQuery(query, [seasonId]);

    const data = {};
    for(let i = 0; i < result.length; i++){

        const r = result[i];

        data[r.map_id] = r.name;
    }
    return data;
}

export async function seasonGetAllGametypeNames(seasonId){

    const query = `SELECT DISTINCT nstats_seasons_gametypes.gametype_id, nstats_gametypes.name FROM nstats_seasons_gametypes
    LEFT JOIN nstats_gametypes ON nstats_gametypes.id = nstats_seasons_gametypes.gametype_id
    WHERE nstats_seasons_gametypes.season_id=?`;


    const result = await simpleQuery(query, [seasonId]);

    const data = {};
    
    for(let i = 0; i < result.length; i++){

        const r = result[i];

        data[r.gametype_id] = r.name;
    }

    return data;
}


async function deleteAllPlayerSeasonData(seasonId){

    const tables = [
        
        "nstats_player_totals_max", 
        "nstats_player_totals_weapons", 
        "nstats_player_totals_ctf",
        "nstats_totals_player_weapon_damage",
        "nstats_player_ctf_league",
        "nstats_rankings",
        "nstats_map_rankings",
        "nstats_player_totals",
        
    ];

    for(let i = 0; i < tables.length; i++){

        const t = tables[i];
    
        const query = `DELETE FROM ${t} WHERE season_id=?`;

        await simpleQuery(query, [seasonId]);
    }
}


async function deleteSeasonUniqueMatchCombinations(seasonId){

    const query = `DELETE FROM nstats_seasons_unique_match_combinations WHERE season_id=?`;

    return await simpleQuery(query, [seasonId]);
}

async function deleteSeasonObjectStats(seasonId){

    const tables = [
        "nstats_seasons_servers",
        "nstats_seasons_gametypes",
        "nstats_seasons_maps",
    ];

    for(let i = 0; i < tables.length; i++){

        const t = tables[i];

        const query = `DELETE FROM ${t} WHERE season_id=?`;
        await simpleQuery(query, [seasonId]);
    }
}



async function replaceMatchesSeasonId(find, replace){

    const query = `UPDATE nstats_matches SET season_id=? WHERE season_id=?`;

    return await simpleQuery(query, [replace, find]);
}

export async function deleteSeason(seasonId){

    seasonId = parseInt(seasonId);
    if(seasonId !== seasonId) throw new Error(`seasonId must be a valid integer.`);
    if(seasonId === 0) throw new Error(`You can not delete season 0.`);

    await deleteAllPlayerSeasonData(seasonId);
    await deleteSeasonUniqueMatchCombinations(seasonId);
    await deleteSeasonObjectStats(seasonId);
    await deleteAllMapWeaponsTotals(seasonId);
    await replaceMatchesSeasonId(seasonId, 0);

    await simpleQuery(`DELETE FROM nstats_seasons WHERE id=?`, [seasonId]);

    return {"message": "passed"};
}


async function recalculateSeasonPlayerTotals(seasonId){

    await calculateSeasonPlayerTotals(seasonId);
    await ctfRecalculatePlayerTotals(seasonId);
    await weaponsUpdatePlayerTotals(null, seasonId)

    await playerWeaponDamageRecalculateSeasonTotals(seasonId);
    /*
    TODO:
    X nstats_player_totals
    X nstats_player_totals_max
    X nstats_player_totals_weapons
    X nstats_player_totals_ctf
    X nstats_rankings
    X nstats_map_weapon_totals
    X nstats_map_rankings
    - nstats_player_ctf_league
    X nstats_totals_player_weapon_damage
    X nstats_seasons_servers
    X nstats_seasons_gametypes
    X nstats_seasons_maps
    X nstats_seasons_unique_match_combinations
    */
}

export async function recalculateSeason(seasonId){

    seasonId = parseInt(seasonId);
    if(seasonId !== seasonId) throw new Error(`seasonId must be a valid integer.`);
    if(seasonId === 0) throw new Error(`You can not delete season 0.`);


    await deleteSeasonUniqueMatchCombinations(seasonId);
    await deleteSeasonObjectStats(seasonId);
    await calculateSeasonStats(seasonId);

    await deleteAllPlayerSeasonData(seasonId);
    
    await deleteAllMapWeaponsTotals(seasonId);


    await recalculateSeasonPlayerTotals(seasonId);
    await ctfLeagueRecalculateSeason(seasonId),
    await recalculateSeasonRankings(seasonId);
    
}

export async function seasonsDeleteGametypeStats(gametypeId){

    const vars = [gametypeId];

    const gametypeQuery = `DELETE FROM nstats_seasons_gametypes WHERE gametype_id=?`;

    const comboQuery = `DELETE FROM nstats_seasons_unique_match_combinations WHERE gametype_id=?`;

    return await Promise.all([
        simpleQuery(comboQuery, vars),
        simpleQuery(gametypeQuery, vars),
        
    ]);
}

export async function seasonsDeleteMapStats(mapId){

    const vars = [mapId];

    const mapQuery = `DELETE FROM nstats_seasons_maps WHERE map_id=?`;

    const comboQuery = `DELETE FROM nstats_seasons_unique_match_combinations WHERE map_id=?`;

    return await Promise.all([
        simpleQuery(comboQuery, vars),
        simpleQuery(mapQuery, vars),
    ]);
}