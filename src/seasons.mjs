import { simpleQuery, sqlInsertOnDuplicateUpdate } from "./database.mjs";
import { sanitizePagePerPage } from "./generic.mjs";
import { setMatchResultsMapImages } from "./maps.mjs";

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

async function getSeasonConflicts(startDate, endDate){


    const query = `SELECT * FROM nstats_seasons WHERE 
    (start_date>=? AND start_date<=?) OR (end_date>=? AND end_date<=?)`;


    return await simpleQuery(query, [startDate, endDate, startDate, endDate]);
}


async function bSeasonNameExists(name){

    const query = `SELECT COUNT(*) as total_rows FROM nstats_seasons WHERE name=?`;

    const result = await simpleQuery(query, [name]);

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
        //throw new Error(`Dates conflict with the following seasons:${conficts.map((c) =>{ return ` ${c.name}`})}.`);
    }


    const bNameAlreadyInUse = await bSeasonNameExists(name);

    if(bNameAlreadyInUse) return {"error": `There is already a season called ${name}`};

    const query = `INSERT INTO nstats_seasons VALUES(NULL,?,?,?,0,0,0)`;

    await simpleQuery(query, [startDate, endDate, name]);

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

    const query = `SELECT server_id,gametype_id,map_id,SUM(playtime) as total_playtime,
    COUNT(*) as total_matches,
    MAX(date) as last_match,
    MIN(date) as first_match 
    FROM nstats_matches WHERE season_id=? GROUP BY server_id,gametype_id,map_id`;

    return await simpleQuery(query, [seasonId]);
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

    const query = `SELECT ${mT}.*,
    nstats_servers.name as server_name,
    nstats_gametypes.name as gametype_name,
    nstats_maps.name as map_name
    FROM ${mT}
    LEFT JOIN nstats_servers ON nstats_servers.id = ${mT}.server_id
    LEFT JOIN nstats_gametypes ON nstats_gametypes.id = ${mT}.gametype_id
    LEFT JOIN nstats_maps ON nstats_maps.id = ${mT}.map_id
    WHERE ${mT}.season_id=? ORDER BY map_name ASC`;

   
    return await simpleQuery(query, [seasonId]);
   
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