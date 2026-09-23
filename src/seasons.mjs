import { simpleQuery, sqlInsertOnDuplicateUpdate } from "./database.mjs";

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

    const query = `INSERT INTO nstats_seasons VALUES(NULL,?,?,?)`;

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

export async function calculateSeasonStats(seasonId){

    const [serverTotals, gametypeTotals, mapTotals] = await Promise.all([
        calculateSeasonObjectStats(seasonId, "servers"),
        calculateSeasonObjectStats(seasonId, "gametypes"),
        calculateSeasonObjectStats(seasonId, "maps"),
    ]);

    console.log(`SEASON ID = ${seasonId}`);
    
    return await Promise.all([
        updateSeasonUniqueCombinations(seasonId),
        updateSeasonObjectStats(seasonId, serverTotals, "servers"),
        updateSeasonObjectStats(seasonId, gametypeTotals, "gametypes"),
        updateSeasonObjectStats(seasonId, mapTotals, "maps"),
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