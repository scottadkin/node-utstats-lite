import {simpleQuery, bulkInsert} from "./database.mjs";
import { getPlayer, mysqlSetTotalsByDate, getHeatmapDates } from "./generic.mjs";
import { getMapAndGametypeIds } from "./matches.mjs";
import { setMatchMapGametypeIds as setCTFMatchMapGametypeIds } from "./ctf.mjs";
import { setMatchMapGametypeIds as setDOMMatchMapGametypeIds } from "./domination.mjs";
import { setMatchMapGametypeIds as setWeaponStatsMatchMapGametypeIds } from "./weapons.mjs";
import { getPlayerMapTotals, deleteCurrentPlayerMapAverages, updateCurrentPlayerMapAverages, getUniquePlayerIdsOnMap, getAllMapIds} from "./maps.mjs";
import md5 from "md5";
import { DEFAULT_DATE } from "../config.mjs";

export async function getPlayerMasterId(playerName/*, hwid, mac1, mac2*/){

    //const query = `SELECT id FROM nstats_players WHERE name=? AND hwid=? AND mac1=? AND mac2=?`;
    const query = `SELECT id FROM nstats_players WHERE name=?`;

    const result = await simpleQuery(query, [playerName]);

    if(result.length === 0) return null;

    return result[0].id;
}

export async function createMasterPlayer(name, ip, hwid, mac1, mac2, matchDate){

    const query = `INSERT INTO nstats_players VALUES(NULL,?,"",?)`;

    const hash = md5(name);

    //const result = await simpleQuery(query, [name, ip, hwid, mac1, mac2]);
    const result = await simpleQuery(query, [name, hash]);

    return result.insertId;
}


export async function updateMasterPlayer(playerId, country){

    if(country === null || country === "") country = "xx";

    const query = `UPDATE nstats_players SET country=? WHERE id=?`;

    await simpleQuery(query, [country, playerId]);
}

export async function updateMasterPlayers(playerIds, idsToCountries, date){

    for(let i = 0; i < playerIds.length; i++){

        const p = playerIds[i];
        await updateMasterPlayer(p, idsToCountries[p] ?? "xx");
    }
}


export async function bulkInsertPlayerMatchData(players, matchId, matchDate, gametypeId, mapId){

    if(Object.keys(players).length === 0) return;

    const insertVars = [];

    for(const p of Object.values(players)){

        insertVars.push([
            p.masterId,
            (p.playtime > 0) ? p.bSpectator : 1,
            p.ip,
            p.country,
            p.hwid,
            p.mac1,
            p.mac2,
            matchId,
            mapId,
            gametypeId,
            matchDate,
            p.matchResult,
            p.bBot,
            (p.ping.min !== null) ? p.ping.min : -1,
            (p.ping.avg !== null) ? p.ping.avg : -1,
            (p.ping.max !== null) ? p.ping.max : -1,
            (p.playtime > 0) ? p.team : 255,
            p.stats.score,
            p.stats.frags,
            p.stats.kills,
            p.stats.deaths,
            p.stats.suicides,
            p.stats.teamKills,
            p.stats.efficiency,
            p.playtime,
            p.stats.ttl,
            p.bFirstBlood,
            p.stats.sprees.spree,
            p.stats.sprees.rampage,
            p.stats.sprees.dominating,
            p.stats.sprees.unstoppable,
            p.stats.sprees.godlike,
            p.stats.sprees.best,
            p.stats.multis.double,
            p.stats.multis.multi,
            p.stats.multis.ultra,
            p.stats.multis.monster,
            p.stats.multis.best,
            p.stats.headshots,
            p.stats.items.amp,
            p.stats.items.belt,
            p.stats.items.boots,
            p.stats.items.body,
            p.stats.items.pads,
            p.stats.items.invis,
            p.stats.items.shp
        ]);
    }

    const query = `INSERT INTO nstats_match_players (
        player_id, spectator, ip, country, hwid,
        mac1, mac2, match_id, map_id, gametype_id, match_date, match_result, bot, ping_min, ping_avg, ping_max,
        team, score, frags, kills, deaths,
        suicides, team_kills, efficiency, time_on_server, ttl,
        first_blood, spree_1, spree_2, spree_3, spree_4,
        spree_5, spree_best, multi_1, multi_2, multi_3,
        multi_4, multi_best, headshots, item_amp, item_belt,
        item_boots, item_body, item_pads, item_invis, item_shp
    ) VALUES ?`;


    await bulkInsert(query, insertVars);
}

export async function getPlayersById(ids){

    if(ids.length === 0) return {};

    const query = `SELECT * FROM nstats_players WHERE id IN(?)`;

    const result = await simpleQuery(query, [ids]);

    const data = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        data[r.id] = r.name;
    }

    return data;
}

export async function getPlayerById(id){

    const query = `SELECT * FROM nstats_players WHERE id=?`;

    const result = await simpleQuery(query, [id]);

    if(result.length > 0) return result[0];

    return null;
}

export async function getPlayerByHash(hash){

    const query = `SELECT * FROM nstats_players WHERE hash=?`;

    const result = await simpleQuery(query, [hash]);

    if(result.length > 0) return result[0];

    return null;
}

/**
 * 
 * @param {*} id interger or hash auto
 */
export async function getPlayerByAuto(id){

    if(id.length === 32){
        return await getPlayerByHash(id);
    }

    id = parseInt(id);

    if(id !== id) return null;

    return await getPlayerById(id);
     
}

export async function getPlayerNamesByIds(playerIds){
     
    if(playerIds.length === 0) return {};

    const query = `SELECT id,name FROM nstats_players WHERE id IN(?)`;

    const result = await simpleQuery(query, [playerIds]);

    const data = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];
        data[r.id] = r.name;
    }

    return data;
}

export async function getBasicPlayerInfo(ids){

    if(ids.length === 0) return {};

    const query = `SELECT id,name,country FROM nstats_players WHERE id IN(?)`;

    const result = await simpleQuery(query, [ids]);

    const data = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];
        data[r.id] = r;
    }

    return data;
}

/**
 * 
 * @param {*} playerInfos 
 * @param {*} targetData must have key named "player_id"
 */
export function applyBasicPlayerInfoToObjects(playerInfos, targetData){

    for(let i = 0; i < targetData.length; i++){

        if(targetData[i].player_id === undefined) throw new Error("applyBasicInfoToObjects() requires target data have a key called player_id");

        const pId = targetData[i].player_id;

        if(playerInfos[pId] !== undefined){
            const p = playerInfos[pId];
            targetData[i].playerName = p.name;
            targetData[i].playerCountry = p.country;
        }
    }
}

export async function getTotalPlayers(name){

    const query = `SELECT COUNT(*) as total_players 
    FROM nstats_player_totals
    LEFT JOIN nstats_players ON nstats_players.id = nstats_player_totals.player_id
    WHERE nstats_players.name LIKE ? AND nstats_player_totals.gametype_id=0 AND nstats_player_totals.map_id=0`;
    const result = await simpleQuery(query, [`%${name}%`]);

    return result[0].total_players;
}


export async function searchPlayers(name, sortBy, order, page, perPage){

    sortBy = sortBy.toLowerCase();
    order = order.toUpperCase();
    perPage = parseInt(perPage);
    page = parseInt(page);

    if(page !== page) page = 1;
    page--;

    if(page < 0) page = 0;

    if(perPage !== perPage) perPage = 25;
    if(perPage < 0) perPage = 25;
    if(perPage > 100) perPage = 100;

    if(order !== "ASC" && order !== "DESC"){
        order = "ASC";
    }

    const validSortBys = [
        "name", "last_active", "score", "frags", "kills", "deaths",
        "suicides", "efficiency", "matches", "playtime"
    ];

    if(sortBy === "eff") sortBy = "efficiency";

    const sortIndex = validSortBys.indexOf(sortBy);

    if(sortIndex === -1){
        throw new Error(`${sortBy} is not a valid sortBy option`);
    }

    let start = page * perPage;

    const playerMainColumns = ["name","country"];
    const sortByTable = (playerMainColumns.indexOf(sortBy) === -1) ? "nstats_player_totals" : "nstats_players";

    if(sortBy !== "matches"){
        sortBy = validSortBys[sortIndex];
    }else{
        sortBy = "total_matches";
    }

    const query = `SELECT 
    nstats_players.id,
    nstats_players.name,
    nstats_players.country,
    nstats_players.hash,
    nstats_player_totals.total_matches,
    nstats_player_totals.score,
    nstats_player_totals.frags,
    nstats_player_totals.kills,
    nstats_player_totals.deaths,
    nstats_player_totals.suicides,
    nstats_player_totals.efficiency,
    nstats_player_totals.ttl,
    nstats_player_totals.playtime,
    nstats_player_totals.last_active
    FROM nstats_players 
    LEFT JOIN nstats_player_totals ON nstats_player_totals.player_id = nstats_players.id
    WHERE name LIKE ? AND nstats_player_totals.gametype_id=0 AND nstats_player_totals.map_id=0
    ORDER BY ${sortByTable}.${sortBy} ${order} LIMIT ?, ?`;
    // FROM nstats_players WHERE name LIKE ? ORDER BY ${validSortBys[sortIndex]} ${order} LIMIT ?, ?`;

    const totalPlayers = await getTotalPlayers(name);
    const result = await simpleQuery(query, [`%${name}%`, start, perPage]);

    return {"players": result, "totalPlayers": totalPlayers};
}


async function getPlayersAllMatchData(playerIds, gametypeId, mapId){

    if(playerIds.length === 0) return [];
    if(gametypeId === undefined) throw new Error(`getPlayersAllMatchData gametypeId is missing`);
    if(mapId === undefined) throw new Error(`getPlayersAllMatchData mapId is missing`);

    //remove gametype_id and map_id only for testing
    let query = `SELECT 
    player_id,
    gametype_id,
    map_id,
    match_id,
    match_result,
    team,
    score,
    frags,
    kills,
    deaths,
    suicides,
    team_kills,
    time_on_server,
    ttl,
    first_blood,
    spree_1,
    spree_2,
    spree_3,
    spree_4,
    spree_5,
    spree_best,
    multi_1,
    multi_2,
    multi_3,
    multi_4,
    multi_best,
    headshots,
    item_amp,
    item_belt,
    item_boots,
    item_body,
    item_pads,
    item_invis,
    item_shp
    FROM nstats_match_players WHERE spectator=0 AND player_id IN (?)`;

    const vars = [playerIds];

    if(gametypeId !== 0){
        vars.push(gametypeId);
        query += ` AND gametype_id=?`;
    }
    if(mapId !== 0){
        vars.push(mapId);
        query += ` AND map_id=?`;
    }

    const result = await simpleQuery(query, vars);

    const matchIds = [... new Set(result.map((r) =>{
        return r.match_id;
    }))]


    return {"data": result, "matchIds": matchIds}
}

function _createNewTotals(totals, playerId, gametypeId, mapId){

    totals[playerId][gametypeId][mapId] = {
        "matches": 0,
        "playtime": 0,
        "totalTtl": 0,
        "ttl": 0,
        "eff": 0,
        "last_active": new Date(DEFAULT_DATE),
        "wins": 0,
        "losses": 0,
        "draws": 0,
        "winRate": 0,
        "lastActive": null,
        "score": 0,
        "frags": 0,
        "kills": 0,
        "deaths": 0,
        "suicides": 0,
        "team_kills": 0,
        "first_blood": 0,
        "spree_1": 0,
        "spree_2": 0,
        "spree_3": 0,
        "spree_4": 0,
        "spree_5": 0,
        "spree_best": 0,
        "multi_1": 0,
        "multi_2": 0,
        "multi_3": 0,
        "multi_4": 0,
        "multi_best": 0,
        "headshots": 0,
        "item_amp": 0,
        "item_belt": 0,
        "item_boots": 0,
        "item_body": 0,
        "item_pads": 0,
        "item_invis": 0,
        "item_shp": 0
    };
}

function _updateTotals(totals, playerData, gametypeId, mapId){

    if(totals[playerData.player_id] === undefined){
        totals[playerData.player_id] = {};
    }

    if(totals[playerData.player_id][gametypeId] === undefined){
        totals[playerData.player_id][gametypeId] = {};
    }

    if(totals[playerData.player_id][gametypeId][mapId] === undefined){
        _createNewTotals(totals, playerData.player_id, gametypeId, mapId);
    }

    const mergeTypes = [
      "score",
      "frags",
      "kills",
      "deaths",
      "suicides",
      "team_kills",
      //"time_on_server",
      //ttl,
      "first_blood",
      "spree_1",
      "spree_2",
      "spree_3",
      "spree_4",
      "spree_5",
      //spree_best,
      "multi_1",
      "multi_2",
      "multi_3",
      "multi_4",
      //multi_best,
      "headshots",
      "item_amp",
      "item_belt",
      "item_boots",
      "item_body",
      "item_pads",
      "item_invis",
      "item_shp",
      "wins",
      "draws",
      "losses",
    ];

    const higherBetter = [
        "spree_best",
        "multi_best",
        "last_active"
    ];

    const floatTypes = ["playtime"];

    const t = totals[playerData.player_id][gametypeId][mapId];

    t.matches += playerData.total_matches;

    for(let i = 0; i < mergeTypes.length; i++){

        const m = mergeTypes[i];

        if(floatTypes.indexOf(m) === -1){
            t[m] = parseInt(t[m]) + parseInt(playerData[m]);
        }else{
            t[m] += playerData[m];
        }
    }

    for(let i = 0; i < higherBetter.length; i++){

        const h = higherBetter[i];

        if(t[h] < playerData[h]){
            t[h] = playerData[h];
        }
    }

    t.totalTtl += playerData.ttl;

    if(t.totalTtl !== 0){
        t.ttl = t.totalTtl / t.matches;
    }

    if(t.kills > 0){

        if(t.deaths === 0){
            t.eff = 100;
        }else{
            t.eff = (t.kills / (t.kills + t.deaths)) * 100;
        }
    }

    if(playerData.last_active > t.last_active){
        t.last_active = playerData.last_active;
    }

    t.playtime += parseFloat(playerData.time_on_server);

    if(t.wins > 0){
        t.winRate = t.wins / t.matches * 100;
    }
}

/**
 * 
 * @param {*} playerId 
 * @returns 
 */
export async function calcPlayerTotals(playerIds/*, gametypeId, mapId*/){

    if(playerIds.length === 0) return [];

    let query = `SELECT
    player_id,
    gametype_id,
    map_id,
    COUNT(*) as total_matches,
    SUM(time_on_server) as time_on_server,
    MAX(match_date) as last_active,
    SUM(CASE
        WHEN match_result = 'w' THEN 1
        ELSE 0
        END
    ) as wins,
      SUM(CASE
        WHEN match_result = 'd' THEN 1
        ELSE 0
        END
    ) as draws,
      SUM(CASE
        WHEN match_result = 'l' THEN 1
        ELSE 0
        END
    ) as losses,
    SUM(score) as score,
    SUM(frags) as frags,
    SUM(kills) as kills,
    SUM(deaths) as deaths,
    SUM(suicides) as suicides,
    SUM(team_kills) as team_kills,
    SUM(time_on_server) as time_on_server,
    SUM(ttl) as ttl,
    SUM(first_blood) as first_blood,
    SUM(spree_1) as spree_1,
    SUM(spree_2) as spree_2,
    SUM(spree_3) as spree_3,
    SUM(spree_4) as spree_4,
    SUM(spree_5) as spree_5,
    MAX(spree_best) as spree_best,
    SUM(multi_1) as multi_1,
    SUM(multi_2) as multi_2,
    SUM(multi_3) as multi_3,
    SUM(multi_4) as multi_4,
    MAX(multi_best) as multi_best,
    SUM(headshots) as headshots,
    SUM(item_amp) as item_amp,
    SUM(item_belt) as item_belt,
    SUM(item_boots) as item_boots,
    SUM(item_body) as item_body,
    SUM(item_pads) as item_pads,
    SUM(item_invis) as item_invis,
    SUM(item_shp) as item_shp
    FROM nstats_match_players WHERE spectator=0 AND player_id IN (?) GROUP BY player_id,gametype_id,map_id,match_result`;

    const result = await simpleQuery(query, [playerIds]);

    const totals = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        //gametype map combos
        _updateTotals(totals, r, r.gametype_id, r.map_id);
        //gametype totals
        _updateTotals(totals, r, r.gametype_id, 0);
        //map totals
        _updateTotals(totals, r, 0, r.map_id);
        //all time totals
        _updateTotals(totals, r, 0, 0);
    }
    
    return totals;
}


/**
 * When we recalculate player totals we use this to delete all the previous player
 * all time totals, gametype totals, and map totals
 * @param {*} playerIds 
 * @returns 
 */
export async function deleteMultiplePlayerTotals(playerIds){

    if(playerIds.length === 0) return;

    const query = `DELETE FROM nstats_player_totals WHERE player_id IN(?)`;

    return await simpleQuery(query, [playerIds]);
}

async function insertPlayerGametypeTotals(data){

    const insertVars = [];

    const playerIds = new Set();

    for(const [playerId, gametypes] of Object.entries(data)){

        playerIds.add(playerId);

        for(const [gametypeId, maps] of Object.entries(gametypes)){

            for(const [mapId, p] of Object.entries(maps)){

                insertVars.push([
                    playerId, gametypeId, mapId, p.last_active, p.playtime, p.matches, 
                    p.wins, p.draws, p.losses, p.winRate, p.score,
                    p.frags, p.kills, p.deaths, p.suicides, p.team_kills,
                    p.eff, p.ttl, p.first_blood, p.spree_1, p.spree_2,
                    p.spree_3, p.spree_4, p.spree_5, p.spree_best, p.multi_1,
                    p.multi_2, p.multi_3, p.multi_4, p.multi_best, p.headshots,
                    p.item_amp, p.item_belt, p.item_boots, p.item_body, p.item_pads,
                    p.item_invis, p.item_shp
                ]);
            }
        }
    }

    await deleteMultiplePlayerTotals([...playerIds]);

    const query = `INSERT INTO nstats_player_totals (player_id,gametype_id,map_id,last_active,playtime,total_matches,
            wins,draws,losses,winrate,score,
            frags,kills,deaths,suicides,team_kills,
            efficiency,ttl, first_blood, spree_1,spree_2,
            spree_3,spree_4, spree_5, spree_best, multi_1,
            multi_2,multi_3,multi_4,multi_best,headshots,
            item_amp, item_belt, item_boots, item_body, item_pads,
            item_invis, item_shp ) VALUES ?`;

    await bulkInsert(query, insertVars);
}


export async function updatePlayerTotals(playerIds){

    const totals = await calcPlayerTotals(playerIds);

    await insertPlayerGametypeTotals(totals);
}


export async function getPlayerGametypeTotals(playerId){

    const query = `SELECT * FROM nstats_player_totals WHERE player_id=? AND map_id=0`;

    return await simpleQuery(query, [playerId]);
}


async function getPlayerTotalMatches(playerId, where, vars){

    const query = `SELECT COUNT(*) as total_matches FROM nstats_match_players WHERE player_id=? ${where} AND spectator=0`;

    const result = await simpleQuery(query, [...vars]);


    if(result.length === 0) return 0;

    return result[0].total_matches;
}

// add page and perpage filtering
export async function getPlayerRecentMatches(playerId, gametype, map, page, perPage){

    page = parseInt(page);
    perPage = parseInt(perPage);
    map = parseInt(map);
    gametype = parseInt(gametype);

    if(page !== page || perPage !== perPage) throw new Error(`Page, or perPage is not a valid integer.`);

    page = page - 1;

    if(page < 0) page = 0;
    if(perPage < 1 || perPage > 100) perPage = 50;
    
    let vars = [playerId];

    let where = "";

    if(gametype !== 0){
        vars.push(gametype);
        where = ` AND nstats_match_players.gametype_id=?`;
    }

    if(map !== 0){
        vars.push(map);
        where += ` AND nstats_match_players.map_id=?`;
    }


    const query = `SELECT 
    nstats_match_players.match_id,
    nstats_match_players.match_date,
    nstats_match_players.team,
    nstats_match_players.match_result,
    nstats_gametypes.name as gametype_name,
    nstats_maps.name as map_name,
    nstats_match_players.time_on_server FROM nstats_match_players 
    LEFT JOIN nstats_gametypes ON nstats_match_players.gametype_id = nstats_gametypes.id
    LEFT JOIN nstats_maps ON nstats_match_players.map_id = nstats_maps.id
    WHERE nstats_match_players.player_id=? AND nstats_match_players.spectator=0${where} 
    
    ORDER BY nstats_match_players.match_date DESC LIMIT ?, ?`;

    const totalMatches = await getPlayerTotalMatches(playerId, where, vars);

    let start = page * perPage;
    vars.push(start);
    vars.push(perPage);
   
    const matches = await simpleQuery(query, vars);

    return {totalMatches, matches};
}


export async function getAllGametypeIds(gametypeId){

    const query = `SELECT player_id FROM nstats_player_totals WHERE gametype_id=?`;

    const result = await simpleQuery(query, [gametypeId]);

    return result.map((r) =>{
        return r.player_id;
    });
}
/**
 * get all player_ids that have played said map
 * @param {*} mapId 
 * @returns 
 */
export async function getAllPlayerMapIds(mapId){

    const query = `SELECT DISTINCT player_id FROM nstats_match_players WHERE map_id=?`;

    const result = await simpleQuery(query, [mapId]);

    return result.map((r) =>{
        return r.player_id;
    });
}


export async function adminGetAllHistory(){

    const query = `SELECT player_id,hwid,mac1,mac2,MIN(match_date) as first_match,MAX(match_date) as last_match,
    COUNT(*) as total_matches, SUM(time_on_server) as playtime
    FROM nstats_match_players GROUP BY player_id,hwid,mac1,mac2`;

    const result = await simpleQuery(query);

    const playerIds = [...new Set(result.map((r) =>{
        return r.player_id;
    }))]

    const basicPlayers = await getBasicPlayerInfo(playerIds);

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        const p = getPlayer(basicPlayers, r.player_id);

        r.name = p.name;
        r.country = p.country;
    }

    return result;
}

export async function getAllNames(){

    const query = `SELECT id,name FROM nstats_players ORDER BY name ASC`;

    return await simpleQuery(query);
}

async function _getAffectedPlayerIds(targetHWID){

    const query = `SELECT player_id,COUNT(*) as total_matches FROM nstats_match_players WHERE hwid=? GROUP BY player_id`;
    const result = await simpleQuery(query, [targetHWID]);

    return result.map((r) =>{
        return r.player_id;
    });
}

export async function adminAssignHWIDUsageToPlayerId(targetHWID, targetPlayerId){

    if(targetHWID.length === 0) throw new Error(`You can't assign a player to a blank hwid string.`);

    const affectedPlayers = await _getAffectedPlayerIds(targetHWID);

    const query = `UPDATE nstats_match_players set player_id=? WHERE hwid=?`;

    const result = await simpleQuery(query, [targetPlayerId, targetHWID]);

    return {"affectedPlayers": affectedPlayers, "result": result};
}


export async function adminRenamePlayer(playerId, newName){

    const query = `UPDATE nstats_players SET name=? WHERE id=?`;

    return await simpleQuery(query, [newName, playerId]);
}


export async function adminDeletePlayer(playerId){

    playerId = parseInt(playerId);

    if(playerId !== playerId) throw new Error(`PlayerId must be a valid integer.`);

    const queries = [
        {"table": "nstats_kills", "playerColumn": "killer_id"},
        {"table": "nstats_kills", "playerColumn": "victim_id"},
        {"table": "nstats_match_ctf", "playerColumn": "player_id"},
        {"table": "nstats_match_dom", "playerColumn": "player_id"},
        {"table": "nstats_match_players", "playerColumn": "player_id"},
        {"table": "nstats_match_weapon_stats", "playerColumn": "player_id"},
        {"table": "nstats_players", "playerColumn": "id"},
        {"table": "nstats_player_totals", "playerColumn": "player_id"},
        {"table": "nstats_player_totals_ctf", "playerColumn": "player_id"},
        {"table": "nstats_player_totals_weapons", "playerColumn": "player_id"},
        {"table": "nstats_rankings", "playerColumn": "player_id"}
    ];

    let totalRows = 0;

    for(let i = 0; i < queries.length; i++){

        const {table, playerColumn} = queries[i];

        const query = `DELETE FROM ${table} WHERE ${playerColumn}=?`;
        const vars = [playerId];

        const result = await simpleQuery(query, vars);

        totalRows += result.affectedRows;
    }

    return totalRows;
}


export async function setAllPlayerHashes(){

    const query = `SELECT id,name FROM nstats_players`;

    const data = await simpleQuery(query);

    for(let i = 0; i < data.length; i++){

        const d = data[i];

        const insertQuery = `UPDATE nstats_players SET hash=? WHERE id=?`;
        await simpleQuery(insertQuery, [md5(d.name), d.id]);
    }
}


export async function getAllIds(){

    const query = `SELECT id FROM nstats_players`;

    const result = await simpleQuery(query);

    return result.map(m => m.id);
}

export async function getPlayersByHashes(hashes){

    if(hashes.length === 0) return [];
    if(hashes.length > 1000) throw new Error(`getPlayersByHashes is limited to 1000 hashes at a time`);

    const query = `SELECT 
    nstats_players.id,
    nstats_players.name,
    nstats_players.country,
    nstats_players.hash,
    nstats_player_totals.last_active,
    nstats_player_totals.total_matches,
    nstats_player_totals.playtime
    FROM nstats_players 
    LEFT JOIN nstats_player_totals ON nstats_player_totals.player_id = nstats_players.id
    WHERE nstats_players.hash IN (?) AND nstats_player_totals.gametype_id=0 AND nstats_player_totals.map_id=0 ORDER BY nstats_players.name ASC`;

    const result = await simpleQuery(query, [hashes]);

    const missing = [...hashes];

    for(let i = 0; i < result.length; i++){

        const r = result[i];
        const index = missing.indexOf(r.hash);
        if(index !== -1) missing.splice(index, 1);
    }

    return {"players": result, missing}
}


async function _setMatchMapGametypeIds(data){

    const query = `UPDATE nstats_match_players SET gametype_id=?, map_id=? WHERE match_id=?`;

    const queries = [];

    for(const [matchId, m] of Object.entries(data)){

        queries.push(simpleQuery(query, [m.gametype, m.map, matchId]));
    }

    await Promise.all(queries);
}


export async function setMatchMapGametypeIds(){

    const query = `SELECT DISTINCT match_id FROM nstats_match_players WHERE map_id=0 AND gametype_id=0`;

    const result = await simpleQuery(query);

    if(result.length === 0) return;

    const uniqueMatchIds = [...new Set([...result.map((r) => r.match_id)])];

    const ids = await getMapAndGametypeIds(uniqueMatchIds);

    await _setMatchMapGametypeIds(ids);
    await setCTFMatchMapGametypeIds(ids);
    await setDOMMatchMapGametypeIds(ids);
    await setWeaponStatsMatchMapGametypeIds(ids);

}




export async function updateMapAverages(playerIds, gametypeId, mapId){

    //REMOVE THIS IF PEOPLE WANT MAP + GAMETYPE RANKINGS ADDED AS WELL
    gametypeId = 0;

    const {data, bFoundCTF, bFoundDOM} = await getPlayerMapTotals(playerIds, mapId);


    let keys = ["score", "frags", "kills", "deaths", "suicides", "team_kills",
        "headshots", "item_amp", "item_belt", "item_boots", "item_body", "item_pads", "item_invis", "item_shp"
    ];

    const ctfKeys = [
        "flag_taken",
        "flag_pickup",
        "flag_drop",
        "flag_assist",
        "flag_cover",
        "flag_seal",
        "flag_cap",
        "flag_kill",
        "flag_return",
        "flag_return_base",
        "flag_return_mid",
        "flag_return_enemy_base",
        "flag_return_save",
    ];


    if(bFoundCTF){
        keys = [...keys, ...ctfKeys];
    }

    if(bFoundDOM){
        keys.push("dom_caps");
    }

    for(let i = 0; i < data.length; i++){

        const t = data[i];

        if(t.playtime <= 0){

            t.bIgnore = true;
            continue;
        }

        const minutes = t.playtime / 60;

        for(let x = 0; x < keys.length; x++){

            const k = keys[x];
    
            if(t[k] <= 0){
                t[k] = 0;
                continue;
            }

            //fix dom_caps issue if a player doesn't have any events
            if(t[k] === undefined) continue;

            t[k] = t[k] / minutes;
        }


        await deleteCurrentPlayerMapAverages(playerIds, gametypeId, mapId);
        await updateCurrentPlayerMapAverages(data, gametypeId, mapId, bFoundCTF);
    }
}


async function bulkInsertPlayerMapAverages(data, mapId){

    const insertVars = [];

    for(let i = 0; i < data.data.length; i++){

        const d = data.data[i];

        insertVars.push([
            d.player_id, mapId, 0, d.playtime, d.total_matches,
            d.score, d.frags, d.kills, d.deaths, d.suicides, d.team_kills, d.headshots,
            d.item_amp , d.item_belt , d.item_boots , d.item_body , d.item_pads , d.item_invis , d.item_shp ,
            d.flag_taken ?? 0,  d.flag_pickup ?? 0,  d.flag_drop ?? 0,  d.flag_assist ?? 0,  d.flag_cover ?? 0,  d.flag_seal ?? 0, 
            d.flag_cap ?? 0,  d.flag_kills ?? 0,  d.flag_return ?? 0,  d.flag_return_base ?? 0,  d.flag_return_mid ?? 0,  d.flag_return_enemy_base ?? 0, 
            d.flag_return_save ?? 0, d.dom_caps ?? 0

        ]);
    }

    const query = `INSERT INTO nstats_player_map_minute_averages (
    player_id, map_id, gametype_id, total_playtime, total_matches,
    score, frags, kills, deaths, suicides, team_kills, headshots,
    item_amp , item_belt , item_boots , item_body , item_pads , item_invis , item_shp,
    flag_taken,flag_pickup,flag_drop,flag_assist,flag_cover,flag_seal,
    flag_cap,flag_kills,flag_return,flag_return_base,flag_return_mid,flag_return_enemy_base,
    flag_return_save,dom_caps
    ) VALUES ?`;


    await bulkInsert(query, insertVars);
}


async function deleteMapMinuteAverages(mapId){

    const query = `DELETE FROM nstats_player_map_minute_averages WHERE map_id=?`;

    await simpleQuery(query, [mapId]);
}

//used for upgrade for earlier version
export async function setAllPlayerMapAverages(){

    const mapIds = await getAllMapIds();

    for(let i = 0; i < mapIds.length; i++){

        const mId = mapIds[i];

        const playerIds = await getUniquePlayerIdsOnMap(mId);

        const totals = await getPlayerMapTotals(playerIds, mId);

        await deleteMapMinuteAverages(mId);
        await bulkInsertPlayerMapAverages(totals, mId);
    }
}

export async function setPlayerMapAverages(mapId){


    const playerIds = await getUniquePlayerIdsOnMap(mapId);

    const totals = await getPlayerMapTotals(playerIds, mapId);

    await deleteMapMinuteAverages(mapId);
    await bulkInsertPlayerMapAverages(totals, mapId);
    
}


export async function getPlayerIdsInMatch(matchId){

    const query = `SELECT player_id FROM nstats_match_players WHERE match_id=?`;

    const result = await simpleQuery(query, [matchId]);

    if(result.length === 0) return [];

    return result.map((r) =>{
        return r.player_id;
    });
}


export async function getMatchesPlayedCountBetween(id, start, end){

    const query = `SELECT match_date,time_on_server as playtime FROM nstats_match_players WHERE player_id=? AND match_date>=? AND match_date<=? ORDER BY match_date DESC`;

    const result = await simpleQuery(query, [id, start, end]);

    return mysqlSetTotalsByDate(result, "match_date", ["playtime"]);
    
}


export async function getPlayedGametypes(playerId){

    const query = `SELECT gametype_id,COUNT(*) as total_matches FROM nstats_match_players WHERE player_id=? GROUP BY gametype_id`;

    return await simpleQuery(query, [playerId]);

}

export async function getPlayedMaps(playerId){
    const query = `SELECT map_id,COUNT(*) as total_matches FROM nstats_match_players WHERE player_id=? GROUP BY map_id`;

    return await simpleQuery(query, [playerId]);
}

async function getUniquePlayedType(playerId, type){

    type = type.toLowerCase();

    if(type !== "gametypes" && type !== "maps") throw new Error(`Not a valid getUniquePlayedType`);
    
    const query = `SELECT DISTINCT ${(type === "gametypes") ? "gametype_id" : "map_id"} as target_id FROM nstats_match_players WHERE player_id=?`;

    const result = await simpleQuery(query, [playerId]);

    return result.map((r) =>{
        return r.target_id;
    });

}

export async function getUniquePlayedGametypes(playerId){
    return await getUniquePlayedType(playerId, "gametypes");
}

export async function getUniquePlayedMaps(playerId){
    return await getUniquePlayedType(playerId, "maps");
}

export async function getPlayerActivityHeatmapData(playerId, gametypeId, mapId, year, month){

    const {start, end, lastDayOfMonth} = getHeatmapDates(month, year);

    let where = ``;
    const vars = [];

    if(gametypeId != 0){
        where += ` AND gametype_id=?`;
        vars.push(gametypeId);
    }

    if(mapId !== 0){
        where += ` AND map_id=?`;
        vars.push(mapId);
    }

    const query = `SELECT match_date,time_on_server as playtime,match_result 
    FROM nstats_match_players WHERE player_id=? AND match_date>=? AND match_date<?${where} ORDER BY match_date DESC`;
    const result = await simpleQuery(query, [playerId, start, end, ...vars]);

    const data = {};

    for(let i = 0; i <= lastDayOfMonth; i++ ){
        data[i] = {
            "matches": 0, 
            "playtime": 0,
            "wins": 0,
            "draws": 0,
            "losses": 0,
            "winrate": 0
        };
    }
    
    for(let i = 0; i < result.length; i++){

        const r = result[i];
        const currentDate = new Date(r.match_date);

        const index = currentDate.getDate();
        data[index].matches++;
        data[index].playtime += r.playtime;

        if(r.match_result === "w"){
            data[index].wins++;
        }else if(r.match_result === "l"){
            data[index].losses++;
        }else if(r.match_result === "d"){
            data[index].draws++;
        }

        if(data[index].wins > 0){
            data[index].winrate = data[index].wins / data[index].matches * 100;
        }
    }

    return data;
}