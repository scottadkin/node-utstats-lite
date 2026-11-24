
import { ctfLeagueRecalculateSeasonAllTables, getLeagueSiteSettings} from "./ctfLeague.mjs";
import { bulkUpdate, simpleQuery, sqlInsertOnDuplicateUpdate } from "./database.mjs";
import {  getMonthName, sanitizePagePerPage } from "./generic.mjs";
import { getMapImages, setMatchResultsMapImages } from "./maps.mjs";
import { updateAllPlayerTotalsSingleSeason } from "./players.mjs";
import { playerWeaponDamageRecalculateSeasonTotals } from "./playerWeaponDamage.mjs";
import { recalculateSeasonRankings } from "./rankings.mjs";
import { deleteAllMapWeaponsTotals, updatePlayerTotals as weaponsUpdatePlayerTotals } from "./weapons.mjs";
import Message from "./message.mjs";


const DEFAULT_SEASONS_SETTINGS = [
    {"name": "Automatic Seasons", "type": "bool", "value": "false"},
    {"name": "Automatic Seasons Timeframe", "type": "text", "value": "YEAR"},
];

export const SEASON_TIMEFRAME_OPTIONS = [
    {"name": "Yearly", "value": "YEAR"},
    {"name": "Monthly", "value": "MONTH"},
    {"name": "Weekly", "value": "WEEK"},
];

export const VALID_OBJECT_TYPES = {
    "gametypes": "gametype_id",
    "maps": "map_id",
    "servers": "server_id"
};


async function bSettingExist(name){

    const query = `SELECT COUNT(*) as total_rows from nstats_seasons_settings WHERE name=?`;

    const result = await simpleQuery(query, [name]);

    return result[0].total_rows > 0;
}

export async function insertSeasonsSettings(){

    for(let i = 0; i < DEFAULT_SEASONS_SETTINGS.length; i++){

        const s = DEFAULT_SEASONS_SETTINGS[i];

        if(!await bSettingExist(s.name)){

            await simpleQuery(`INSERT INTO nstats_seasons_settings VALUES(NULL,?,?,?)`, [s.name, s.type, s.value]);
        }
    }
}

export async function getSeasonsSettings(){

    const query = `SELECT * FROM nstats_seasons_settings ORDER BY name ASC`;

    const result = await simpleQuery(query);

    const obj = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        obj[r.name] = r;
    }

    return obj;
}


export async function saveSeasonsSettings(changes){

    const query = `UPDATE nstats_seasons_settings SET value=? WHERE id=?`;

    for(let i = 0; i < changes.length; i++){

        const {value, id} = changes[i];

        await simpleQuery(query, [value, id]);
    }
}

export async function getSeasonByMatchDate(matchDate){

    const query = `SELECT * FROM nstats_seasons WHERE end_date >=? AND start_date <=? ORDER BY id ASC`;

    const result = await simpleQuery(query, [matchDate, matchDate]);

    if(result.length === 0) return null;

    return result[0];
}


async function getSeason0Stats(){

    const query = `SELECT COUNT(*) as total_matches,SUM(playtime) as total_playtime,MIN(date) as first_match, MAX(date) as last_match FROM nstats_matches`;
    const playerQuery = `SELECT COUNT(*) as total_players FROM nstats_players`;


    const [matchesResult, playerResult] = await Promise.all([
        await simpleQuery(query),
        simpleQuery(playerQuery),

    ]);


    return {
        "name": "All Time Totals",
        "id": 0,
        "start_date": null,
        "end_date": null,
        "total_matches": matchesResult[0].total_matches,
        "total_playtime": matchesResult[0].total_playtime,
        "total_players": playerResult[0].total_players,
    }
}

/**
 * 
 * @param {Number} id 
 * @returns sql row, or null if no match found
 */
export async function getSeasonById(id){

    id = parseInt(id);

    if(id !== id) throw new Error(`id must be a valid integer`);

    if(id === 0){

        return await getSeason0Stats();

    }

    const query = `SELECT * FROM nstats_seasons WHERE id=?`;

    const result =  await simpleQuery(query, [id]);

    if(result.length === 0) return null;

    return result[0];
}


export async function getSeasonByName(name){

    const query = `SELECT * FROM nstats_seasons WHERE name=?`;

    const result =  await simpleQuery(query, [name]);

    if(result.length === 0) return null;

    return result[0];
}

export async function getAllSeasons(){

    const query = `SELECT s.id,
    s.start_date,
    s.end_date,
    s.name,
    COALESCE(uc.matches, 0) as total_matches,
    COALESCE(uc.playtime, 0) as total_playtime 
    FROM nstats_seasons as s 
    LEFT JOIN nstats_seasons_unique_match_combinations as uc ON uc.season_id=s.id AND uc.server_id=0 AND uc.gametype_id=0 AND uc.map_id=0 
    ORDER BY end_date DESC, start_date DESC`;

    const result = await simpleQuery(query);
    
    return result;
}



export async function seasonsGetMostPlayedMaps(seasonId, maxMaps){

    const DEFAULT_MAX_MAPS = 3;

    maxMaps = parseInt(maxMaps);
    if(maxMaps !== maxMaps) maxMaps = DEFAULT_MAX_MAPS;

    //if(maxMaps < 1 || maxMaps > 10){
     //   maxMaps = DEFAULT_MAX_MAPS;
    //}

    const mT = "nstats_seasons_unique_match_combinations";

    const query = `SELECT ${mT}.map_id,
    SUM(${mT}.matches) as total_matches, 
    SUM(${mT}.playtime) as total_playtime,
    MIN(${mT}.first_match) as first_match,
    MAX(${mT}.last_match) as last_match,
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


    let query = `SELECT * FROM nstats_seasons WHERE `;

    const vars = [];
    if(ignoreSeasonId !== undefined){
        query += ` id != ? AND `;
        vars.push(ignoreSeasonId);
    }


    query += `(
    (? BETWEEN start_date AND end_date OR ? BETWEEN start_date AND end_date)`

    query += ` OR (start_date >=? AND end_date <=?)  
    )`


    vars.push(startDate, endDate, startDate, endDate);

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

    const query = `INSERT INTO nstats_seasons VALUES(NULL,?,?,?)`;

    await simpleQuery(query, [startDate, endDate, name]);

    const seasonInfo = await getSeasonByName(name);
    if(seasonInfo === null) throw new Error(`Failed to get season data`);
    await recalculateSeason(seasonInfo.id);
    //2.10.0 preview 5
    //must be called as recalculate season itself doesnt calculate this
    await updateUniqueMatchCominationsPlayerCount();

    return {"message": "passed"}
}

export async function createAutomaticSeason(matchDate, seasonsSettings){

    const date = new Date(matchDate);
    const year = date.getFullYear();
  
    const month = date.getMonth();

    const startOfyear = new Date(Date.UTC(year, 0, 1));

    const day = 60 * 60 * 24 * 1000;

    const dayOfYear = Math.floor((date - startOfyear) / day);

    const weekOfYear = Math.floor(dayOfYear / 7);

    const autoType = seasonsSettings["Automatic Seasons Timeframe"].value;

    let startDate = 0;
    let endDate = 0;

    let name = ``;

    if(autoType === "year"){
   
        name = year.toString();
        startDate = new Date(Date.UTC(year));
        endDate = new Date(Date.UTC(year + 1) - 1)
        
    }else if(autoType === "month"){
        
        name = `${getMonthName(month, true)} ${year}`;

        startDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
        endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
        
    }else if(autoType === "week"){
        
        name = `Week ${weekOfYear} of ${year}`;

        const week = day * 7;

        startDate = new Date(Date.UTC(year) + weekOfYear * week);
        endDate = new Date(Date.UTC(year) + (weekOfYear + 1) * week);
        
    }else{
        throw new Error(`unknown automatch seasons timeframe value`);
    }

    const query = `INSERT INTO nstats_seasons VALUES(NULL,?,?,?)`;

    await simpleQuery(query, [startDate, endDate, name]);

    const seasonInfo = await getSeasonByName(name);

    if(seasonInfo === null) throw new Error(`Failed to get newly created season`);

    return seasonInfo;
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

    await recalculateSeason(seasonId);

    //2.10.0 preview 5
    //must be called as recalculate season itself doesnt calculate this
    await updateUniqueMatchCominationsPlayerCount();

    return {"message": "passed"}
}


export async function getSeasonMatchesData(seasonId){

    const query = `SELECT * FROM nstats_matches WHERE season_id=? ORDER BY date DESC, id DESC`;

    return await simpleQuery(query,[seasonId]);
}



function createTotalsQuery(seasonId, bGroupServers, bGroupGametypes, bGroupMaps){


    let groupBy = ``;

    if(bGroupServers || bGroupGametypes || bGroupMaps){

        groupBy = `GROUP BY `;
        let bAddComma = false;

        if(bGroupServers){
            groupBy += `server_id`;
            bAddComma = true;
        }

        if(bGroupGametypes){
            if(bAddComma) groupBy += `, `;
            groupBy += `gametype_id`
            bAddComma = true;
        }

        if(bGroupMaps){
            if(bAddComma) groupBy += `, `;
            groupBy += `map_id`;
            bAddComma = true;
        }
    }


    return `SELECT 
    ${seasonId} as season_id,
    ${(bGroupServers) ? "server_id" : "0 as server_id"},
    ${(bGroupGametypes) ? "gametype_id" : "0 as gametype_id"},
    ${(bGroupMaps) ? "map_id" : "0 as map_id"},
    COALESCE(SUM(total_matches), 0) as total_matches, 
    COALESCE(SUM(total_playtime), 0) as total_playtime, 
    COALESCE(MIN(first_match), '1999-11-30T00:00:00.000Z') as first_match, 
    COALESCE(MAX(last_match), '1999-11-30T00:00:00.000Z') as last_match 
    FROM combo_totals
    ${groupBy}`;
}



function getTotalPlayersQuery(bGroupSeasons, bGroupServers, bGroupGametypes, bGroupMaps){

    let groupBy = ``;

    if(bGroupSeasons){
        groupBy = `season_id`;
    }

    if(bGroupServers){

        if(groupBy !== "") groupBy += `,`
        groupBy += `server_id`;
    }

    if(bGroupGametypes){
        if(groupBy !== "") groupBy += `,`;
        groupBy += `gametype_id`;
    }

    if(bGroupMaps){
        if(groupBy !== "") groupBy += `,`;
        groupBy += `map_id`
    }

    if(groupBy !== "") groupBy = `GROUP BY ${groupBy}`;

    return `SELECT 
    ${(bGroupSeasons) ? "season_id" : "0 as season_id"},
    ${(bGroupServers) ? "server_id" : "0 as server_id"},
    ${(bGroupGametypes) ? "gametype_id" : "0 as gametype_id"},
    ${(bGroupMaps) ? "map_id" : "0 as map_id"},
    COUNT(DISTINCT player_id) as total_players 
    FROM match_rows 
    ${groupBy}`;

}


/** this is really slow and probably really poorly done
 * Update all time, every seasons, server, gametype, map combinations player counts
 */
export async function updateUniqueMatchCominationsPlayerCount(){

    const query = `
    WITH match_rows AS MATERIALIZED (
        SELECT DISTINCT
        m.season_id,
        m.server_id,
        m.gametype_id,
        m.map_id,
        p.player_id FROM nstats_match_players as p
        INNER JOIN nstats_matches as m ON m.id = p.match_id
        WHERE p.spectator=0
    )

    --all time
    ${getTotalPlayersQuery(false,false,false,false)}
    --map all time
    UNION ALL ${getTotalPlayersQuery(false,false,false,true)}
    --gametyp all time
    UNION ALL ${getTotalPlayersQuery(false,false,true,false)}
    -- serv all time
    UNION ALL ${getTotalPlayersQuery(false,true,false,false)}
    --season all time
    UNION ALL ${getTotalPlayersQuery(true,false,false,false)}

    --gametype map all time
    UNION ALL ${getTotalPlayersQuery(false,false,true,true)}

     --server map all time
    UNION ALL ${getTotalPlayersQuery(false,true,false,true)}

    --season map all time
    UNION ALL ${getTotalPlayersQuery(true,false,false,true)}

    --server gametype map all time 
    UNION ALL ${getTotalPlayersQuery(false,true,true,true)}

    --season gametype all time
    UNION ALL ${getTotalPlayersQuery(true,false,true,false)}

    --season server all time
    UNION ALL ${getTotalPlayersQuery(true,true,false,false)}

    --season server gametype map 
    UNION ALL ${getTotalPlayersQuery(true,true,true,true)}
    `;

    const result = await simpleQuery(query);
  

    const updateQuery = `UPDATE nstats_seasons_unique_match_combinations SET total_players=? WHERE season_id=? AND server_id=? AND gametype_id=? AND map_id=?`;
    const insertVars = [];

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        insertVars.push([
            r.total_players, r.season_id, r.server_id, r.gametype_id, r.map_id
        ]);
    }

    await bulkUpdate(updateQuery, insertVars);


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

    const query = `WITH combo_totals AS (
        SELECT ${seasonId} as season_id,m.server_id,m.gametype_id,m.map_id, 
        COUNT(*) as total_matches,
        SUM(playtime) as total_playtime,
        MAX(date) as last_match,
        MIN(date) as first_match
        FROM nstats_matches as m
        ${where} GROUP BY m.server_id,m.gametype_id,m.map_id
    )
        --server gametypes and map totals
    SELECT * FROM combo_totals 
        --server totals 
    UNION ALL ${createTotalsQuery(seasonId, true, false, false)}   
        --gametype totals 
    UNION ALL ${createTotalsQuery(seasonId, false, true, false)}
        --map totals    
    UNION ALL ${createTotalsQuery(seasonId, false, false, true)}    
    --all time totals
    UNION ALL ${createTotalsQuery(seasonId, false, false, false)}    
    `;

    return await simpleQuery(query, vars);
}

export async function updateSeasonUniqueCombinations(seasonId){

    const totals = await calculateSeasonUniqueCombinations(seasonId);

    const insertVars = totals.map((t) =>{

        return [
            t.season_id,
            t.server_id,
            t.gametype_id,
            t.map_id,
            t.total_matches,
            t.total_playtime,
            t.first_match,
            t.last_match,
            0
        ];
    });


    const columns = ["season_id", "server_id", "gametype_id", "map_id", "matches", "playtime", "first_match", "last_match", "total_players"];
    const conflicts = ["season_id","server_id","gametype_id", "map_id"];

    await sqlInsertOnDuplicateUpdate("nstats_seasons_unique_match_combinations", columns, insertVars, conflicts);
}


/**
 * Update basic stats such as unique match combinations, gametype + map totals
 * @param {*} seasonId 
 * @returns 
 */
export async function calculateSeasonStats(seasonId){

    await updateSeasonUniqueCombinations(seasonId);

}


async function getSeasonObjectStats(seasonId, maxServers, maxGametypes, maxMaps){


    const serversQuery = `SELECT * FROM(
     SELECT 
        ${seasonId} as season_id,
        'server' as type,
        umc.server_id as target_id,
        COALESCE(nstats_servers.name, 'Not Found') as name,
        umc.matches,
        umc.playtime,
        umc.first_match, 
        umc.last_match,
        umc.total_players 
        FROM nstats_seasons_unique_match_combinations as umc 
        LEFT JOIN nstats_servers ON umc.server_id=nstats_servers.id
        WHERE umc.season_id=? AND umc.server_id!=0 AND umc.gametype_id=0 AND umc.map_id=0 
        ORDER BY umc.playtime DESC LIMIT ?
    )
    
    UNION ALL SELECT * FROM(
        SELECT
        ${seasonId} as season_id,
    'gametype' as type,
    umc.gametype_id as target_id,
    COALESCE(nstats_gametypes.name, 'Not Found') as name,
    umc.matches,
    umc.playtime,
    umc.first_match, 
    umc.last_match,
    umc.total_players  
    FROM nstats_seasons_unique_match_combinations as umc
    LEFT JOIN nstats_gametypes ON umc.gametype_id=nstats_gametypes.id
    
    WHERE umc.season_id=? AND umc.server_id=0 AND umc.gametype_id!=0 AND umc.map_id=0 
    ORDER BY umc.playtime DESC LIMIT ?)

    UNION ALL SELECT * FROM(
        SELECT
        ${seasonId} as season_id,
    'map' as type,
    umc.map_id as target_id,
    COALESCE(nstats_maps.name, 'Not Found') as name,
    umc.matches,
    umc.playtime,
    umc.first_match, 
    umc.last_match,
    umc.total_players  
    FROM nstats_seasons_unique_match_combinations as umc
    LEFT JOIN nstats_maps ON umc.map_id=nstats_maps.id
    
    WHERE umc.season_id=? AND umc.server_id=0 AND umc.gametype_id=0 AND umc.map_id!=0 
    ORDER BY umc.playtime DESC LIMIT ?)
    `;


    const result = await simpleQuery(serversQuery, [seasonId, maxServers, seasonId, maxGametypes, seasonId, maxMaps]);


    const servers = [];
    const gametypes = [];
    const maps = [];

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        const type = r.type;

        if(type === "server"){
            servers.push(r);
        }else if(type === "gametype"){
            gametypes.push(r);
        }else if(type === "map"){
            maps.push(r);
        }
    }


    return {servers, gametypes, maps}
}


export async function getSeasonBasicObjectStats(seasonId, maxServers, maxGametypes, maxMaps){

    seasonId = parseInt(seasonId);

    if(seasonId !== seasonId) throw new Error(`SeasonId must be a valid integer`);

    const {servers, gametypes, maps} = await getSeasonObjectStats(seasonId, maxServers, maxGametypes, maxMaps);
    

    const mapNames = [];

    for(let i = 0; i < maps.length; i++){
        mapNames.push(maps[i].name);
    }

    await setMatchResultsMapImages(maps, "name");

    return {servers, gametypes, maps}
}


export async function getSeasonUniqueMatchCombinations(seasonId, bIncludeAllTime){

    seasonId = parseInt(seasonId);

    if(seasonId !== seasonId) throw new Error(`SeasonId must be a valid integer`);

    const mT = `nstats_seasons_unique_match_combinations`;

    let where = ``;
    const vars = [];

    if(seasonId !== 0){
        where =`WHERE ${mT}.season_id=?`;
        vars.push(seasonId);
    }

    if(!bIncludeAllTime){

        if(where === ``){
            where += `WHERE`;
        }else{
            where += `AND`
        }

        where += ` server_id!=0 AND gametype_id!=0 AND map_id!=0`
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

    const query = `SELECT DISTINCT gametype_id FROM nstats_seasons_unique_match_combinations WHERE season_id=?`;

    const result = await simpleQuery(query, [seasonId]);
    
    return result.map((r) =>{
        return r.gametype_id
    });
}

export async function seasonGetAllMapIds(seasonId){

    const query = `SELECT DISTINCT map_id FROM nstats_seasons_unique_match_combinations WHERE season_id=?`;

    const result = await simpleQuery(query, [seasonId]);
    
    return result.map((r) =>{
        return r.map_id
    });
}


export async function seasonGetAllMapNames(seasonId){

    seasonId = parseInt(seasonId);

    if(seasonId !== seasonId) throw new Error(`seasonId must be valid integer`);

    let query = `SELECT DISTINCT uc.map_id, nstats_maps.name FROM nstats_seasons_unique_match_combinations as uc 
    LEFT JOIN nstats_maps ON nstats_maps.id = uc.map_id
    WHERE uc.map_id !=0`;

    const vars = [];

    if(seasonId !== 0){
        query += ` AND uc.season_id=?`;
        vars.push(seasonId);
    }

    const result = await simpleQuery(query, vars);

    const data = {};
    for(let i = 0; i < result.length; i++){

        const r = result[i];

        data[r.map_id] = r.name;
    }
    return data;
}

export async function seasonGetAllGametypeNames(seasonId){

    seasonId = parseInt(seasonId);
    if(seasonId !== seasonId) throw new Error(`seasonId must be valid integer`);

    let query = `SELECT DISTINCT uc.gametype_id, nstats_gametypes.name 
    FROM nstats_seasons_unique_match_combinations as uc
    LEFT JOIN nstats_gametypes ON nstats_gametypes.id = uc.gametype_id
    WHERE uc.gametype_id!=0`;

    const vars = [];
    if(seasonId !== 0){
        query += ` AND uc.season_id=?`;
        vars.push(seasonId);
    }

    const result = await simpleQuery(query, vars);

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
    await deleteAllMapWeaponsTotals(seasonId);
    await replaceMatchesSeasonId(seasonId, 0);

    await simpleQuery(`DELETE FROM nstats_seasons WHERE id=?`, [seasonId]);

    return {"message": "passed"};
}


async function recalculateSeasonPlayerTotals(seasonId){

    await updateAllPlayerTotalsSingleSeason(seasonId);
    //await ctfRecalculatePlayerTotals(seasonId);
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
    X nstats_player_ctf_league
    X nstats_totals_player_weapon_damage
    X nstats_seasons_servers
    X nstats_seasons_gametypes
    X nstats_seasons_maps
    X nstats_seasons_unique_match_combinations
    */
}


async function assignSeasonIdToMatchesInRange(seasonId, startDate, endDate){

    const query = `UPDATE nstats_matches SET season_id=? WHERE date>=? AND date<=?`;

    return await simpleQuery(query, [seasonId, startDate, endDate]);  
}

async function removeSeasonIdFromMatches(seasonId){

    const query = `UPDATE nstats_matches SET season_id=0 WHERE season_id=?`;

    return await simpleQuery(query, [seasonId]);
}

export async function recalculateSeason(seasonId){

    new Message(`Recalculate season with id of ${seasonId}`,"note");

    seasonId = parseInt(seasonId);
    if(seasonId !== seasonId) throw new Error(`seasonId must be a valid integer.`);
    if(seasonId === 0){

        await calculateSeasonStats(seasonId);
        return;
        //throw new Error(`You can not delete season 0.`);

    }

    const seasonInfo = await getSeasonById(seasonId);
    if(seasonInfo === null) throw new Error(`season doesn't exist`);


    //just incase season start and or end date have been modified to avoid stragglers
    await removeSeasonIdFromMatches(seasonId);
    await assignSeasonIdToMatchesInRange(seasonId, seasonInfo.start_date, seasonInfo.end_date);

    await deleteSeasonUniqueMatchCombinations(seasonId);
    await calculateSeasonStats(seasonId);

    await deleteAllPlayerSeasonData(seasonId);
    
    await deleteAllMapWeaponsTotals(seasonId);


    await recalculateSeasonPlayerTotals(seasonId);

    const ctfLeagueSettings = await getLeagueSiteSettings();
    await ctfLeagueRecalculateSeasonAllTables(seasonId, ctfLeagueSettings);
 
    await recalculateSeasonRankings(seasonId);

    
}

export async function seasonsDeleteGametypeStats(gametypeId){

    const vars = [gametypeId];

    const comboQuery = `DELETE FROM nstats_seasons_unique_match_combinations WHERE gametype_id=?`;

    await simpleQuery(comboQuery, vars);
    
}

export async function seasonsDeleteMapStats(mapId){

    const vars = [mapId];

    const comboQuery = `DELETE FROM nstats_seasons_unique_match_combinations WHERE map_id=?`;

    await simpleQuery(comboQuery, vars);

}


export async function debugCheckForOrphanedData(){


    const tables = [
        "nstats_matches",
        "nstats_player_totals",
        "nstats_player_totals_weapons",
        "nstats_player_totals_ctf",
        "nstats_rankings",
        "nstats_map_weapon_totals",
        "nstats_player_ctf_league",
        "nstats_totals_player_weapon_damage",
        "nstats_player_totals_max",
        "nstats_seasons_unique_match_combinations"
    ];


    

    for(let i = 0; i < tables.length; i++){

        const table = tables[i];
        const query = `SELECT COUNT(*) as total_rows FROM ${table} WHERE season_id !=0 AND season_id NOT IN(SELECT id FROM nstats_seasons)`;

        console.log(await simpleQuery(query));
    }
}

export async function getPlayerActiveSeasons(playerId){

    const query = `SELECT DISTINCT season_id FROM nstats_player_totals WHERE player_id=? AND season_id!=0`;

    const result = await simpleQuery(query, [playerId]);

    return result.map((r) =>{ return r.season_id});
}

async function mergeServersGetAffectedSeasons(oldId){

    const query = `SELECT DISTINCT season_id FROM nstats_seasons_unique_match_combinations WHERE server_id=?`;

    const result = await simpleQuery(query, [oldId]);

    return result.map((r) =>{
        return r.season_id;
    });
}

/**
 * Delete oldId data from seasons table
 * @param {*} oldId 
 * @param {*} newId 
 */
export async function seasonsMergeServers(oldId, newId){

    const tables = [
        `nstats_seasons_unique_match_combinations`,
    ];

    const seasonIds = await mergeServersGetAffectedSeasons(oldId);

    for(let i = 0; i < tables.length; i++){

        const t = tables[i];

        await simpleQuery(`DELETE FROM ${t} WHERE server_id=?`, [oldId]);
    }


    for(let i = 0; i < seasonIds.length; i++){

        await calculateSeasonStats(seasonIds[i]);
    }
}

export async function seasonsGetMatchesSeasonIds(matchIds){

    if(matchIds.length === 0) return {};

    const query = `SELECT id,season_id FROM nstats_match WHERE id IN(?)`;

    const result = await simpleQuery(query, [matchIds]);

    const data = {};

    for(let i = 0; i < result.length; i++){
        data[result[i].id] = result[i].season_id;
    }

    return data;
}