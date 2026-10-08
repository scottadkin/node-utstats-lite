
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

    //console.log("result");
   // console.log(result);

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

async function getPlayerHistory(seasonId, mapId, gametypeId, maxAgeDays, ctfGametypes){

    const now = Date.now();
    const minDate = new Date(now - maxAgeDays * DAY);

    let query = `SELECT match_id,player_id,team FROM nstats_match_players`;
    let vars = [minDate];

    let where = ` WHERE time_on_server>0 AND spectator=0 AND match_date>=?`;

    if(mapId !== 0){

        where += ` AND map_id=?`;
        vars.push(mapId);
    }

    if(gametypeId !== 0){
        where += ` AND gametype_id=?`;
        vars.push(gametypeId);
    }

    if(gametypeId === 0){
        if(ctfGametypes.length === 0) return {"matchIds": [], "matchesToPlayers": {}};
        where += ` AND gametype_id IN(?)`;
        vars.push(ctfGametypes);
    }

    
    vars.push(seasonId);

    const result = await simpleQuery(`${query}${where} AND EXISTS(
        SELECT 1 FROM nstats_matches WHERE nstats_matches.id = nstats_match_players.match_id AND nstats_matches.season_id=?
        ) ORDER BY match_date DESC`, vars);

    const matchIds = new Set();
    const matchesToPlayers = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];
        matchIds.add(r.match_id);
        
        if(matchesToPlayers[r.match_id] === undefined){
            matchesToPlayers[r.match_id] = [];
        }

        matchesToPlayers[r.match_id].push({"id": r.player_id, "team": r.team});
    }

    return {"matchIds": [...matchIds], matchesToPlayers}
    
}

class CTFLeaguePlayerObject{

    constructor(playerId){

        this.playerId = playerId;
        this.matches = 0;
        this.wins = 0;
        this.draws = 0;
        this.losses = 0;
        this.capFor = 0;
        this.capAgainst = 0;
        this.points = 0;
        this.firstMatch = 0;
        this.lastMatch = 0;
        this.capOffset = 0;
        this.playtime = 0;

    }

    update(myTeam, redScore, blueScore, winner, date, playtime){

        this.matches++;

        if(winner !== -1){

            if(myTeam === winner){
                this.wins++;
                this.points+=3;
            }

            if(myTeam !== winner) this.losses++;

        }else{
            this.draws++;
            this.points++;
        }
        
        if(myTeam === 0){
            this.capFor += redScore;
            this.capAgainst += blueScore;
        }else{
            this.capFor += blueScore;
            this.capAgainst += redScore;
        }

        if(this.firstMatch === 0 || this.firstMatch > date){
            this.firstMatch = date;
        }

        if(this.lastMatch === 0 || this.lastMatch < date){
            this.lastMatch = date;
        }


        this.capOffset = this.capFor - this.capAgainst;
        this.playtime += playtime;
    }
}

async function deleteAllEntries(mapId, gametypeId){

    const query = `DELETE FROM nstats_player_ctf_league WHERE map_id=? AND gametype_id=?`;
    const vars = [mapId, gametypeId];

    return await simpleQuery(query, vars);
}

async function bulkInsertEntries(seasonId, mapId, gametypeId, tableData){

    const insertVars = [];

    for(const d of Object.values(tableData)){

        insertVars.push([
            d.playerId, gametypeId, mapId, 
            d.firstMatch, d.lastMatch, d.matches,
            0, d.wins, d.draws, d.losses, 0, 
            d.capFor, d.capAgainst, d.capOffset,
            d.points, seasonId
        ]);
    }

    const t = "nstats_player_ctf_league";

    const columns = [
        "player_id","gametype_id","map_id","first_match","last_match",
        "total_matches","playtime","wins","draws","losses","winrate",
        "cap_for","cap_against","cap_offset","points", "season_id"
    ];


    return await sqlInsertOnDuplicateUpdate(t, columns, insertVars, ["player_id","season_id","gametype_id","map_id"]);
    //await bulkInsert(query, insertVars);
}

export async function calcPlayersMapResults(seasonId, mapId, gametypeId, maxMatches, maxDays){

    seasonId = parseInt(seasonId);
    if(seasonId !== seasonId) throw new Error(`SeasonId must be valid integer`);
    if(maxMatches === undefined) maxMatches = 5;
    if(maxDays === undefined) maxDays = 180;

    const ctfGametypes = await getCTFGametypesInSeason(seasonId);


    const history = await getPlayerHistory(seasonId, mapId, gametypeId, maxDays, ctfGametypes);

    const matchResults = await getMatchesTeamResults(history.matchIds);

    const table = {};

    for(let x = 0; x < history.matchIds.length; x++){

        const matchId = history.matchIds[x];
        const d = history.matchesToPlayers[matchId];

        for(let i = 0; i < d.length; i++){

            const {id, team} = d[i];
         
            if(table[id] === undefined){
                table[id] = new CTFLeaguePlayerObject(id);
            }

            const matchResult = matchResults[matchId];
            
            if(matchResult === undefined){
                throw new Error(`matchResult is undefined`);
            }
 
            if(table[id].matches < maxMatches){

                table[id].update(
                    team, 
                    matchResult.red, 
                    matchResult.blue, 
                    matchResult.winner, 
                    matchResult.date, 
                    matchResult.playtime
                );
            }
        }  
    }

    await bulkInsertEntries(seasonId, mapId, gametypeId, table);
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

export async function refreshAllTables(seasonId, type){


    seasonId = parseInt(seasonId);
    if(seasonId !== seasonId) throw new Error(`seasonId must be valid integer`);

    if(type === undefined) throw new Error(`Refresh all tables requires a type`);

    const settings = await getLeagueCategorySettings(type);

    if(settings["Enable League"] === undefined) throw new Error(`CTF ${type} League Missing Setting, Enable League`);

    if(settings["Enable League"].value === "false"){
        new Message(`Player CTF ${type} League is disabled, skipping.`,"note");
        return;
    }

    const lastImport = Math.floor(new Date(settings["Last Whole League Refresh"].value));

    const now = Date.now();

    const timeSinceLastRefresh = now - lastImport;

    if(await bAnyData(seasonId) && timeSinceLastRefresh < DAY){
        new Message(`Less than 24 hours have passed since last CTF ${type} league refresh, skipping.`,"note");
        return;
    }

    if(settings["Maximum Match Age In Days"] === undefined) throw new Error(`CTF ${type} League Missing Setting, Maximum Match Age In Days`);

    const maxDays = settings["Maximum Match Age In Days"].value;

    let uniqueCombos = [];
    if(type === "maps"){
        uniqueCombos = await ctfLeagueGetUniqueMapGametypeCombosInPastDays(seasonId, maxDays);
    }else if(type === "gametypes"){
        uniqueCombos = await ctfLeagueGetUniqueGametypesInPastDays(seasonId, maxDays);
    }

    const maxMatches = setInt(settings["Maximum Matches Per Player"], 20);

    if(type !== "combined"){

        for(let i = 0; i < uniqueCombos.length; i++){

            const u = uniqueCombos[i];

            let message = "";

            if(type === "maps"){
                message = `Recalculating CTF Map League table for gametype=${u.gametype_id} and map=${u.map_id}`;
            }else{
                message = `Recalculating CTF Gametype League table for gametype=${u.gametype_id} `;
            }

            new Message(message, "note");

            let mapId = (type === "maps") ? u.map_id : 0;

            await calcPlayersMapResults(seasonId, mapId, u.gametype_id, maxMatches, maxDays);
        }
        
    }else{

        new Message(`Recalculating CTF Lifetime League table`, "note");
        await calcPlayersMapResults(seasonId, 0, 0, maxMatches, maxDays);
    }

    const newData = {};
    
    newData[type] = {"Last Whole League Refresh": {"value": new Date(now).toISOString(), "category": type}};
    await updateSettings(newData);
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

export async function getUniqueMapLeagues(seasonId){

    seasonId = parseInt(seasonId);
    if(seasonId !== seasonId) throw new Error(`seasonId must be a valid integer`);
    
    const query = `SELECT DISTINCT map_id FROM nstats_player_ctf_league WHERE map_id!=0 AND season_id=?`;

    const result = await simpleQuery(query, [seasonId]);

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


export async function deleteMatch(mapId, gametypeId){

    //TODO add seasonID
    const settings = await getLeagueSiteSettings();

    if(settings.maps["Enable League"].value){

        //map all time 
        await calcPlayersMapResults(
            mapId, 
            0, 
            settings.maps["Maximum Matches Per Player"].value,
            settings.maps["Maximum Match Age In Days"].value
        );

        //map + gametype 
        await calcPlayersMapResults(
            mapId, 
            gametypeId, 
            settings.maps["Maximum Matches Per Player"].value,
            settings.maps["Maximum Match Age In Days"].value
        );
    }


    if(settings.gametypes["Enable League"].value){

        //gametype all time
        await calcPlayersMapResults(
            0, 
            gametypeId, 
            settings.gametypes["Maximum Matches Per Player"].value,
            settings.gametypes["Maximum Match Age In Days"].value
        );
    }

    if(settings.combined["Enable League"].value){

        //lifetime
        await calcPlayersMapResults(
            0, 
            0, 
            settings.combined["Maximum Matches Per Player"].value,
            settings.combined["Maximum Match Age In Days"].value
        );
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
 */
async function ctfLeagueGetUniqueCombosBetweenDates(seasonId, startDate, endDate, ctfGametypes){

    const query = `SELECT DISTINCT map_id FROM nstats_matches WHERE season_id=? AND gametype_id IN(?) AND date >=? AND date<=?`;

    const result = await simpleQuery(query, [seasonId, ctfGametypes, startDate, endDate]);

    return result.map((r) => { return r.map_id});
    /*
     const start = performance.now();
    const query =  `SELECT DISTINCT gametype_id as target_id,'gametype' as type 
    FROM nstats_match_ctf 
    WHERE EXISTS(SELECT 1 FROM nstats_matches WHERE nstats_matches.id = nstats_match_ctf.match_id AND nstats_matches.season_id=? AND nstats_matches.date>=? AND nstats_matches.date<=?)
    UNION ALL
    SELECT DISTINCT map_id as target_id,'map' as type 
    FROM nstats_match_ctf 
    WHERE EXISTS(SELECT 1 FROM nstats_matches WHERE nstats_matches.id = nstats_match_ctf.match_id AND nstats_matches.season_id=? AND nstats_matches.date>=? AND nstats_matches.date<=?)
    `;

    const result = await simpleQuery(query, [seasonId, startDate, endDate, seasonId, startDate, endDate]);
    
    const end = performance.now();
    console.log(result);
    console.log((end - start) * 0.001);
    process.exit();
    */

    /*const query = `SELECT DISTINCT gametype_id,map_id 
    FROM nstats_matches WHERE season_id=? AND date>=? AND date<=? 
    AND EXISTS(
        SELECT 1 FROM nstats_match_ctf WHERE nstats_match_ctf.match_id = nstats_matches.id
    )`;

    const result = await simpleQuery(query, [seasonId, startDate, endDate]);

    const gametypeIds = new Set();
    const mapIds = new Set();
    for(let i = 0; i < result.length; i++){

        gametypeIds.add(result[0].gametype_id);
        mapIds.add(result[0].map_id);
        
    }

    return {"gametypeIds": [...gametypeIds], "mapIds": [...mapIds]}*/

}

async function testGetPlayerHistory(seasonId, gametypeId, mapId, maxMatches, startDate, endDate){

    gametypeId = parseInt(gametypeId);
    mapId = parseInt(mapId);

    if(gametypeId !== gametypeId || mapId !== mapId) throw new Error(`Both gametypeID and mapId must be valid integers`);


    let where = ``;
    const vars = [startDate, endDate, seasonId];

    if(gametypeId !== 0){
       // nstats_match_players.gametype_id=? AND nstats_match_players.map_id=? AND
       where += `nstats_match_players.gametype_id=? AND `;
       vars.unshift(gametypeId);
    }

    if(mapId !== 0){
        where += `nstats_match_players.map_id=? AND `;
        vars.unshift(mapId);
    }



    /*const query = `SELECT 
    nstats_match_players.match_id,
    nstats_match_players.player_id,
    nstats_match_players.match_result 
    FROM nstats_match_players
    WHERE ${where} nstats_match_players.spectator=0 AND nstats_match_players.match_date>=? AND nstats_match_players.match_date<=?
    AND EXISTS(SELECT 1 FROM nstats_matches WHERE nstats_matches.id = nstats_match_players.match_id AND nstats_matches.season_id=?)`;*/

    const query = `SELECT 
    nstats_match_players.match_id,
    nstats_match_players.player_id,
    nstats_match_players.match_result 
    FROM nstats_match_players
    WHERE ${where} nstats_match_players.spectator=0 AND nstats_match_players.match_date>=? AND nstats_match_players.match_date<=?
    AND EXISTS(SELECT 1 FROM nstats_matches WHERE nstats_matches.id = nstats_match_players.match_id AND nstats_matches.season_id=?)`;

    const start = performance.now();
    const result = await simpleQuery(query, vars);
    const end = performance.now();

    console.log((end - start) * 0.001);

    console.log(result);
    console.log(gametypeId, mapId);
}

/** GET match result with cap offset,against for
const query = `SELECT 
    nstats_match_players.player_id,
    nstats_match_players.match_id,
    nstats_match_players.match_result,
    CASE 
        WHEN nstats_match_players.team = 0
        THEN nstats_matches.team_0_score - nstats_matches.team_1_score
        WHEN nstats_match_players.team = 1
        THEN nstats_matches.team_1_score - nstats_matches.team_0_score
        ELSE 0
    END AS cap_offset,
    CASE 
        WHEN nstats_match_players.team = 0
        THEN nstats_matches.team_1_score
        WHEN nstats_match_players.team = 1
        THEN nstats_matches.team_0_score
        ELSE 0
    END AS cap_against,
    CASE 
        WHEN nstats_match_players.team = 0
        THEN nstats_matches.team_0_score
        WHEN nstats_match_players.team = 1
        THEN nstats_matches.team_1_score
        ELSE 0
    END AS cap_for,
    nstats_matches.team_0_score,
    nstats_matches.team_1_score,
    match_date FROM nstats_match_players 
    INNER JOIN nstats_matches ON nstats_matches.id=nstats_match_players.match_id
    WHERE nstats_matches.season_id=? AND spectator=0 AND nstats_matches.date>=? AND nstats_matches.date<=?
    `;
 */

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
    const query = `INSERT INTO nstats_player_ctf_league (
        player_id, gametype_id, map_id, first_match, last_match, 
        playtime, total_matches, wins, draws, losses, winrate, 
        cap_for, cap_against, cap_offset, points, season_id
    ) VALUES ?`;

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

    await bulkInsert(query, insertVars);
}

async function recalculateSeasonTable(seasonId, mapId, gametypeId, maxMatches, startDate, endDate){

    seasonId = parseInt(seasonId);
    if(seasonId !== seasonId) throw new Error(`SeasonId must be valid integer`);

 
    mapId = parseInt(mapId);
    gametypeId = parseInt(gametypeId);

    if(mapId !== mapId || gametypeId !== gametypeId) throw new Error(`map and gametype id must be valid integer`);

    const vars = [seasonId, startDate, endDate];
    let where = ``;

    let playersColumns = ``;

    if(gametypeId !== 0){
        playersColumns += `nstats_match_players.gametype_id,`;
        vars.push(gametypeId);
        where += ` AND nstats_matches.gametype_id=?`;
    }
    if(mapId !== 0){
        playersColumns += `nstats_match_players.map_id,`;
        vars.push(mapId);
        where += ` AND nstats_matches.map_id=?`;
    }

    const query = `SELECT 
    nstats_match_players.player_id,
    ${playersColumns}
    MIN(nstats_matches.date) AS first_match,
    MAX(nstats_matches.date) AS last_match,
    COUNT(*) as total_matches,
    SUM(time_on_server) as total_playtime,
    SUM(CASE
        WHEN nstats_match_players.match_result = 'w'
        THEN 1
        ELSE 0
    END
    ) as wins,
     SUM(CASE
        WHEN nstats_match_players.match_result = 'd'
        THEN 1
        ELSE 0
    END
    ) as draws,
     SUM(CASE
        WHEN nstats_match_players.match_result = 'l'
        THEN 1
        ELSE 0
    END
    ) as losses,
     SUM(CASE
        WHEN nstats_match_players.match_result = 'w'
        THEN 3
        WHEN nstats_match_players.match_result = 'd'
        THEN 1
        WHEN nstats_match_players.match_result = 'l'
        THEN 0
        ELSE 0
        END
     ) as points,
    SUM(CASE 
        WHEN nstats_match_players.team = 0
        THEN nstats_matches.team_0_score - nstats_matches.team_1_score
        WHEN nstats_match_players.team = 1
        THEN nstats_matches.team_1_score - nstats_matches.team_0_score
        ELSE 0
    END) AS cap_offset,
    SUM(CASE 
        WHEN nstats_match_players.team = 0
        THEN nstats_matches.team_1_score
        WHEN nstats_match_players.team = 1
        THEN nstats_matches.team_0_score
        ELSE 0
    END) AS cap_against,
    SUM(CASE 
        WHEN nstats_match_players.team = 0
        THEN nstats_matches.team_0_score
        WHEN nstats_match_players.team = 1
        THEN nstats_matches.team_1_score
        ELSE 0
    END) AS cap_for FROM nstats_match_players 
    INNER JOIN nstats_matches ON nstats_matches.id=nstats_match_players.match_id
    WHERE nstats_matches.season_id=? AND spectator=0 AND time_on_server>0 
    AND nstats_matches.date>=? AND nstats_matches.date<=? ${where}
     GROUP BY player_id
    `;

    const result = await simpleQuery(query, vars);
    
   

    await deleteSeasonTable(seasonId, gametypeId, mapId);

    await bulkInsertSeasonTable(seasonId, gametypeId, mapId, result);

}


export async function ctfLeagueRecalculateSeason(seasonId){

    seasonId = parseInt(seasonId);
    if(seasonId !== seasonId) throw new Error(`seasonId must be valid integer`);

    const seasonInfo = await getSeasonById(seasonId);
    if(seasonInfo === null) throw new Error(`There is no season with the id of ${seasonId}`);

    const types = ["combined", "gametypes", "maps"];

    const typeSettings = await getMultipleLeagueCategorySettings(types);

    const startDate = new Date(seasonInfo.start_date);
    const endDate = new Date(seasonInfo.end_date);

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

        if(settings["Maximum Match Age In Days"] === undefined) throw new Error(`CTF ${type} League Missing Setting, Maximum Match Age In Days`);

        const maxDays = settings["Maximum Match Age In Days"].value;
        const maxMatches = setInt(settings["Maximum Matches Per Player"], 20);

        const minDate = new Date(endDate - DAY * maxDays);

        let cutOffDate = minDate;

        if(minDate < startDate){
            cutOffDate = startDate;
        }


        if(type === "combined"){
            new Message(`Recalculating CTF Lifetime League table for season ${seasonId}`, "note");

            await recalculateSeasonTable(seasonId, 0, 0, maxMatches, cutOffDate, endDate);
            //need to make new function for seasons for endDate and endDate - maxDays
            //await calcPlayersMapResults(seasonId, 0, 0, maxMatches, maxDays);
            const newData = {};
            
            newData[type] = {"Last Whole League Refresh": {"value": new Date(Date.now()).toISOString(), "category": type}};
            await updateSettings(newData);
            continue;
        }

        const mapIds = await ctfLeagueGetUniqueCombosBetweenDates(seasonId, minDate, endDate, ctfGametypes);
      
        for(let x = 0; x < ctfGametypes.length; x++){

            const gId = ctfGametypes[x];

            if(type === "maps"){

                for(let y = 0; y < mapIds.length; y++){

                    const mapId = mapIds[y];
                    new Message(`Recalculating season(${seasonId}) ctf league for gametypeId ${gId} and mapId ${mapId}`,"note");
                    await recalculateSeasonTable(seasonId, mapId, gId, maxMatches, cutOffDate, endDate);
      
                }

            }else{

                await recalculateSeasonTable(seasonId, 0, gId, maxMatches, cutOffDate, endDate);
                new Message(`Recalculating season(${seasonId}) ctf league for gametypeId ${gId} and mapId ${0}`,"note");
            }
           
            
        }

        const newData = {};
    
        newData[type] = {"Last Whole League Refresh": {"value": new Date(Date.now()).toISOString(), "category": type}};
        await updateSettings(newData);

    }
}