
import { bulkInsert, simpleQuery, sqlInsertOnDuplicateUpdate } from "./database.mjs";
import {  getCTFGametypesInSeason, getMatchesTeamResults } from "./ctf.mjs";
import { getBasicPlayerInfo} from "./players.mjs";
import { convertTimestamp, DAY, getPlayer, sanitizePagePerPage, setInt } from "./generic.mjs";
import Message from "./message.mjs";
import { getCategorySettings } from "./siteSettings.mjs";
import { getSeasonById } from "./seasons.mjs";


export const DEFAULT_SETTINGS = [
    {"category": "combined", "name": "Maximum Matches Per Player", "type": "integer", "value": 20},
    {"category": "combined", "name": "Maximum Match Age In Days", "type": "integer", "value": 180},
    {"category": "combined", "name": "Enable League", "type": "bool", "value": "true"},
    {"category": "combined", "name": "Update Whole League End Of Import", "type": "bool", "value": "true"},
    {"category": "combined", "name": "Last Whole League Refresh", "type": "datetime", "value": new Date(0)},

    {"category": "maps", "name": "Maximum Matches Per Player", "type": "integer", "value": 20},
    {"category": "maps", "name": "Maximum Match Age In Days", "type": "integer", "value": 180},
    {"category": "maps", "name": "Enable League", "type": "bool", "value": "true"},
    {"category": "maps", "name": "Update Whole League End Of Import", "type": "bool", "value": "true"},
    {"category": "maps", "name": "Last Whole League Refresh", "type": "datetime", "value": new Date(0)},
    {"category": "gametypes", "name": "Maximum Matches Per Player", "type": "integer", "value": 20},
    {"category": "gametypes", "name": "Maximum Match Age In Days", "type": "integer", "value": 180},
    {"category": "gametypes", "name": "Enable League", "type": "bool", "value": "true"},
    {"category": "gametypes", "name": "Update Whole League End Of Import", "type": "bool", "value": "true"},
    {"category": "gametypes", "name": "Last Whole League Refresh", "type": "datetime", "value": new Date(0)},
];


async function bCTFSettingExist(name, category){

    const query = `SELECT COUNT(*) as total_rows FROM nstats_ctf_league_settings WHERE name=? AND category=?`;

    const result = await simpleQuery(query, [name, category]);

    return result[0].total_rows > 0;
}

export async function insertDefaultCTFLeagueSettings(){

    const query = `INSERT INTO nstats_ctf_league_settings VALUES(NULL,?,?,?,?)`;

    for(let i = 0; i < DEFAULT_SETTINGS.length; i++){

        const s = DEFAULT_SETTINGS[i];

        if(!await bCTFSettingExist(s.name, s.category)){
            
            await simpleQuery(query, [s.category, s.name, s.type, s.value]);
        }
    }
}


async function getMapTotalPossibleResults(mapId, gametypeId, minDate){

    const query = `SELECT COUNT(*) as total_players FROM nstats_player_ctf_league WHERE map_id=? 
    AND gametype_id=? AND last_match>=? ORDER BY points DESC, wins DESC, draws DESC, losses ASC, cap_offset ASC`;

    const result = await simpleQuery(query, [mapId, gametypeId, minDate]);

    return result[0].total_players;
}

export async function getMapCTFTable(mapId, gametypeId, page, perPage, timeRange){

    page--;
    if(page < 0) page = 0;
    timeRange = parseInt(timeRange);
    if(timeRange !== timeRange) throw new Error("timeRange must be an integer");
    if(timeRange < 1) timeRange = 1;

    const now = new Date();
    const minDate = new Date(now - 60 * 60 * 24 * 1000 * timeRange);

    const totalMatches = await getMapTotalPossibleResults(mapId, gametypeId, minDate);

    if(totalMatches === 0) return {"data": [], "totalResults": 0};

    const query = `SELECT 
    nstats_player_ctf_league.player_id,
    nstats_player_ctf_league.first_match,
    nstats_player_ctf_league.last_match,
    nstats_player_ctf_league.total_matches,
    nstats_player_ctf_league.wins,
    nstats_player_ctf_league.draws,
    nstats_player_ctf_league.losses,
    nstats_player_ctf_league.cap_for,
    nstats_player_ctf_league.cap_against,
    nstats_player_ctf_league.cap_offset,
    nstats_player_ctf_league.points, 
    nstats_players.name,
    nstats_players.country
    FROM nstats_player_ctf_league 
    LEFT JOIN nstats_players ON nstats_players.id = nstats_player_ctf_league.player_id
    WHERE nstats_player_ctf_league.map_id=? AND nstats_player_ctf_league.gametype_id=? 
    AND nstats_player_ctf_league.last_match>=?
    ORDER BY nstats_player_ctf_league.points DESC, 
    nstats_player_ctf_league.total_matches ASC, 
    nstats_player_ctf_league.wins DESC, 
    nstats_player_ctf_league.draws DESC, 
    nstats_player_ctf_league.losses ASC, 
    nstats_player_ctf_league.cap_offset DESC LIMIT ?, ?`;
    

    const start = page * perPage;
    const result = await simpleQuery(query, [mapId, gametypeId, minDate, start, perPage]);
    
    return {"data": result, "totalResults": totalMatches};
}

/**
 * Used for admin tools, use getLeagueCategorySettings for importer
 * @returns 
 */
export async function getLeagueSiteSettings(){

    const query = `SELECT category,name,type,value FROM nstats_ctf_league_settings`;

    const result = await simpleQuery(query);

    const settings = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];
        let value = r.value;

        if(r.type === "bool"){

            if(value === "false"){
                value = 0;
            }else{
                value = 1;
            }
        }

        if(settings[r.category] === undefined){
            settings[r.category] = {}; 
        }

        settings[r.category][r.name] = {"type": r.type, "value": value}
    }

    return settings;
}

/**
 * 
 * @param {Array<Number>} cats 
 * @returns {Promise<Object>} category => settings
 */
export async function getMultipleLeagueCategorySettings(cats){

    const query = `SELECT category,name,type,value FROM nstats_ctf_league_settings WHERE category IN (?)`;

    const result = await simpleQuery(query, [cats]);

    const settings = {};

    for(let i = 0; i < cats.length; i++){

        settings[cats[i].toLowerCase()] = {};
    }

    for(let i = 0; i < result.length; i++){

        const {category, name, type, value} = result[i];

        settings[category.toLowerCase()][name] = {type, value};
    }

    return settings;
}

export async function getLeagueCategorySettings(cat){

    const query = `SELECT name,type,value FROM nstats_ctf_league_settings WHERE category=?`;
    const result = await simpleQuery(query, [cat]);

    const settings = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];
        settings[r.name] = {"type": r.type, "name": r.name, "value": r.value};
    }

    return settings;
}


export async function updateSettings(data){

    const query = `UPDATE nstats_ctf_league_settings SET value=? WHERE category=? AND name=?`;

    for(const [categoryName, category] of Object.entries(data)){

        if(categoryName === "totalChanges") continue;

        for(const [key, setting] of Object.entries(category)){

            let v = setting.value.toString();
    
            const vars = [v, categoryName, key];
    
            await simpleQuery(query, vars);
        }
    }  
}


/**
 * Get only valid CTF gametypes
 */
export async function getValidGametypes(seasonId){

    const query = `SELECT DISTINCT gametype_id FROM nstats_match_ctf WHERE EXISTS (
        SELECT 1 FROM nstats_matches WHERE nstats_matches.id = nstats_match_ctf.match_id AND nstats_matches.season_id=?
    )`;

    const result = await simpleQuery(query, [seasonId]);

    return result.map((r) =>{
        return r.gametype_id;
    });
}

/**
 * Get only valid CTF maps
 */

export async function getValidMaps(seasonId){

    const query = `SELECT DISTINCT map_id FROM nstats_match_ctf WHERE EXISTS (
        SELECT 1 FROM nstats_matches WHERE nstats_matches.id = nstats_match_ctf.match_id AND nstats_matches.season_id=?
    )`;

    const result = await simpleQuery(query, [seasonId]);

    return result.map((r) =>{
        return r.map_id;
    });
}

async function bAnyData(seasonId){

    const query = `SELECT id FROM nstats_player_ctf_league WHERE season_id=? LIMIT 1`;

    const result = await simpleQuery(query, [seasonId]);

    return result.length > 0;
}

/**
 * 
 * @param {*} daysLimit 
 * @returns Unique gametype, map combinations e
 */
async function ctfLeagueGetUniqueMapGametypeCombosInPastDays(seasonId, daysLimit){

    daysLimit = setInt(daysLimit, 28);
    if(daysLimit < 1) daysLimit = 1;

    const validGametypes = await getValidGametypes(seasonId);
    const validMaps = await getValidMaps(seasonId);

    const now = Date.now();
    const minDate = new Date(now - daysLimit * DAY);

    const vars = [minDate];

    let where = `WHERE date>=? `;

    if(validGametypes.length > 0){
        where += `AND gametype_id IN(?) `;
        vars.push(validGametypes);
    }

    if(validMaps.length > 0){
        where += `AND map_id IN(?) `;
        vars.push(validMaps);
    }

    vars.push(seasonId);

    const query = `SELECT DISTINCT map_id,gametype_id FROM nstats_matches 
    ${where} AND season_id=?
    GROUP BY map_id,gametype_id`;

    return await simpleQuery(query, vars);  
}

export async function ctfLeagueGetUniqueGametypesInPastDays(seasonId, daysLimit){

    daysLimit = setInt(daysLimit, 28);
    if(daysLimit < 1) daysLimit = 1;

    const query = `SELECT DISTINCT gametype_id FROM nstats_matches WHERE date>=? AND season_id=?`;

    const now = Date.now();
    const minDate = new Date(now - daysLimit * DAY);

    const validGametypes = await getValidGametypes(seasonId);

    const result = await simpleQuery(query, [minDate, seasonId]);

    const data = [];

    for(let i = 0; i < result.length; i++){

        if(validGametypes.indexOf(result[i].gametype_id) !== -1){
            data.push(result[i]);
        }
    }
    return data;
}


async function refreshTable(seasonId, gametypeId, mapId, cutOffDate, seasonEndDate, settings){

    if(settings["Enable League"] === undefined) throw new Error(`CTF League Missing Setting, Enable League(refreshTable)`);

    if(settings["Enable League"].value === "false"){
        new Message(`Player CTF League is disabled, skipping(refreshTable).`,"note");
        return;
    }

    const maxMatches = setInt(settings["Maximum Matches Per Player"].value, 180);

    await recalculateSeasonTable(seasonId, mapId, gametypeId, maxMatches, cutOffDate, seasonEndDate);
    
}


export async function refreshAllTables(seasonId, ctfLeagueSettings){

    seasonId = parseInt(seasonId);
    if(seasonId !== seasonId) throw new Error(`seasonId must be valid integer`);

    const combinedSettings = ctfLeagueSettings.combined;
    const gametypeSettings = ctfLeagueSettings.gametypes;
    const mapSettings = ctfLeagueSettings.maps;

    const seasonInfo = await getSeasonById(seasonId);

    const combinedRestrictions = getCTFLeagueRestrictions(seasonInfo, combinedSettings);
    const gametypeRestrictions = getCTFLeagueRestrictions(seasonInfo, gametypeSettings);
    const mapRestrictions = getCTFLeagueRestrictions(seasonInfo, mapSettings);

    //season all time
    await refreshTable(seasonId, 0, 0, combinedRestrictions.cutOffDate, combinedRestrictions.seasonEndDate, combinedSettings);

    //const allValidCTFGametypes = await getAllValidCTFGametypes();

    const uniqueCombos = await getUniqueMatchCombinationsInDateRange(seasonId, new Date(0), new Date(Date.now()));

    const ctfGametypes = [...new Set(uniqueCombos.map((u) => { return u.gametype_id}))];


    if(ctfGametypes.length === 0){
        new Message(`No CTF gametypes found in seasonId ${seasonId}.`,"note");
        return;
    }

    const processedGametypes = new Set();
    const processedMaps = new Set();

    for(let i = 0; i < uniqueCombos.length; i++){

        const {gametype_id: gametypeId, map_id: mapId} = uniqueCombos[i];
 

        //gametype + map
        new Message(`Refreshing ctf league map ${mapId} + gametypeId ${gametypeId} table for season ${seasonId}`,"note");
        await refreshTable(seasonId, gametypeId, mapId, mapRestrictions.cutOffDate, mapRestrictions.seasonEndDate, mapSettings);

        //map season, we only want to do map season total once otherwise just redoing same data over and over
        if(!processedMaps.has(mapId)){
            new Message(`Refreshing ctf league map ${mapId} table for season ${seasonId}`,"note");
            await refreshTable(seasonId, 0, mapId, mapRestrictions.cutOffDate, mapRestrictions.seasonEndDate, mapSettings);
            processedMaps.add(mapId);
        }

        //gametype season, we only want to do gametype season total once otherwise just redoing same data over and over
        if(!processedGametypes.has(gametypeId)){
            new Message(`Refreshing ctf league gametype ${gametypeId} table for season ${seasonId}`,"note");
            await refreshTable(seasonId, gametypeId, 0, gametypeRestrictions.cutOffDate, gametypeRestrictions.seasonEndDate, gametypeSettings);
            processedGametypes.add(gametypeId);
        }
    }
}



export async function getPlayerMapsLeagueData(playerId, seasonId){

    const pT = "nstats_player_ctf_league";
    const mT = "nstats_maps";
    const gT = "nstats_gametypes";

    const query = `SELECT ${pT}.gametype_id,${pT}.map_id,${pT}.total_matches,
    ${pT}.wins,${pT}.draws,${pT}.losses,${pT}.cap_for,
    ${pT}.cap_against,${pT}.cap_offset,${pT}.points,
    ${gT}.name as gametype_name,
    ${mT}.name as map_name
    FROM ${pT} 
    LEFT JOIN ${gT} ON ${gT}.id = ${pT}.gametype_id
    LEFT JOIN ${mT} ON ${mT}.id = ${pT}.map_id
    
    WHERE ${pT}.player_id=? AND ${pT}.season_id=?`;

    const result = await simpleQuery(query, [playerId, seasonId]);


    await getPlayerMapsPosition(playerId, result, seasonId);

    return result;
}


/**
 * probably not an efficent way of doing this...
 * @param {*} playerId 
 * @param {*} targetData 
 */
export async function getPlayerMapsPosition(playerId, targetData){

    const query = `SELECT COUNT(*) as pos FROM nstats_player_ctf_league 
    WHERE gametype_id=? AND map_id=? AND points>?
    ORDER BY points DESC, wins DESC, draws DESC, losses ASC, cap_offset DESC`;

    for(let i = 0; i < targetData.length; i++){

        const t = targetData[i];
        const pos = await simpleQuery(query, [t.gametype_id, t.map_id, t.points]);
        if(pos.length > 0) t.pos = pos[0].pos;
    }

}

/**
* Only return gametypes with mapId=0
*/
export async function getUniqueGametypeLeagues(seasonId){

    seasonId = parseInt(seasonId);
    if(seasonId !== seasonId) throw new Error(`seasonId must be a valid integer`);

    const query = `SELECT DISTINCT gametype_id FROM nstats_player_ctf_league WHERE map_id=0 AND season_id=?`;

    const result = await simpleQuery(query, [seasonId]);

    return result.map((r) =>{
        return r.gametype_id;
    });
}

export async function getUniqueMapLeagues(seasonId, gametypeId){

    seasonId = parseInt(seasonId);
    if(seasonId !== seasonId) throw new Error(`seasonId must be a valid integer`);
    
    const query = `SELECT DISTINCT map_id FROM nstats_player_ctf_league WHERE map_id!=0 AND season_id=? AND gametype_id=?`;

    const result = await simpleQuery(query, [seasonId, gametypeId]);

    return result.map((r) =>{
        return r.map_id;
    });
}


/**
 * get top x for every gametype specified
 */
export async function getGametypesTopX(gametypeIds, max){

    if(gametypeIds.length === 0) return {};
    max = setInt(max, 10);

    const query = `SELECT player_id,first_match,last_match,total_matches,wins,draws,losses,
    cap_for,cap_against,cap_offset,points FROM nstats_player_ctf_league WHERE gametype_id=? AND map_id=0 ORDER BY points DESC LIMIT ?`;

    const data = {};
    const uniquePlayers = new Set();

    for(let i = 0; i < gametypeIds.length; i++){

        const g = parseInt(gametypeIds[i]);
        if(g !== g) continue;
        const result = await simpleQuery(query, [g, max]); 
        data[g] = result;

        for(let x = 0; x < result.length; x++){

            uniquePlayers.add(result[x].player_id);
        }
    }

    const playerNames = await getBasicPlayerInfo([...uniquePlayers]);

    return {"data": data, "playerNames": playerNames};

}


export async function getMapPlayedValidGametypes(mapId){

    if(mapId === 0) return {};

    const query = `SELECT gametype_id,COUNT(*) as total_matches FROM nstats_player_ctf_league WHERE map_id=? GROUP BY gametype_id`;
    const result = await simpleQuery(query, [mapId]);
    const data = {};

    for(let i = 0; i < result.length; i++){

        data[result[i].gametype_id] = result[i].total_matches;
    }

    return data;
}

export async function ctfLeagueGetLatestMapGametypePlayed(seasonId){

    const query = `SELECT gametype_id,map_id FROM nstats_player_ctf_league WHERE map_id!=0 AND gametype_id!=0 AND season_id=? ORDER by id DESC LIMIT 1`;

    const result = await simpleQuery(query, [seasonId]);

    if(result.length > 0) return result[0];

    return null;
}

export async function getTotalEntries(seasonId, gametypeId, mapId){

    const query = `SELECT COUNT(*) as total_matches FROM nstats_player_ctf_league WHERE gametype_id=? AND map_id=? AND season_id=?`;

    const result = await simpleQuery(query, [gametypeId, mapId, seasonId]);

    if(result.length > 0) return result[0].total_matches;

    return 0;
}

export async function getSingleCTFLeague(seasonId, gametypeId, mapId, dirtyPage, dirtyPerPage, bOnlyCombined){

    const [page, perPage, start] = sanitizePagePerPage(dirtyPage, dirtyPerPage);

    const query = `SELECT * FROM nstats_player_ctf_league 
    WHERE map_id=? AND gametype_id=? AND season_id=? ORDER BY points DESC LIMIT ?, ?`;

    const result = await simpleQuery(query, [mapId, gametypeId, seasonId, start, perPage]);

    const playerIds = [...new Set(result.map((p) =>{
        return p.player_id;
    }))];

    const playerNames = await getBasicPlayerInfo(playerIds);


    for(let i = 0; i < result.length; i++){

        const r = result[i];
        r.player = getPlayer(playerNames, r.player_id);
    }

    const totalRows = await getTotalEntries(seasonId, gametypeId, mapId);

    return {"data": result, totalRows};
}



export async function getLeaguesEnabledStatus(){

    const query = `SELECT category,value FROM nstats_ctf_league_settings WHERE name="Enable League"`;
    const result = await simpleQuery(query);

    const data = {};

    for(let i = 0; i < result.length; i++){

        const {category, value} = result[i];

        data[category] = value === "true";
    }

    return data;
}

export async function getMapUniqueGametypeLeagues(mapId, timeframe){

    timeframe = parseInt(timeframe);
    if(timeframe !== timeframe) throw new Error("Timeframe must be an integer");

    const range = timeframe * 60 * 60 * 24 * 1000;

    const now = Date.now();
    const minDate = new Date(now - range);

    const query = `SELECT DISTINCT 
    nstats_player_ctf_league.gametype_id as id,
    nstats_gametypes.name as name 
    FROM nstats_player_ctf_league 
    LEFT JOIN nstats_gametypes ON nstats_gametypes.id = nstats_player_ctf_league.gametype_id
    WHERE nstats_player_ctf_league.map_id=? 
    AND nstats_player_ctf_league.last_match>=? ORDER BY name ASC`;

    return await simpleQuery(query, [mapId, minDate]);
}

export async function adminGetAllCTFLeagueSettings(){

    const query = `SELECT * FROM nstats_ctf_league_settings`;

    return await simpleQuery(query);

}

/**
 * update by id
 * @param {*} changes array of changes id => value
 */
export async function adminUpdateCTFLeagueSettings(changes){

    if(changes.length === 0) return;

    const query = `UPDATE nstats_ctf_league_settings SET value=? WHERE id=?`;

    for(let i = 0; i < changes.length; i++){

        const {id, value} = changes[i];

        await simpleQuery(query, [value, id]);
    }
}


function getCTFLeagueRestrictions(seasonInfo, settings){


    const maxDays = setInt(settings["Maximum Match Age In Days"]?.value, 180);
    const maxMatches = setInt(settings["Maximum Matches Per Player"]?.value, 20);
    
    const now = new Date(Date.now());

    const seasonStartDate = (seasonInfo !== null) ? new Date(seasonInfo.start_date) : new Date(1);
    const seasonEndDate = (seasonInfo !== null) ? new Date(seasonInfo.end_date) : now;

    let maxDaysDate = null;

    if(maxDays > 0){
        maxDaysDate = new Date(seasonEndDate - DAY * maxDays);
    }else{
        maxDaysDate = new Date(1);
    }
     
    const cutOffDate = (maxDaysDate < seasonStartDate) ? seasonStartDate : maxDaysDate;

   


    return {maxMatches, cutOffDate, seasonEndDate, maxDays}
}

export async function deleteMatch(seasonId, mapId, gametypeId){

    if(arguments.length !== 3) throw new Error(`seasonId missing`);

    seasonId = parseInt(seasonId);
    if(seasonId !== seasonId) throw new Error(`seasonId must be a valid integer`);
    //TODO add seasonID
    const settings = await getLeagueSiteSettings();

    if(settings["gametypes"]["Maximum Match Age In Days"] === undefined){
        throw new Error(`CTF League Missing Setting, Maximum Match Age In Days(deleteMatch gametypes)`);
    }

    const seasonInfo = await getSeasonById(seasonId);
    


    if(settings.maps["Enable League"].value){

        //#####
        const {cutOffDate, seasonEndDate, maxMatches} = getCTFLeagueRestrictions(seasonInfo, settings.maps);

        //await recalculateSeasonTable(seasonId, mapId, 0, maxMatches, cutOffDate, seasonEndDate);
        await recalculateSeasonTable(seasonId, mapId, 0, maxMatches, cutOffDate, seasonEndDate);
        //map all time 

        //map + gametype 
        await recalculateSeasonTable(seasonId, mapId, gametypeId, maxMatches, cutOffDate, seasonEndDate);
 
    }


    if(settings.gametypes["Enable League"].value){

        const {cutOffDate, seasonEndDate, maxMatches} = getCTFLeagueRestrictions(seasonInfo, settings.gametypes);
        //gametype all time
        await recalculateSeasonTable(seasonId, 0, gametypeId, maxMatches, cutOffDate, seasonEndDate);
  
    }

    if(settings.combined["Enable League"].value){

        const {cutOffDate, seasonEndDate, maxMatches} = getCTFLeagueRestrictions(seasonInfo, settings.combined);
        await recalculateSeasonTable(seasonId, 0, 0, maxMatches, cutOffDate, seasonEndDate);
    
    }
}


export async function sanitizeCTFLeaguePageReq(req, pageSettings){

    const mode = req.query?.mode ?? pageSettings["Default Mode"] ?? "gametypes";
    let id = req.query?.id ?? "";
    //gid only used for maps mode as id in that case is the map id
    let gId = req.query?.gid ?? "";

    let seasonId = req.params.season ?? 0;
    seasonId = parseInt(seasonId);
    if(seasonId !== seasonId) throw new Error(`seasonId must be valid integer`);

    let seasonInfo = await getSeasonById(seasonId);


    if(id === "" && gId === ""){

        const latestIds = await ctfLeagueGetLatestMapGametypePlayed(seasonId);
        if(latestIds !== null){

            if(mode === "gametypes"){
                id = latestIds.gametype_id;
            }else{
                gId = latestIds.gametype_id;
                id = latestIds.map_id;
            }
        }
    }

    let page = req.query?.page ?? 1;
    let perPage = req.query?.perPage ?? pageSettings["Results Per Page"] ?? 25;

    if(perPage !== perPage) perPage = 25;

    const leagueSettings = await getLeagueSiteSettings();

    let maxMatchesPerPlayer = 0;
    let maxMatchAge = 0;
    let lastLeagueRefresh = "Never";

    if(mode === "gametypes" || mode === "maps" || mode === "combined"){

        maxMatchesPerPlayer = leagueSettings[mode]["Maximum Matches Per Player"].value;
        maxMatchAge = leagueSettings[mode]["Maximum Match Age In Days"].value;
        lastLeagueRefresh = leagueSettings[mode]["Last Whole League Refresh"].value;

        lastLeagueRefresh = convertTimestamp(new Date(lastLeagueRefresh), false, false, true);
    }

    return {mode, id, gId, seasonId, seasonInfo, page, perPage, leagueSettings, maxMatchesPerPlayer, maxMatchAge, lastLeagueRefresh}
}


export async function setCTFLeaguePageMetaData(mode, gametypeNames, mapNames, id, gId){

    let gametypeName = "Gametypes";
    let mapName = "Maps";
    let subHeader = "";

    let title = "";

    if(mode === "gametypes"){

        gametypeName = gametypeNames?.[id] ?? "Gametypes";
        title = `${gametypeName} - CTF League`;
        subHeader = gametypeName;

    }else if(mode === "maps"){
    
        mapName = mapNames?.[id] ?? "Maps";

        if(gId == 0){
            title = `${mapName} - CTF League`;
            subHeader = mapName;
        }else{
            gametypeName = gametypeNames?.[gId] ?? "Gametypes";
            title = `${mapName} (${gametypeName}) - CTF League`;
            subHeader = `${mapName} (${gametypeName})`
        }

    }else if(mode === "combined"){

        title = `Combined - CTF League`;
        subHeader = "Combined";
    }

    const brandingSettings = await getCategorySettings("Branding");
    title = `${title} - ${brandingSettings?.["Site Name"] ?? "Node UTStats Lite"}`;

    return {title, brandingSettings, subHeader, gametypeName, mapName}
}

/**
 * Get unique gametypes, maps where date >=startDate and date <=endDate
 * @param {Number} seasonId 
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @param {Array<Number>} ctfGametypes 
 */
async function ctfLeagueGetUniqueCombosBetweenDates(seasonId, startDate, endDate, ctfGametypes){

    const query = `SELECT DISTINCT map_id FROM nstats_matches WHERE season_id=? AND gametype_id IN(?) AND date >=? AND date<=?`;

    const result = await simpleQuery(query, [seasonId, ctfGametypes, startDate, endDate]);

    return result.map((r) => { return r.map_id});
    
}

async function getUniqueMatchCombinationsInDateRange(seasonId, startDate, endDate){

    const query = `SELECT DISTINCT gametype_id,map_id FROM nstats_matches WHERE season_id=? AND date>=? AND date<=? AND gametype_id IN(
        SELECT id FROM nstats_gametypes WHERE b_ctf=1
    )`;

    return await simpleQuery(query, [seasonId, startDate, endDate]);

    
}

async function deleteSeasonTable(seasonId, gametypeId, mapId){

    const query = `DELETE FROM nstats_player_ctf_league WHERE season_id=? AND gametype_id=? AND map_id=?`;

    return await simpleQuery(query, [seasonId, gametypeId, mapId]);
}

/**
 * Used for reclaculate season as we previously deleted all data in table for matching season,gametype,map
 * @param {*} seasonId 
 * @param {*} gametypeId 
 * @param {*} mapId 
 * @param {*} data 
 * @returns 
 */
async function bulkInsertSeasonTable(seasonId, gametypeId, mapId, data){

    if(data.length === 0) return;



    const insertVars = [];


    for(let i = 0; i < data.length; i++){

        const d = data[i];

        let winrate = 0;

        if(d.total_matches > 0 && d.wins > 0){

            const other = d.draws + d.losses;

            if(d.wins > 0 && other === 0){
                winrate = 0;
            }else{

                winrate = d.wins / d.total_matches;
            }
        }

        insertVars.push([
            d.player_id,
            gametypeId,
            mapId,
            d.first_match,
            d.last_match,
            d.total_playtime, d.total_matches, d.wins, d.draws,
            d.losses, winrate, d.cap_for, d.cap_against, 
            d.cap_offset, d.points, seasonId
        ]);
    }

    const columns = [
        "player_id", "gametype_id", "map_id", "first_match", "last_match",
        "playtime", "total_matches", "wins", "draws", "losses", "winrate", "cap_for",
        "cap_against", "cap_offset", "points", "season_id"
    ];

    const conflict = ["player_id","season_id","gametype_id","map_id"];

    

    await sqlInsertOnDuplicateUpdate("nstats_player_ctf_league", columns, insertVars, conflict);
    //await bulkInsert(query, insertVars);
}


export async function calcSeasonTable(seasonId, gametypeId, mapId, maxMatches, startDate, endDate){

    seasonId = parseInt(seasonId);
    if(seasonId !== seasonId) throw new Error(`SeasonId must be valid integer`);
 
    mapId = parseInt(mapId);
    gametypeId = parseInt(gametypeId);

    if(mapId !== mapId || gametypeId !== gametypeId) throw new Error(`map and gametype id must be valid integer`);

    const vars = [];

    let cteWhere = ``;

    let playersColumns = ``;

    if(seasonId !== 0){
        vars.unshift(seasonId);
        cteWhere += `nstats_matches.season_id=?`;
    }

    if(gametypeId !== 0){
        playersColumns += `nstats_match_players.gametype_id,`;
        vars.push(gametypeId);
        if(cteWhere !== "") cteWhere += ` AND `;
        cteWhere += `nstats_match_players.gametype_id=?`;
    }

    if(mapId !== 0){
        playersColumns += `nstats_match_players.map_id,`;
        vars.push(mapId);
        if(cteWhere !== "") cteWhere += ` AND `;
        cteWhere += ` nstats_match_players.map_id=?`;
    }

    if(cteWhere !== "") cteWhere += ` AND `;

    vars.push(startDate, endDate);
    vars.push(maxMatches);


    const test = `WITH RankedMatches AS (
        SELECT nstats_match_players.player_id,
        nstats_match_players.match_result,
        nstats_match_players.time_on_server,
        nstats_match_players.team,
        nstats_matches.team_0_score,
        nstats_matches.team_1_score,
        nstats_matches.date,
        ROW_NUMBER() OVER (
            PARTITION BY nstats_match_players.player_id
            ORDER BY nstats_matches.date DESC
        ) AS rn
        FROM nstats_match_players
        INNER JOIN nstats_matches ON nstats_matches.id = nstats_match_players.match_id
        WHERE ${cteWhere} nstats_match_players.spectator=0 AND nstats_match_players.time_on_server>0
        AND nstats_matches.date >= ?
        AND nstats_matches.date <= ?
    )
    SELECT player_id,MIN(date) as first_match, MAX(date) as last_match, SUM(time_on_server) as total_playtime,
    COUNT(*) as total_matches,
    SUM(CASE
        WHEN match_result = 'w'
        THEN 1
        ELSE 0
    END
    ) as wins,
     SUM(CASE
        WHEN match_result = 'd'
        THEN 1
        ELSE 0
    END
    ) as draws,
     SUM(CASE
        WHEN match_result = 'l'
        THEN 1
        ELSE 0
    END
    ) as losses,
     SUM(CASE
        WHEN match_result = 'w'
        THEN 3
        WHEN match_result = 'd'
        THEN 1
        WHEN match_result = 'l'
        THEN 0
        ELSE 0
        END
     ) as points,
    SUM(CASE 
        WHEN team = 0
        THEN team_0_score - team_1_score
        WHEN team = 1
        THEN team_1_score - team_0_score
        ELSE 0
    END) AS cap_offset,
    SUM(CASE 
        WHEN team = 0
        THEN team_1_score
        WHEN team = 1
        THEN team_0_score
        ELSE 0
    END) AS cap_against,
    SUM(CASE 
        WHEN team = 0
        THEN team_0_score
        WHEN team = 1
        THEN team_1_score
        ELSE 0
    END) AS cap_for
     
    FROM RankedMatches WHERE rn <=? GROUP BY player_id ORDER BY last_match DESC
    `;

    return await simpleQuery(test, vars);

}

async function recalculateSeasonTable(seasonId, mapId, gametypeId, maxMatches, startDate, endDate){

    const result = await calcSeasonTable(seasonId, gametypeId, mapId, maxMatches, startDate, endDate);

    await deleteSeasonTable(seasonId, gametypeId, mapId);

    await bulkInsertSeasonTable(seasonId, gametypeId, mapId, result);

}

export async function ctfLeagueUpdateSeasonTable(seasonId, mapId, gametypeId, maxMatches, startDate, endDate){


    const result = await calcSeasonTable(seasonId, gametypeId, mapId, maxMatches, startDate, endDate);


    await bulkInsertSeasonTable(seasonId, gametypeId, mapId, result);
}


export async function ctfLeagueRecalculateSeason(seasonId){


    seasonId = parseInt(seasonId);
    if(seasonId !== seasonId) throw new Error(`seasonId must be valid integer`);

    const seasonInfo = await getSeasonById(seasonId);
    if(seasonInfo === null) throw new Error(`There is no season with the id of ${seasonId}`);

    const types = ["combined", "gametypes", "maps"];

    const typeSettings = await getMultipleLeagueCategorySettings(types);


    const ctfGametypes = await getCTFGametypesInSeason(seasonId);

    if(ctfGametypes.length === 0){
        new Message(`No CTF gametypes found in season, skipping.`,"warning");
        return;
    }

    for(let i = 0; i < types.length; i++){

        const type = types[i];
        if(type === undefined) throw new Error(`Failed to get settings for ctfLeague with type ${type}`);


        const settings = typeSettings[type];

        if(settings["Enable League"] === undefined) throw new Error(`CTF ${type} League Missing Setting, Enable League`);

        if(settings["Enable League"].value === "false"){
            new Message(`Player CTF ${type} League is disabled, skipping.`,"note");
            return;
        }

        const {cutOffDate, seasonEndDate, maxMatches} = getCTFLeagueRestrictions(seasonInfo, settings);

        if(type === "combined"){
            new Message(`Recalculating CTF Lifetime League table for season ${seasonId}`, "note");

            await recalculateSeasonTable(seasonId, 0, 0, maxMatches, cutOffDate, seasonEndDate);
      
            const newData = {};
            
            newData[type] = {"Last Whole League Refresh": {"value": new Date(Date.now()).toISOString(), "category": type}};
            await updateSettings(newData);
            continue;
        }

        const mapIds = await ctfLeagueGetUniqueCombosBetweenDates(seasonId, cutOffDate, seasonEndDate, ctfGametypes);
      
        for(let x = 0; x < ctfGametypes.length; x++){

            const gId = ctfGametypes[x];

            if(type === "maps"){

                for(let y = 0; y < mapIds.length; y++){

                    const mapId = mapIds[y];
                    new Message(`Recalculating season(${seasonId}) ctf league for gametypeId ${gId} and mapId ${mapId}`,"note");
                    await recalculateSeasonTable(seasonId, mapId, gId, maxMatches, cutOffDate, seasonEndDate);
      
                }

            }else{

                await recalculateSeasonTable(seasonId, 0, gId, maxMatches, cutOffDate, seasonEndDate);
                new Message(`Recalculating season(${seasonId}) ctf league for gametypeId ${gId} and mapId ${0}`,"note");
            }
           
            
        }

        const newData = {};
    
        newData[type] = {"Last Whole League Refresh": {"value": new Date(Date.now()).toISOString(), "category": type}};
        await updateSettings(newData);

    }
}