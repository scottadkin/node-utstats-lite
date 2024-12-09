import {simpleQuery, bulkInsert} from "./database.mjs";
import {getMultipleMatchDetails} from "./matches.mjs";
import { getWinner, getPlayer } from "./generic.mjs";
import { deleteAllPlayerTotals as deleteAllPlayerGametypeTotals } from "./gametypes.mjs";
import { getMapAndGametypeIds } from "./matches.mjs";
import { setMatchMapGametypeIds as setCTFMatchMapGametypeIds } from "./ctf.mjs";
import { setMatchMapGametypeIds as setDOMMatchMapGametypeIds } from "./domination.mjs";
import { setMatchMapGametypeIds as setWeaponStatsMatchMapGametypeIds } from "./weapons.mjs";
import md5 from "md5";

export async function getPlayerMasterId(playerName/*, hwid, mac1, mac2*/){

    //const query = `SELECT id FROM nstats_players WHERE name=? AND hwid=? AND mac1=? AND mac2=?`;
    const query = `SELECT id FROM nstats_players WHERE name=?`;

    const result = await simpleQuery(query, [playerName]);

    if(result.length === 0) return null;

    return result[0].id;
}

export async function createMasterPlayer(name, ip, hwid, mac1, mac2, matchDate){

    const query = `INSERT INTO nstats_players VALUES(NULL,?,"",0,0,0,0,0,0,0,0,0,?,?)`;

    const hash = md5(name);

    //const result = await simpleQuery(query, [name, ip, hwid, mac1, mac2]);
    const result = await simpleQuery(query, [name, matchDate, hash]);

    return result.insertId;
}

export async function getMasterPlayersStats(playerIds){

    if(playerIds.length === 0) return null;

    const query = `SELECT 
    player_id,
    COUNT(*) as total_matches,
    SUM(score) as total_score,
    SUM(frags) as total_frags,
    SUM(kills) as total_kills,
    SUM(deaths) as total_deaths,
    SUM(suicides) as total_suicides,
    AVG(TTL) as total_ttl,
    SUM(time_on_server) as total_playtime
    FROM nstats_match_players
    WHERE player_id IN (?) GROUP BY player_id`;

    const result = await simpleQuery(query, [playerIds]);

    return result;
}

export async function updateMasterPlayer(totals, country, date){

    let query = ``;
    let vars = [];

    const t = totals;

    let eff = 0;

    const totalKills = parseInt(t.total_kills);
    const allDeaths = parseInt(t.total_deaths);

    if(totalKills > 0){
 
        if(allDeaths === 0){
            eff = 100;
        }else{
            eff = (totalKills / (totalKills + allDeaths)) * 100;
        }
    }

    if(country !== null && date !== null){

        query = `UPDATE nstats_players SET 
        country=?,matches=?,score=?,frags=?,kills=?,deaths=?,suicides=?,eff=?,ttl=?,playtime=?,
        last_active = IF(last_active IS NULL, ?, IF(last_active < ?, ?, last_active)) 
        WHERE id=?`;

        vars = [country, t.total_matches, t.total_score, t.total_frags, totalKills, 
            t.total_deaths, t.total_suicides, eff, t.total_ttl, t.total_playtime, 
            date, date, date,
            t.player_id
        ];

    }else{
        query = `UPDATE nstats_players SET 
        matches=?,score=?,frags=?,kills=?,deaths=?,suicides=?,eff=?,ttl=?,playtime=? 
        WHERE id=?`;

        vars = [t.total_matches, t.total_score, t.total_frags, totalKills, 
            t.total_deaths, t.total_suicides, eff, t.total_ttl, t.total_playtime, 
            t.player_id
        ];
    }

    
    await simpleQuery(query, vars);
}

export async function updateMasterPlayers(playerIds, idsToCountries, date){

    const totals = await getMasterPlayersStats(playerIds);

    if(totals === null) return;

    for(let i = 0; i < totals.length; i++){

        const t = totals[i];

        await updateMasterPlayer(t, idsToCountries[t.player_id], date);
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
        mac1, mac2, match_id, map_id, gametype_id, match_date, bot, ping_min, ping_avg, ping_max,
        team, score, frags, kills, deaths,
        suicides, team_kills, efficiency, time_on_server, ttl,
        first_blood, spree_1, spree_2, spree_3, spree_4,
        spree_5, spree_best, multi_1, multi_2, multi_3,
        multi_4, multi_best, headshots, item_amp, item_belt,
        item_boots, item_body, item_pads, item_invis, item_shp
    ) VALUES ?`;


    await bulkInsert(query, insertVars);
}

/*
export async function insertPlayerMatchData(playerData, matchId, matchDate){

    const p = playerData;

    const query = `INSERT INTO nstats_match_players VALUES(NULL,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,
    ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

    const vars = [
        p.masterId,
        p.bSpectator,
        p.ip,
        p.country,
        p.hwid,
        p.mac1,
        p.mac2,
        matchId,
        matchDate,
        p.bBot,
        p.team,
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
    ];

    await simpleQuery(query, vars);
}*/


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

export async function getTotalPlayers(name){

    const query = `SELECT COUNT(*) as total_players FROM nstats_players WHERE name LIKE ?`;
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
        "suicides", "eff", "matches", "playtime"
    ];

    const sortIndex = validSortBys.indexOf(sortBy);

    if(sortIndex === -1){
        throw new Error(`${sortBy} is not a valid sortBy option`);
    }

    let start = page * perPage;

    const query = `SELECT * FROM nstats_players WHERE name LIKE ? ORDER BY ${validSortBys[sortIndex]} ${order} LIMIT ?, ?`;

    const totalPlayers = await getTotalPlayers(name);
    const result = await simpleQuery(query, [`%${name}%`, start, perPage]);

    return {"players": result, "totalPlayers": totalPlayers};
}


async function getPlayersAllMatchData(playerIds){

    if(playerIds.length === 0) return [];

    const totalQuery = `SELECT 
    player_id,
    match_id,
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

    const result = await simpleQuery(totalQuery, [playerIds]);

    const matchIds = [... new Set(result.map((r) =>{
        return r.match_id;
    }))]


    return {"data": result, "matchIds": matchIds}
}

function _updateTotals(totals, gametypeId, playerData, date, bWinner, bDraw){


    if(totals[playerData.player_id] === undefined){
        totals[playerData.player_id] = {};
    }

    if(totals[playerData.player_id][gametypeId] === undefined){

        let eff = 0;

        const p = playerData;

        if(p.deaths === 0){
            eff = 100;
        }else{
            eff = (p.kills / (p.kills + p.deaths + p.deaths)) * 100;
        }

        totals[playerData.player_id][gametypeId] = {
            "matches": 1,
            "playtime": parseFloat(playerData.time_on_server),
            "totalTtl": playerData.ttl,
            "eff": eff,
            "lastActive": date,
            "wins": (bWinner === 1) ? 1 : 0,
            "losses": (bWinner === 0) ? 1 : 0,
            "draws": (bDraw === 1) ? 1 : 0,
            "winRate": (bWinner === 1) ? 100  : 0,
            ...playerData
        };

        return;
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
      "item_shp"
    ];

    const higherBetter = [
        "spree_best",
        "multi_best"
    ];

    const t = totals[playerData.player_id][gametypeId];

    t.matches++;

    for(let i = 0; i < mergeTypes.length; i++){

        const m = mergeTypes[i];

        t[m] += playerData[m];
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
            t.eff = (t.kills / (t.kills + t.deaths + t.deaths)) * 100;
        }
    }

    const matchDate = Math.floor(new Date(date) * 0.001);
    const totalsDate = Math.floor(new Date(t.lastActive) * 0.001);

    //console.log(matchDate, totalsDate);

    if(matchDate > totalsDate){
        t.lastActive = date;
    }

    t.playtime += parseFloat(playerData.time_on_server);

    if(bWinner === 1) t.wins++;
    if(bWinner === 0 && bDraw === 0) t.losses++;
    if(bDraw === 1) t.draws++;

    if(t.wins > 0){
        t.winRate = t.wins / t.matches * 100;
    }
}

/**
 * 
 * @param {*} playerId 
 * @returns 
 */
export async function calcPlayerTotals(playerIds){



    if(playerIds.length === 0) return [];

    const matchData = await getPlayersAllMatchData(playerIds);

    //get gametype and map id for every played match
    const matchBasicInfo = await getMultipleMatchDetails(matchData.matchIds);

    //playerId => gametypes => gametypeId => gametypeTotals
    const totals = {};

    for(let i = 0; i < matchData.data.length; i++){

        const m = matchData.data[i];
        const info = matchBasicInfo[m.match_id];

        const matchResult = getWinner(info);
        const playerTeam = m.team;
        //console.log(matchResult);

        let bWinner = 0;
        let bDraw = 0;

        const gametypeId = info.gametype;
        const date = info.date;
        //const mapId = matchTypeIds[m.match_id].map;
        //console.log(gametypeId, mapId);

        if(matchResult.type === "solo"){

            if(info.winnerId === m.player_id){
                bWinner = 1;
            }

        }else{

            if(info.bDraw){
                bDraw = (matchResult.winners.indexOf(playerTeam) !== -1) ? 1 : 0;
            }else{
                bWinner = (matchResult.winners.indexOf(playerTeam) !== -1) ? 1 : 0;
            }
        }

        //console.log(m);
        //all time totals
        _updateTotals(totals, 0, m, date, bWinner, bDraw);
        //gametype totals
        _updateTotals(totals, gametypeId, m, date, bWinner, bDraw);
        
    }

    //delete old player totals in nstats_player_totals
    //insert new data

    return totals;

}


async function deletePlayerGametypeTotals(playerId, gametypeId){

    const query = `DELETE FROM nstats_player_totals WHERE player_id=? AND gametype_id=?`;

    return await simpleQuery(query, [playerId, gametypeId]);
}



async function insertPlayerGametypeTotals(data){


    const insertVars = [];

    for(const [playerId, gametypes] of Object.entries(data)){

        for(const [gametypeId, g] of Object.entries(gametypes)){


            await deletePlayerGametypeTotals(playerId, gametypeId);

            insertVars.push([
                playerId, gametypeId,g.lastActive, g.playtime, g.matches, 
                g.wins, g.draws, g.losses, g.winRate, g.score,
                g.frags, g.kills, g.deaths, g.suicides, g.team_kills,
                g.eff, g.ttl, g.first_blood, g.spree_1, g.spree_2,
                g.spree_3,g.spree_4,g.spree_5,g.spree_best,g.multi_1,
                g.multi_2,g.multi_3,g.multi_4,g.multi_best,g.headshots,
                g.item_amp,g.item_belt,g.item_boots,g.item_body,g.item_pads,
                g.item_invis, g.item_shp
            ]);
        }
    }

    const query = `INSERT INTO nstats_player_totals (player_id, gametype_id,last_active,playtime,total_matches,
            wins,draws,losses,winrate,score,
            frags,kills,deaths,suicides,team_kills,
            efficiency,ttl, first_blood, spree_1,spree_2,
            spree_3,spree_4, spree_5, spree_best, multi_1,
            multi_2,multi_3,multi_4,multi_best,headshots,
            item_amp, item_belt, item_boots, item_body, item_pads,
            item_invis, item_shp ) VALUES ?`;

    await bulkInsert(query, insertVars);
}


export async function updatePlayerGametypeTotals(playerIds){

    const totals = await calcPlayerTotals(playerIds);

    await insertPlayerGametypeTotals(totals);
}


export async function getPlayerGametypeTotals(playerId){

    const query = `SELECT * FROM nstats_player_totals WHERE player_id=?`;

    return await simpleQuery(query, [playerId]);
}


async function getPlayerTotalMatches(playerId){

    const query = `SELECT total_matches FROM nstats_player_totals WHERE player_id=? and gametype_id=0`;

    const result = await simpleQuery(query, [playerId]);

    if(result.length === 0) return 0;

    return result[0].total_matches;
}

// add page and perpage filtering
export async function getPlayerRecentMatches(playerId, page, perPage){

    page = parseInt(page);
    perPage = parseInt(perPage);

    if(page !== page || perPage !== perPage) throw new Error(`Page, or perPage is not a valid integer.`);

    page = page - 1;

    if(page < 0) page = 0;
    if(perPage < 1 || perPage > 100) perPage = 50;
    const query = `SELECT match_id,match_date,team,time_on_server FROM nstats_match_players WHERE player_id=? AND spectator=0 ORDER BY match_date DESC LIMIT ?, ?`;

    let start = page * perPage;

    const totalMatches = await getPlayerTotalMatches(playerId);

    const matches = await simpleQuery(query, [playerId, start, perPage]);

    return {totalMatches, matches};
}


export async function getAllGametypeIds(gametypeId){

    const query = `SELECT player_id FROM nstats_player_totals WHERE gametype_id=?`;

    const result = await simpleQuery(query, [gametypeId]);

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


export async function recalcAllPlayerTotals(){

    const playerIds = await getAllIds();

    await deleteAllPlayerGametypeTotals();

    await updatePlayerGametypeTotals(playerIds);
}


export async function getPlayersByHashes(hashes){

    if(hashes.length === 0) return [];

    const query = `SELECT * FROM nstats_players WHERE hash IN (?)`;

    return await simpleQuery(query, [hashes]);
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