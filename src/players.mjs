import {simpleQuery, bulkInsert, sqlInsertReturnRowId, sqlInsertOnDuplicateUpdate, bulkUpdate, sqliteBTableExists} from "./database.mjs";
import { getPlayer, mysqlSetTotalsByDate, getHeatmapDates, createRandomString, sortByName, convertTimestamp, toPlaytime } from "./generic.mjs";
import { getMapAndGametypeIds } from "./matches.mjs";
import { 
    ctfChangePlayerMatchIds, getPlayerCTFTotals, 
    setMatchMapGametypeIds as setCTFMatchMapGametypeIds,
    updatePlayerTotals as ctfUpdatePlayerTotals
 } from "./ctf.mjs";
import { setMatchMapGametypeIds as setDOMMatchMapGametypeIds } from "./domination.mjs";
import { setMatchMapGametypeIds as setWeaponStatsMatchMapGametypeIds } from "./weapons.mjs";
import md5 from "md5";
import { DEFAULT_DATE } from "../config.mjs";
import Message from "./message.mjs";
import { getAllSeasonIds, getPlayerActiveSeasons, getSeasonById, seasonsGetMatchesSeasonIds } from "./seasons.mjs";
import { getCategorySettings } from "./siteSettings.mjs";
import { getPageLayout } from "./pageLayout.mjs";
import { getPlayerTotals as getPlayerWeaponTotals } from "./weapons.mjs";
import { ctfLeagueRecalculatePlayers, getLeagueSiteSettings, getPlayerMapsLeagueData } from "./ctfLeague.mjs";
import { getPlayerWeaponDamageTotals } from "./playerWeaponDamage.mjs";
import { getPlayerRankings, rankingsRecalculatePlayers } from "./rankings.mjs";
const DEFAULT_PLAYER_SETTINGS = [
    {"category": "Importer", "name": "Auto Assign HWID To First Used Name", "valueType": "bool", "value": "false"}
];

export const PLAYER_TOTALS_COLUMNS_MATCHES = `player_id,
COUNT(*) as total_matches,
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
SUM(time_on_server) as playtime,
SUM(ttl) as ttl,
SUM(first_blood) as first_blood,
SUM(spree_1) as spree_1,
SUM(spree_2) as spree_2,
SUM(spree_3) as spree_3,
SUM(spree_4) as spree_4,
SUM(spree_5) as spree_5,
MAX(spree_best) as spree_best,
SUM(spree_best) as total_spree_best,
SUM(multi_1) as multi_1,
SUM(multi_2) as multi_2,
SUM(multi_3) as multi_3,
SUM(multi_4) as multi_4,
MAX(multi_best) as multi_best,
SUM(multi_best) as total_multi_best,
SUM(headshots) as headshots,
SUM(item_amp) as item_amp,
SUM(item_belt) as item_belt,
SUM(item_boots) as item_boots,
SUM(item_body) as item_body,
SUM(item_pads) as item_pads,
SUM(item_invis) as item_invis,
SUM(item_shp) as item_shp,
SUM(dom_caps) as dom_caps`;


export const VALID_PLAYER_SORT_BYS = [
    "name", "last_active", "score", "frags", "kills", "deaths",
    "suicides", "efficiency", "matches", "playtime"
];

const AVERAGE_TYPES = [
    "score",
    "frags",
    "kills",
    "deaths",
    "suicides",
    "team_kills",
    "spree_1",
    "spree_2",
    "spree_3",
    "spree_4",
    "spree_5",
    "avg_spree_best",
    "multi_1",
    "multi_2",
    "multi_3",
    "multi_4",
    "avg_multi_best",
    "headshots",
    "item_amp",
    "item_belt",
    "item_boots",
    "item_body",
    "item_pads",
    "item_invis",
    "item_shp",
    "dom_caps"
];


export const PLAYER_TOTALS_MAX_COLUMNS = `
MAX(time_on_server) as max_playtime,
MAX(score) as max_score,
MAX(frags) as max_frags,
MAX(kills) as max_kills,
MAX(deaths) as max_deaths,
MAX(suicides) as max_suicides,
MAX(team_kills) as max_team_kills,
MAX(ttl) as max_ttl,
MAX(spree_1) as max_spree_1,
MAX(spree_2) as max_spree_2,
MAX(spree_3) as max_spree_3,
MAX(spree_4) as max_spree_4,
MAX(spree_5) as max_spree_5,
MAX(spree_best) as max_spree_best,
MAX(multi_1) as max_multi_1,
MAX(multi_2) as max_multi_2,
MAX(multi_3) as max_multi_3,
MAX(multi_4) as max_multi_4,
MAX(multi_best) as max_multi_best,
MAX(headshots) as max_headshots,
MAX(item_amp) as max_item_amp,
MAX(item_belt) as max_item_belt,
MAX(item_boots) as max_item_boots,
MAX(item_body) as max_item_body,
MAX(item_pads) as max_item_pads,
MAX(item_invis) as max_item_invis,
MAX(item_shp) as max_item_shp,
MAX(dom_caps) as max_dom_caps
`;

function getPlayerTotalsColumnsProfile(){

    const pT = "nstats_player_totals";


    const toGet = [
        "gametype_id", "map_id", "last_active", "playtime", "total_matches", "wins", "draws",
        "losses", "winrate", "score", "frags", "kills", "deaths", "suicides", "team_kills", "efficiency",
        "ttl", "first_blood", "spree_1", "spree_2", "spree_3", "spree_4", "spree_5", "spree_best",
        "multi_1", "multi_2", "multi_3", "multi_4", "multi_best", "headshots", "item_amp", "item_pads", 
        "item_boots", "item_body", "item_pads", "item_invis", "item_shp", "item_belt",
    ];

    for(let i = 0; i < AVERAGE_TYPES.length; i++){

        const k = AVERAGE_TYPES[i];

        if(k === "avg_multi_best" || k == "avg_spree_best"){

            toGet.push(k);
        }else{

            toGet.push(`avg_${k}`);
            toGet.push(`epm_${k}`);
        }
    }

    let string = ``;

    for(let i = 0; i < toGet.length; i++){

        const g = toGet[i];

        string += `${pT}.${g}`;

        if(i < toGet.length - 1) string += `, `;
    }


    return string;

}


function getPlayerTotalsMaxColumns(){

    const toGet = [
        "playtime", "score", "frags", "kills", "deaths", "suicides",
        "team_kills", "spree_1", "spree_2", "spree_3", "spree_4", "spree_5", "spree_best",
        "multi_1", "multi_2", "multi_3", "multi_4", "multi_best", "headshots", "item_amp", "item_belt",
        "item_boots", "item_body", "item_pads", "item_invis", "item_shp", "dom_caps"
    ];

    const table = "nstats_player_totals_max";

    let string = ``;

    for(let i = 0; i < toGet.length; i++){

        string += `${table}.max_${toGet[i]}`;
        if(i < toGet.length - 1) string += `,`;
    }

    return string;
}

export async function getPlayerMasterId(playerName/*, hwid, mac1, mac2*/){

    //const query = `SELECT id FROM nstats_players WHERE name=? AND hwid=? AND mac1=? AND mac2=?`;
    const query = `SELECT id FROM nstats_players WHERE name=?`;

    const result = await simpleQuery(query, [playerName]);

    if(result.length === 0) return null;

    return result[0].id;
}

export async function getPlayerMasterIdCreateOnNotExists(name){

    const findQuery = `SELECT id FROM nstats_players WHERE name=?`;

    const result = await simpleQuery(findQuery, [name]);

    if(result.length === 0) return await createMasterPlayer(name);

    return result[0].id;

}

export async function createMasterPlayer(name){

    const query = `INSERT INTO nstats_players VALUES(NULL,?,'',?)`;

    const hash = md5(name);

    //const result = await simpleQuery(query, [name, ip, hwid, mac1, mac2]);
    const result = await sqlInsertReturnRowId(query, [name, hash]);

    return result;
}

export async function getMultiplePlayersMasterId(names){

    if(names.length === 0) return {};

    const players = [];

    for(let i = 0; i < names.length; i++){

        const result = await getPlayerMasterIdCreateOnNotExists(names[i]);
        players.push({"name": names[i], "id": result});

    }

    return players;

}


export async function updateMasterPlayer(playerId, country){

    if(country === null || country === "") country = "xx";

    const query = `UPDATE nstats_players SET country=? WHERE id=?`;

    await simpleQuery(query, [country, playerId]);
}

export async function updateMasterPlayers(playerIds, idsToCountries){

    const promises = [];

    for(let i = 0; i < playerIds.length; i++){

        const p = playerIds[i];
        promises.push(updateMasterPlayer(p, idsToCountries[p] ?? "xx"));
    }

    return await Promise.all(promises);
}


export async function bulkInsertPlayerMatchData(players, matchId, matchDate, gametypeId, mapId){

    if(players.length === 0) return;

    const insertVars = [];

    for(let i = 0; i < players.length; i++){

        const p = players[i];

        insertVars.push([
            p.masterId,
            (p.playtime === 0) ? 1 : 0,
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
            p.stats.items.shp, 
            p.stats.dom.totalCaps
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
        item_boots, item_body, item_pads, item_invis, item_shp, dom_caps
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
 * @param {(Number|String)} playerId 
 * @returns {Promise<Object|null>}
 */
export async function getPlayerProfileInfo(playerId, seasonId){

    let column = "id";

    if(playerId.length === 32){
        column = "hash";
    }

    const query = `SELECT 
    nstats_player_totals.playtime,
    nstats_player_totals.last_active,
    nstats_players.id,
    nstats_players.name,
    nstats_players.country,
    nstats_players.hash
    FROM nstats_player_totals 
    LEFT JOIN nstats_players ON nstats_players.id = nstats_player_totals.player_id
    WHERE nstats_player_totals.player_id=? AND nstats_player_totals.season_id=? 
    AND nstats_player_totals.gametype_id=0 AND nstats_player_totals.map_id=0`;

    const result = await simpleQuery(query, [playerId, seasonId]);

    if(result.length === 0) return null;
    return result[0];

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

export async function getTotalPlayers(name, seasonId){

    seasonId = parseInt(seasonId);
    if(seasonId !== seasonId) seasonId = 0;

    const query = `SELECT COUNT(*) as total_players 
    FROM nstats_player_totals
    LEFT JOIN nstats_players ON nstats_players.id = nstats_player_totals.player_id
    WHERE nstats_players.name LIKE ? AND nstats_player_totals.gametype_id=0 AND nstats_player_totals.map_id=0
    AND nstats_player_totals.season_id=?`;
    const result = await simpleQuery(query, [`%${name}%`, seasonId]);

    return result[0].total_players;
}


export async function searchPlayers(name, sortBy, order, page, perPage, seasonId){

    sortBy = sortBy.toLowerCase();
    order = order.toUpperCase();
    perPage = parseInt(perPage);
    page = parseInt(page);
    seasonId = parseInt(seasonId);
    if(seasonId !== seasonId)  seasonId = 0;

    if(page !== page) page = 1;
    page--;

    if(page < 0) page = 0;

    if(perPage !== perPage) perPage = 25;
    if(perPage < 0) perPage = 25;
    if(perPage > 100) perPage = 100;

    if(order !== "ASC" && order !== "DESC"){
        order = "ASC";
    }


    if(sortBy === "eff") sortBy = "efficiency";

    const sortIndex = VALID_PLAYER_SORT_BYS.indexOf(sortBy);

    if(sortIndex === -1){
        throw new Error(`${sortBy} is not a valid sortBy option`);
    }

    let start = page * perPage;

    const playerMainColumns = ["name","country"];
    const sortByTable = (playerMainColumns.indexOf(sortBy) === -1) ? "nstats_player_totals" : "nstats_players";

    if(sortBy !== "matches"){
        sortBy = VALID_PLAYER_SORT_BYS[sortIndex];
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
    AND nstats_player_totals.season_id=?
    ORDER BY ${sortByTable}.${sortBy} ${order} LIMIT ?, ?`;
    // FROM nstats_players WHERE name LIKE ? ORDER BY ${validSortBys[sortIndex]} ${order} LIMIT ?, ?`;

    const promises = [getTotalPlayers(name, seasonId), simpleQuery(query, [`%${name}%`, seasonId, start, perPage])];

    const [totalPlayers, result] = await Promise.all(promises);

    return {"players": result, "totalPlayers": totalPlayers};
}


/**
 * 
 * @param {number} seasonId 
 * @returns SQL Query for the result of the player totals CTE
 */
function getPlayerTotalsCTEQuery(bGroupSeasons, bGroupGametypes, bGroupMaps){

    const targets = [
        "total_matches", "playtime", "kills", "deaths", "team_kills", "suicides", "wins",
        "score", "frags",
        "suicides", "headshots", "spree_1", "spree_2", "spree_3", "spree_4", "spree_5", "total_spree_best",
        "multi_1", "multi_2", "multi_3", "multi_4", "total_multi_best", "first_blood", "ttl",

        "item_amp",
        "item_belt",
        "item_boots",
        "item_body",
        "item_pads",
        "item_invis",
        "item_shp", "dom_caps"
    ];

    const totals = {};

    for(let i = 0; i < targets.length; i++){

        const t = targets[i];

        if(t === "playtime"){
            totals[t] = `(SUM(playtime) / 60)`
        }else{
            totals[t] = `(SUM(${t}) * 1.0)`
        }
    }


    return `SELECT 
        player_id,
        MAX(last_active) as last_active,
        SUM(wins) as wins,
        SUM(draws) as draws,
        SUM(losses) as losses,
        SUM(playtime) as playtime,
        ${totals.score} as score,
        ${totals.frags} as frags,
        ${totals.kills} as kills,
        ${totals.deaths} as deaths,
        ${totals.suicides} as suicides,
        ${totals.team_kills} as team_kills,
        ${totals.ttl} / COUNT(*) as ttl,
        ${totals.first_blood} as first_blood,
        ${totals.spree_1} as spree_1,
        ${totals.spree_2} as spree_2,
        ${totals.spree_3} as spree_3,
        ${totals.spree_4} as spree_4,
        ${totals.spree_5} as spree_5,
        MAX(spree_best) as spree_best,
        ${totals.multi_1} as multi_1,
        ${totals.multi_2} as multi_2,
        ${totals.multi_3} as multi_3,
        ${totals.multi_4} as multi_4,
        MAX(multi_best) as multi_best,
        ${totals.headshots} as headshots,
        ${totals.item_amp} as item_amp,
        ${totals.item_belt} as item_belt,
        ${totals.item_boots} as item_boots,
        ${totals.item_body} as item_body,
        ${totals.item_pads} as item_pads,
        ${totals.item_invis} as item_invis,
        ${totals.item_shp} as item_shp,
        ${totals.dom_caps} as dom_caps,
        
        ${totals.total_matches} as total_matches,
        ${(!bGroupGametypes) ? "0 as gametype_id" : "gametype_id"},
        ${(!bGroupMaps) ? "0 as map_id" : "map_id"},
        ${(bGroupSeasons) ? "season_id" : "0 as season_id"},
        (CASE 
            WHEN ${totals.kills} > 0 AND ${totals.deaths} + ${totals.team_kills} > 0 
                THEN ${totals.kills}  / (${totals.kills} + ${totals.deaths} + ${totals.team_kills}) * 100
            WHEN ${totals.kills} > 0 AND ${totals.deaths} + ${totals.team_kills} = 0
                THEN 100
            ELSE 0
        END
        ) as efficiency,
        (${totals.wins} / ${totals.total_matches}) * 100 as winrate,
        ${totals.score} / ${totals.total_matches} as avg_score,
        ${totals.frags} / ${totals.total_matches} as avg_frags,
        ${totals.kills} / ${totals.total_matches} as avg_kills,
        ${totals.deaths} / ${totals.total_matches} as avg_deaths,
        ${totals.suicides} / ${totals.total_matches} as avg_suicides,
        ${totals.team_kills} / ${totals.total_matches} as avg_team_kills,
        ${totals.spree_1} / ${totals.total_matches} as avg_spree_1,
        ${totals.spree_2} / ${totals.total_matches} as avg_spree_2,
        ${totals.spree_3} / ${totals.total_matches} as avg_spree_3,
        ${totals.spree_4} / ${totals.total_matches} as avg_spree_4,
        ${totals.spree_5} / ${totals.total_matches} as avg_spree_5,
        ${totals.total_spree_best} / ${totals.total_matches} as avg_spree_best,
        ${totals.multi_1} / ${totals.total_matches} as avg_multi_1,
        ${totals.multi_2} / ${totals.total_matches} as avg_multi_2,
        ${totals.multi_3} / ${totals.total_matches} as avg_multi_3,
        ${totals.multi_4} / ${totals.total_matches} as avg_multi_4,
        ${totals.total_multi_best} / ${totals.total_matches} as avg_multi_best,
        ${totals.headshots} / ${totals.total_matches} as avg_headshots,
        ${totals.item_amp} / ${totals.total_matches} as avg_item_amp,
        ${totals.item_belt} / ${totals.total_matches} as avg_item_belt,
        ${totals.item_boots} / ${totals.total_matches} as avg_item_boots,
        ${totals.item_body} / ${totals.total_matches} as avg_item_body,
        ${totals.item_pads} / ${totals.total_matches} as avg_item_pads,
        ${totals.item_invis} / ${totals.total_matches} as avg_item_invis,
        ${totals.item_shp} / ${totals.total_matches} as avg_item_shp,
        ${totals.dom_caps} / ${totals.total_matches} as avg_dom_caps,


        ${totals.score} / ${totals.playtime} as epm_score,
        ${totals.frags} / ${totals.playtime} as epm_frags,
        ${totals.kills} / ${totals.playtime} as epm_kills,
        ${totals.team_kills}  / ${totals.playtime} as epm_team_kills,
        ${totals.deaths} / ${totals.playtime} as epm_deaths,
        ${totals.suicides} / ${totals.playtime} as epm_suicides,

        ${totals.multi_1} / ${totals.playtime} as epm_multi_1,
        ${totals.multi_2} / ${totals.playtime} as epm_multi_2,
        ${totals.multi_3} / ${totals.playtime} as epm_multi_3,
        ${totals.multi_4} / ${totals.playtime} as epm_multi_4,

        ${totals.spree_1} / ${totals.playtime} as epm_spree_1,
        ${totals.spree_2} / ${totals.playtime} as epm_spree_2,
        ${totals.spree_3} / ${totals.playtime} as epm_spree_3,
        ${totals.spree_4} / ${totals.playtime} as epm_spree_4,
        ${totals.spree_5} / ${totals.playtime} as epm_spree_5,

        ${totals.headshots} / ${totals.playtime} as epm_headshots,
        ${totals.item_amp} / ${totals.playtime} as epm_item_amp,
        ${totals.item_belt} / ${totals.playtime} as epm_item_belt,
        ${totals.item_boots} / ${totals.playtime} as epm_item_boots,
        ${totals.item_body} / ${totals.playtime} as epm_item_body,
        ${totals.item_pads} / ${totals.playtime} as epm_item_pads,
        ${totals.item_invis} / ${totals.playtime} as epm_item_invis,
        ${totals.item_shp} / ${totals.playtime} as epm_item_shp,
        ${totals.dom_caps} / ${totals.playtime} as epm_dom_caps,

        MAX(max_playtime) as max_playtime,
        MAX(max_score) as max_score,
        MAX(max_frags) as max_frags,
        MAX(max_kills) as max_kills,
        MAX(max_deaths) as max_deaths,
        MAX(max_suicides) as max_suicides,
        MAX(max_team_kills) as max_team_kills,
        MAX(max_ttl) as max_ttl,
        MAX(max_spree_1) as max_spree_1,
        MAX(max_spree_2) as max_spree_2,
        MAX(max_spree_3) as max_spree_3,
        MAX(max_spree_4) as max_spree_4,
        MAX(max_spree_5) as max_spree_5,
        MAX(max_spree_best) as max_spree_best,
        MAX(max_multi_1) as max_multi_1,
        MAX(max_multi_2) as max_multi_2,
        MAX(max_multi_3) as max_multi_3,
        MAX(max_multi_4) as max_multi_4,
        MAX(max_multi_best) as max_multi_best,
        MAX(max_headshots) as max_headshots,
        MAX(max_item_amp) as max_item_amp,
        MAX(max_item_belt) as max_item_belt,
        MAX(max_item_boots) as max_item_boots,
        MAX(max_item_body) as max_item_body,
        MAX(max_item_pads) as max_item_pads,
        MAX(max_item_invis) as max_item_invis,
        MAX(max_item_shp) as max_item_shp,
        MAX(max_dom_caps) as max_dom_caps

        FROM pt GROUP BY player_id${(bGroupSeasons) ? ",season_id" : ""}${(bGroupGametypes) ? ",gametype_id" : ""}${(bGroupMaps) ? ",map_id" : ""}`;
}

async function calculatePlayerTotals(seasonId, gametypeId, mapId, playerIds){

    if(playerIds.length === 0) return;

    let where = `WHERE spectator=0  AND player_id IN (?)`;
    const vars = [ playerIds];

    
    let seasonUnions = ``;

    if(seasonId !== 0){
        seasonUnions = `
        UNION ALL ${getPlayerTotalsCTEQuery(true, false, false)}
            --gametype totals
        UNION ALL ${getPlayerTotalsCTEQuery(true, true, false)}
            --map totals
        UNION ALL ${getPlayerTotalsCTEQuery(true, false, true)}
            --gametype + map totals
        UNION ALL ${getPlayerTotalsCTEQuery(true, true, true)}`;
    }

    const query = `WITH pt AS (SELECT
            nstats_match_players.gametype_id,
            nstats_match_players.map_id,
            nstats_matches.season_id,
            ${PLAYER_TOTALS_COLUMNS_MATCHES},
            ${PLAYER_TOTALS_MAX_COLUMNS}
            FROM nstats_match_players 
            LEFT JOIN nstats_players ON player_id = nstats_players.id
            INNER JOIN nstats_matches ON nstats_match_players.match_id = nstats_matches.id
            ${where}
            GROUP BY player_id,nstats_match_players.gametype_id,nstats_match_players.map_id
        )
            --all time
        ${getPlayerTotalsCTEQuery(false, false, false)}
            --gametype totals
        UNION ALL ${getPlayerTotalsCTEQuery(false, true, false)}
            --map totals
        UNION ALL ${getPlayerTotalsCTEQuery(false, false, true)}
            --gametype + map totals
        UNION ALL ${getPlayerTotalsCTEQuery(false, true, true)}

        ${seasonUnions}
    `;

    return await simpleQuery(query, vars);

}


//COULD select and group by gametypeId, and mapId then SUM the pt results to get all time, gametype totals, map totals and gametype + map totals in a single query
//instead of calling the function 4 times per season

/**
 * 
 * @param {Number} seasonId 
 * @param {boolean} bGroupGametypes 
 * @param {boolean} bGroupMaps 
 * @returns 
 */
async function calculateAllSingleSeason(seasonId){


    let where = `WHERE spectator=0`;
    const vars = [];

    let seasonUnions = ``;

    if(seasonId !== 0){

        seasonUnions = `
        --all time
        UNION ALL ${getPlayerTotalsCTEQuery(true, false, false)}
        --gametype totals
        UNION ALL ${getPlayerTotalsCTEQuery(true, true, false)}
        --map totals
        UNION ALL ${getPlayerTotalsCTEQuery(true, false, true)}
        --map gametype totals
        UNION ALL ${getPlayerTotalsCTEQuery(true, true, true)}`
    }

    const query = `WITH pt AS (SELECT
            nstats_matches.season_id,
            nstats_match_players.gametype_id,
            nstats_match_players.map_id,
            ${PLAYER_TOTALS_COLUMNS_MATCHES},
            ${PLAYER_TOTALS_MAX_COLUMNS}
            FROM nstats_match_players 
            INNER JOIN nstats_matches ON nstats_matches.id = nstats_match_players.match_id
            ${where}
            GROUP BY player_id,nstats_match_players.gametype_id,nstats_match_players.map_id
        )
            
        --all time
        ${getPlayerTotalsCTEQuery(false, false, false)}
        --gametype totals
        UNION ALL ${getPlayerTotalsCTEQuery(false, true, false)}
        --map totals
        UNION ALL ${getPlayerTotalsCTEQuery(false, false, true)}
        --map gametype totals
        UNION ALL ${getPlayerTotalsCTEQuery(false, true, true)}
        ${seasonUnions}
        `;


    return await simpleQuery(query, vars);
}

/**
 * Insert new totals or update existing totals
 * @param {Array<SQL resultset>} data 
 */
async function bulkInsertPlayerTotals(data){

    const columns = [
        'player_id',      'gametype_id',   'map_id',
        'last_active',    'playtime',       'total_matches', 'wins',
        'draws',          'losses',         'winrate',       'score',
        'frags',          'kills',          'deaths',        'suicides',
        'team_kills',     'efficiency',     'ttl',           'first_blood',
        'spree_1',        'spree_2',        'spree_3',       'spree_4',
        'spree_5',        'spree_best',     'multi_1',       'multi_2',
        'multi_3',        'multi_4',        'multi_best',    'headshots',
        'item_amp',       'item_belt',      'item_boots',    'item_body',
        'item_pads',      'item_invis',     'item_shp',      'dom_caps',
        'avg_score',      'avg_frags',      'avg_kills',     'avg_deaths',
        'avg_suicides',   'avg_team_kills', 'avg_spree_1',   'avg_spree_2',
        'avg_spree_3',    'avg_spree_4',    'avg_spree_5',   'avg_spree_best',
        'avg_multi_1',    'avg_multi_2',    'avg_multi_3',   'avg_multi_4',
        'avg_multi_best', 'avg_headshots',  'avg_item_amp',  'avg_item_belt',
        'avg_item_boots', 'avg_item_body',  'avg_item_pads', 'avg_item_invis',
        'avg_item_shp',   'avg_dom_caps',   'epm_score',     'epm_frags',
        'epm_kills',      'epm_deaths',     'epm_suicides',  'epm_team_kills',
        'epm_spree_1',    'epm_spree_2',    'epm_spree_3',   'epm_spree_4',
        'epm_spree_5',    'epm_multi_1',    'epm_multi_2',   'epm_multi_3',
        'epm_multi_4',    'epm_headshots',  'epm_item_amp',  'epm_item_belt',
        'epm_item_boots', 'epm_item_body',  'epm_item_pads', 'epm_item_invis',
        'epm_item_shp',   'epm_dom_caps',   'season_id'
    ];

    const conflict = ["season_id","gametype_id","map_id","player_id"];

    const insertVars = [];


    for(let i = 0; i < data.length; i++){

        const d = data[i];

        const vars = [];

        for(let x = 0; x < columns.length; x++){

            vars.push(d[columns[x]]);

        }

        insertVars.push(vars);
    }



    await sqlInsertOnDuplicateUpdate("nstats_player_totals", columns, insertVars, conflict);
}

async function bulkInsertPlayerTotalsMaxValues(data){

    const columns = [
        "player_id",
        "gametype_id",
        "map_id",
        "max_playtime",
        "max_score",
        "max_frags",
        "max_kills",
        "max_deaths",
        "max_suicides",
        "max_team_kills",
        "max_spree_1",
        "max_spree_2",
        "max_spree_3",
        "max_spree_4",
        "max_spree_5",
        "max_spree_best",
        "max_multi_1",
        "max_multi_2",
        "max_multi_3",
        "max_multi_4",
        "max_multi_best",
        "max_headshots",
        "max_item_amp",
        "max_item_belt",
        "max_item_boots",
        "max_item_body",
        "max_item_pads",
        "max_item_invis",
        "max_item_shp",
        "max_dom_caps",
        "season_id"
    ];

    const conflict = ["season_id","gametype_id","map_id","player_id"];

    const insertVars = [];

    for(let i = 0; i < data.length; i++){

        const d = data[i];

        const vars = [];
        for(let x = 0; x < columns.length; x++){

            vars.push(d[columns[x]])
        }

        insertVars.push(vars);
    }

    await sqlInsertOnDuplicateUpdate("nstats_player_totals_max", columns, insertVars, conflict);
}

export async function calculateAllPlayerTotals(){

    const seasonIds = await getAllSeasonIds(false);

    const promises = [];

    for(let i = 0; i < seasonIds.length; i++){

        const seasonId = seasonIds[i];

        const totals = await calculateAllSingleSeason(seasonId);
        promises.push(bulkInsertPlayerTotals(totals), bulkInsertPlayerTotalsMaxValues(totals));
    }

    await Promise.all(promises);

    return;
}

export async function updateAllPlayerTotalsSingleSeason(seasonId){

    const totals = await calculateAllSingleSeason(seasonId);

    const promises = [];
    promises.push(bulkInsertPlayerTotals(totals), bulkInsertPlayerTotalsMaxValues(totals));

    await Promise.all(promises);

    return;
}


async function deleteMultiplePlayerTotalsMax(playerIds){

    if(playerIds.length === 0) return;

    const query = `DELETE FROM nstats_player_totals_max WHERE player_id IN(?)`;

    return await simpleQuery(query, [playerIds]);
}

/**
 * When we recalculate player totals we use this to delete all the previous player
 * all time totals, gametype totals, and map totals
 * @param {*} playerIds 
 * @returns 
 */
export async function deleteMultiplePlayerTotals(playerIds){

    if(playerIds.length === 0) return;


    //need to delete these first to prevent constraint error
    await deleteMultiplePlayerTotalsMax(playerIds);

    const query = `DELETE FROM nstats_player_totals WHERE player_id IN(?)`;

    return await simpleQuery(query, [playerIds]);
}

export async function updatePlayerTotals(playerIds, seasonId, gametypeId, mapId){

    const totals = await calculatePlayerTotals(seasonId, gametypeId, mapId, playerIds);

    await Promise.all([bulkInsertPlayerTotals(totals), bulkInsertPlayerTotalsMaxValues(totals)]);

}


export async function getPlayerGametypeTotals(playerId){

    const query = `SELECT ${getPlayerTotalsColumnsProfile()}, 
    IF(nstats_player_totals.gametype_id = 0, 'All', nstats_gametypes.name) as gametype_name
    FROM nstats_player_totals 
    
    LEFT JOIN nstats_gametypes ON nstats_gametypes.id = nstats_player_totals.gametype_id 
    WHERE nstats_player_totals.player_id=? AND nstats_player_totals.map_id=0`;

    return await simpleQuery(query, [playerId]);
}

export async function getPlayerAllMapTotals(playerId){

    const query = `SELECT ${getPlayerTotalsColumnsProfile()}, 
    IF(nstats_player_totals.map_id = 0, 'All', nstats_maps.name) as map_name
    FROM nstats_player_totals LEFT JOIN nstats_maps ON nstats_player_totals.map_id = nstats_maps.id 
    WHERE nstats_player_totals.player_id=? AND nstats_player_totals.gametype_id=0`;

    return await simpleQuery(query, [playerId]);

}

/**
 * 
 * @param {Number} playerId 
 * @returns All gametype and map totals, not including CTF totals
 */
export async function getPlayerGeneralSummary(playerId, seasonId){

    const t = "nstats_player_totals";
    const maxT = "nstats_player_totals_max";

    const query = `SELECT ${getPlayerTotalsColumnsProfile()}, 
    ${getPlayerTotalsMaxColumns()},
    IF(${t}.map_id = 0, 'All', nstats_maps.name) as map_name,
    IF(${t}.gametype_id = 0, 'All', nstats_gametypes.name) as gametype_name
    FROM ${t} 
    LEFT JOIN ${maxT} ON ${t}.player_id = ${maxT}.player_id AND ${t}.gametype_id = ${maxT}.gametype_id AND 
    ${t}.map_id = ${maxT}.map_id AND ${maxT}.season_id = ${t}.season_id
    LEFT JOIN nstats_maps ON ${t}.map_id = nstats_maps.id 
    LEFT JOIN nstats_gametypes ON ${t}.gametype_id = nstats_gametypes.id 
    WHERE ${t}.player_id=? AND ${t}.season_id=?`;

    return await simpleQuery(query, [playerId, seasonId]);
}


async function getPlayerTotalMatches(where, vars){

    const query = `SELECT COUNT(*) as total_matches FROM nstats_match_players WHERE player_id=? ${where} AND spectator=0`;

    const result = await simpleQuery(query, [...vars]);


    if(result.length === 0) return 0;

    return result[0].total_matches;
}

export async function getPlayerAllGametypesAndMaps(playerId, seasonId){

    const p = "nstats_player_totals";
    const m = "nstats_maps";
    const g = "nstats_gametypes";

    const query = `SELECT DISTINCT
    ${p}.gametype_id,${p}.map_id, 
    ${m}.name as map_name,
    ${g}.name as gametype_name
    FROM nstats_player_totals 
    LEFT JOIN ${m} ON ${m}.id = ${p}.map_id
    LEFT JOIN ${g} ON ${g}.id = ${p}.gametype_id
    WHERE ${p}.player_id=? AND ${p}.season_id=? AND ${p}.gametype_id!=0 AND ${p}.map_id!=0`;

    const result = await simpleQuery(query, [playerId, seasonId])
    const gametypes = {};
    const maps = {};

    //gametypeId => mapId
    const uniqueCombos = {};

    //each gametype player has played and what maps played on that gametype 
    const gametypeMaps = {};
    //each map player has played and what gametypes played on the map
    const mapGametypes = {};

   
    for(let i = 0; i < result.length; i++){

        const r = result[i];

        gametypes[r.gametype_id] = r.gametype_name;
        maps[r.map_id] = r.map_name;

        if(gametypeMaps[r.gametype_id] === undefined){
            gametypeMaps[r.gametype_id] = [];
        }

        if(gametypeMaps[r.gametype_id].indexOf(r.map_id) === -1){
            gametypeMaps[r.gametype_id].push(r.map_id);
        }

        if(mapGametypes[r.map_id] === undefined){
            mapGametypes[r.map_id] = [];
        }
        if(mapGametypes[r.map_id].indexOf(r.gametype_id) === -1){
            mapGametypes[r.map_id].push(r.gametype_id);
        }
    }

    const gametypesArray = [];

    for(const [key, value] of Object.entries(gametypes)){
        gametypesArray.push({"id": parseInt(key), "name": value});
    }

    const mapsArray = [];
    for(const [key, value] of Object.entries(maps)){
        mapsArray.push({"id": parseInt(key), "name": value});
    }

    mapsArray.sort(sortByName)
    gametypesArray.sort(sortByName)

    return {"gametypes": gametypesArray, "maps": mapsArray, gametypeMaps, mapGametypes}
 
}

// add page and perpage filtering
export async function getPlayerRecentMatches(playerId, seasonId, gametype, map, page, perPage){

    page = parseInt(page);
    perPage = parseInt(perPage);
    map = parseInt(map);
    gametype = parseInt(gametype);
    seasonId = parseInt(seasonId);

    if(seasonId !== seasonId) throw new Error(`seasonId must be a valid integer`);

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

    if(seasonId !== 0){
        where += ` AND
        EXISTS (SELECT 1 FROM nstats_matches WHERE nstats_matches.id = nstats_match_players.match_id AND nstats_matches.season_id=?)`;
        vars.push(seasonId);
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
    
    ORDER BY nstats_match_players.match_date DESC, nstats_match_players.match_id DESC LIMIT ?, ?`;

    const totalMatches = await getPlayerTotalMatches(where, vars);

    let start = page * perPage;
    vars.push(start);
    vars.push(perPage);
   
    const matches = await simpleQuery(query, vars);

    return {totalMatches, matches};
}


export async function getAllPlayerGametypeIds(seasonId, gametypeId){

    seasonId = parseInt(seasonId);
    if(seasonId !== seasonId) throw new Error(`seasonId must be valid integer`);
    
    if(arguments.length === 1) throw new Error(`seasonId getAllPlayerGametypeIds is missing`);

    let query = `SELECT DISTINCT player_id FROM nstats_player_totals WHERE gametype_id=? AND map_id=0`;

    const vars = [gametypeId];

    //if(seasonId !== 0){
        query += ` AND season_id=?`;
        vars.push(seasonId);
   // }

    const result = await simpleQuery(query, vars);

    return result.map((r) =>{
        return r.player_id;
    });
}
/**
 * get all player_ids that have played said map
 * @param {*} mapId 
 * @returns 
 */
export async function getAllPlayerMapIds(seasonId, mapId){

    if(arguments.length === 1) throw new Error(`seasonId is missing`);

    let query = `SELECT DISTINCT player_id FROM 
    nstats_player_totals 
    WHERE map_id=?`;

    const vars = [mapId];



    query += ` AND season_id=?`;
    vars.push(seasonId);
    

    const result = await simpleQuery(query, vars);

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
        
        {"table": "nstats_player_totals_max", "playerColumn": "player_id"},
        {"table": "nstats_player_totals", "playerColumn": "player_id"},
        {"table": "nstats_player_totals_ctf", "playerColumn": "player_id"},
        {"table": "nstats_player_totals_weapons", "playerColumn": "player_id"},
        {"table": "nstats_rankings", "playerColumn": "player_id"},
        {"table": "nstats_players", "playerColumn": "id"},
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


export async function getUniquePlayedType(type, playerId){

    type = type.toLowerCase();

    const validTypes = ["gametypes", "maps"];

    if(validTypes.indexOf(type) === -1){
        throw new Error(`Not a valid type from Players.getUniquePlayedType`);
    }

    let idColumn = "";
    let nameTable = "";


    if(type === "gametypes"){

        idColumn = "nstats_match_players.gametype_id";
        nameTable = "nstats_gametypes";

    }else if(type === "maps"){

        idColumn = "nstats_match_players.map_id";
        nameTable = "nstats_maps";
    }

    const query = `SELECT DISTINCT ${idColumn} as id,${nameTable}.name 
    FROM nstats_match_players 
    LEFT JOIN ${nameTable} ON ${idColumn}=${nameTable}.id
    WHERE nstats_match_players.player_id=?
    `;

    const result = await simpleQuery(query, [playerId]);

    const obj = {};

    for(let i = 0; i < result.length; i++){

        if(result[i].name === null){
            result[i].name = "Not Found";
        }

        obj[result[i].id] = result[i].name;
    }

    return obj;
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


export async function getMostActivePlayers(limit, seasonId){

    limit = parseInt(limit);
    if(limit !== limit) throw new Error("getMostActivePlayers limit must be an integer");

    seasonId = parseInt(seasonId);
    if(seasonId !== seasonId) throw new Error(`seasonId must be a valid integer`);

    const vars = [seasonId, limit];

    const query = `SELECT
    nstats_players.id,
    nstats_players.name,
    nstats_players.country,
    nstats_player_totals.playtime,
    nstats_player_totals.total_matches,
    nstats_player_totals.wins,
    nstats_player_totals.last_active
    FROM nstats_players
    LEFT JOIN nstats_player_totals ON nstats_player_totals.player_id = nstats_players.id 
    WHERE nstats_player_totals.gametype_id=0 AND nstats_player_totals.map_id=0 AND nstats_player_totals.season_id=?
    ORDER BY playtime DESC, wins DESC LIMIT ?
    `;

    return await simpleQuery(query, vars);

}

/**
 * 
 * @param {array<Integer>} playerIds 
 * @returns {Promise<Object>} keys are playerIds, if player is missing create not found data
 */

export async function getNamesAndHashesById(playerIds){

    if(playerIds.length === 0) return {};

    const query = `SELECT id,hash,name FROM nstats_players WHERE id IN(?)`;

    const result = await simpleQuery(query, [playerIds]);

    const data = {};

    const missing = [...playerIds];

    for(let i = 0; i < result.length; i++){

        const {id, hash, name} = result[i];

        const index = missing.indexOf(id);

        if(index !== -1) missing.splice(index, 1);

        data[id] = {id, name, hash}
   
    }

    for(let i = 0; i < missing.length; i++){

        const id = missing[i];

        data[id] = {"id": -1, "name": "Not Found", "hash": ""}
        
    }

    return data;
}


export async function adminGetForceNamesData(){

    const mt = "nstats_match_players";
    const pt = "nstats_players";

    const query = `SELECT 
    ${mt}.player_id,
    UPPER(${mt}.hwid) as hwid,
    UPPER(${mt}.mac1) as mac1,
    UPPER(${mt}.mac2) as mac2,
    ${pt}.name,
    ${pt}.country,
    MIN(${mt}.match_date) as first_seen,
    MAX(${mt}.match_date) as last_seen, COUNT(*) as total_matches,
    SUM(${mt}.time_on_server) as total_playtime 
    FROM nstats_match_players 
    LEFT JOIN ${pt} ON ${mt}.player_id = ${pt}.id
    WHERE ${mt}.spectator=0 AND ${mt}.bot=0
    GROUP BY 
    ${mt}.player_id,
    ${mt}.hwid,
    ${mt}.mac1,
    ${mt}.mac2
    ORDER BY ${pt}.name ASC`;

    return await simpleQuery(query);
    
}


export async function adminGetAllForceHWIDToNames(){

    const query = `SELECT id,UPPER(hwid) as hwid, name, date_added FROM nstats_force_name_hwid ORDER BY name ASC`;
    
    return await simpleQuery(query);

}


async function bNameInUseByHWID(name){

    const query = `SELECT COUNT(*) as total_uses FROM nstats_force_name_hwid WHERE name=?`;
    const result = await simpleQuery(query, [name]);

    return result[0].total_uses > 0;
}

/**
 * Force HWID to use name, if already in use by another hwid append id
 * @param {*} hwid 
 * @param {*} targetName 
 */
export async function autoAssignHWIDToName(hwid, targetName){
    

    let bFoundFreeName = false;
    let currentName = targetName;
    let attempt = 1;

    while(!bFoundFreeName){

        if(await bNameInUseByHWID(currentName)){

            attempt++;
            currentName = `${targetName}${attempt}`;

            if(attempt > 20){
                currentName = `Player_${createRandomString(12)}`;
            }

        }else{
            bFoundFreeName = true;
        }
    }

    const query = "INSERT INTO nstats_force_name_hwid VALUES(NULL,?,?,?)";


    await simpleQuery(query, [new Date(Date.now()), hwid, currentName]);

    return currentName;


}

export async function adminForceNameOnHWID(hwid, name){

    if(hwid === undefined){
        throw new Error("HWID is undefined");
    }

    if(name === undefined){
        throw new Error("Name is undefined");
    }else if(name === ""){
        throw new Error("Name can not be an empty string");
    }

    if(hwid === ""){
        throw new Error("You can not force a name to an empty HWID string.");
    }else if(hwid.toLowerCase() === "n/a"){
        throw new Error("YOu can not force a name to a HWID with the value of n/a");
    }

    const query = "INSERT INTO nstats_force_name_hwid VALUES(NULL,?,?,?)";

    try{

        return await sqlInsertReturnRowId(query, [new Date(Date.now()), hwid, name]);

    }catch(err){

        if(err.errstr === "constraint failed"){
            throw new Error("HWID is already forced to another name");
        }

        throw new Error(err);
    }
}

export async function adminDeleteForceNameToHWID(hwid){

    if(hwid === undefined) throw new Error("HWID is undefined");
    if(hwid === "") throw new Error("HWID can not be an empty string");
    if(hwid.toLowerCase() === "n/a") throw new Error("HWID can not be N/A");

    const query = "DELETE FROM nstats_force_name_hwid WHERE hwid=?";

    return await simpleQuery(query, [hwid]);
}


export async function getHWIDForceNames(targets){

    if(targets.length === 0) return {};

    const query = `SELECT UPPER(hwid) as hwid,name,date_added FROM nstats_force_name_hwid WHERE hwid IN(?) ORDER BY date_added ASC`;

    const result = await simpleQuery(query, [targets]);

    const data = {};

    for(let i = 0; i < result.length; i++){

        data[result[i].hwid.toUpperCase()] = result[i].name;
    }

    return data;

    
}


export async function adminGetAllForceMacToNames(){

    const query = `SELECT UPPER(mac1) as mac1, UPPER(mac2) as mac2, name, date_added FROM nstats_force_name_mac ORDER BY name ASC`;

    return await simpleQuery(query);
}


//check if same pair of addresses are in the database but in another order
async function bMacComboAlreadyExist(mac1, mac2){



    const query = `SELECT COUNT(*) as total_entries FROM nstats_force_name_mac WHERE (mac1=? AND mac2=?) OR (mac2=? AND mac1=?)`;

    const result = await simpleQuery(query, [mac1, mac2, mac1, mac2]);

    return result[0].total_entries > 0;
}

export async function adminForceNameOnMacAddresses(mac1, mac2, name){

    
    if(mac1 === undefined) throw new Error("Mac1 is undefined.");
    if(mac2 === undefined) throw new Error("Mac2 is undefined.");
    if(name === undefined) throw new Error("Name is undefined.");

    if(mac1 === "") throw new Error("Mac1 can't be an empty string.");
    if(name === "") throw new Error("Name can't be an empty string.");

    mac1 = mac1.toUpperCase();
    mac2 = mac2.toUpperCase();

    const query = `INSERT INTO nstats_force_name_mac VALUES(NULL,?,?,?,?)`;

    if(await bMacComboAlreadyExist(mac1, mac2)){
        throw new Error("MAC Combination already exists, it may already be added in a different order.")
    }

    try{

        return await sqlInsertReturnRowId(query, [new Date(Date.now()), mac1, mac2, name]);

    }catch(err){

        throw new Error(err);
    }
}

export async function adminDeleteForceNameOnMacAddresses(mac1, mac2){

    mac1 = mac1.toUpperCase();
    mac2 = mac2.toUpperCase();

    const query = `DELETE FROM nstats_force_name_mac WHERE mac1=? AND mac2=?`;

    return await simpleQuery(query, [mac1, mac2]);
}


export async function getForcedByMacNames(targets){

    if(targets.length === 0) return [];

    for(let i = 0; i < targets.length; i++){

        targets[i] = targets[i].toUpperCase();
    }

    const query = `SELECT UPPER(mac1) as mac1,UPPER(mac2) as mac2,name,date_added FROM nstats_force_name_mac WHERE mac1 IN(?) OR mac2 IN(?)`;

    return await simpleQuery(query, [targets, targets]);

}


//check if same combination is in database but with the mac addresses in a different order
async function bHWIDAndMacComboExists(hwid, mac1, mac2){

    const query = `SELECT COUNT(*) as total_rows FROM nstats_force_name_hwid_and_mac WHERE hwid=? AND (mac1=? AND mac2=?) OR (mac2=? AND mac1=?)`;

    const vars = [hwid, mac1, mac2, mac2, mac1];

    const result = await simpleQuery(query, vars);

    return result[0].total_rows > 0;
}

export async function adminForceNameOnBoth(name, hwid, mac1, mac2){

    if(name === undefined || hwid === undefined || mac1 === undefined || mac2 === undefined){
        throw new Error("All arguments must not be undefined");
    }

    if(name === "") throw new Error("Name can not be an empty string");

    hwid = hwid.toUpperCase();
    mac1 = mac1.toUpperCase();
    mac2 = mac2.toUpperCase();

    if(hwid === "") throw new Error("HWID can not be an empty string");
    if(mac1 === "") throw new Error("MAC1 can not be an empty string");


    if(await bHWIDAndMacComboExists(hwid, mac1, mac2)){
        throw new Error(`HWID and MAC addresses combination already exists(MAC addresses may be in a different order).`);
    }

    const query = `INSERT INTO nstats_force_name_hwid_and_mac VALUES(NULL,?,?,?,?,?)`;

    return await simpleQuery(query, [new Date(Date.now()), hwid, mac1, mac2, name]);
}


export async function adminGetAllForceNamesByHWIDAndMac(){

    const query = `SELECT id,hwid,mac1,mac2,name,date_added FROM nstats_force_name_hwid_and_mac ORDER BY name ASC`;

    return await simpleQuery(query);
}


export async function adminDeleteForceNameByBoth(hwid, mac1, mac2){

    const query = `DELETE FROM nstats_force_name_hwid_and_mac WHERE hwid=? AND (mac1=? OR mac1=?) AND (mac2=? OR mac2=?)`;

    return await simpleQuery(query, [hwid, mac1, mac2, mac1, mac2]);
}


export async function getForceNamesByBoth(targets){

    if(targets.length === 0) return [];

    const query = `SELECT hwid,mac1,mac2,name FROM nstats_force_name_hwid_and_mac WHERE hwid=? AND (mac1=? OR mac1=?) AND (mac2=? OR mac2=?)`;

    const promises = [];

    for(let i = 0; i < targets.length; i++){

        const {hwid, mac1, mac2} = targets[i];
        promises.push(simpleQuery(query, [hwid, mac1, mac2, mac1, mac2]));
    }

    const result = await Promise.all(promises);

    const found = [];

    for(let i = 0; i < result.length; i++){

        const r = result[i];
        if(r.length === 0) continue;
        found.push(r[0]);

    }

    return found;
}


export async function bulkInsertPlayerForceRenameHistory(matchId, history){

    if(history.length === 0) return;

    const query = `INSERT INTO nstats_force_name_history (match_id,player_id,force_type,original_name,new_name) VALUES ?`;

    const insertVars = [];

    for(let i = 0; i < history.length; i++){

        const h = history[i];

        if(h.playerId === undefined){

            new Message(`Can't insert rename history, playerId is undefined for ${h.newName}.`,"error");
     
            continue;
        }

        insertVars.push([matchId, h.playerId, h.type, h.oldName, h.newName]);
    }

    return await bulkInsert(query, insertVars);
}

export async function adminGetNameOverrideHistory(){

    const query = `SELECT match_id,player_id,force_type,original_name,new_name FROM nstats_force_name_history ORDER BY id DESC`;

    return await simpleQuery(query);
}


async function bPlayerSettingExists(category, name){

    const query = `SELECT COUNT(*) as total_rows FROM nstats_players_settings WHERE category=? AND name=?`;

    const result = await simpleQuery(query, [category, name]);

    return result[0].total_rows > 0;
}

export async function installPlayerSettings(){


    const query = `INSERT INTO nstats_players_settings VALUES(NULL,?,?,?,?)`;

    for(let i = 0; i < DEFAULT_PLAYER_SETTINGS.length; i++){

        const {category, name, valueType, value} = DEFAULT_PLAYER_SETTINGS[i];

        if(!await bPlayerSettingExists(category, name)){

            await simpleQuery(query, [category, name, valueType, value]);
        }else{
            new Message(`Player setting already exists, skipping insert.`,"note");
        }
    }
}

export async function adminGetAllPlayerSettings(){

    const query = `SELECT * FROM nstats_players_settings ORDER BY category ASC, name ASC`;

    const result = await simpleQuery(query);

    for(let i = 0; i < result.length; i++){

        if(result[i].value_type === "bool"){

            result[i].value = result[i].value === "true";
        }
    }

    return result;
}

export async function updatePlayerSettings(changes){

    if(changes.length === 0) return;

    const query = `UPDATE nstats_players_settings SET value=? WHERE id=?`;

    for(let i = 0; i < changes.length; i++){

        const {value, id} = changes[i];

        await simpleQuery(query, [value.toString(), id]);
    }
}


export async function bAutoForceNameToHWID(){

    const query = `SELECT value FROM nstats_players_settings WHERE category='importer' AND name='Auto Assign HWID To First Used Name'`;

    const result = await simpleQuery(query);

    if(result.length === 0){

        new Message(`Player settings is missing "Auto Assign HWID To First Used Name"` ,"error");
        process.exit();
    }

    return result[0].value === "true";
}

export async function getMostCommonNameUsedByHWIDS(hwids){

    if(hwids.length === 0) return {};

    //probably very slow way of doing this

    const mt = "nstats_match_players";
    const pt = "nstats_players";

    const query = `SELECT ${mt}.hwid,
    ${mt}.player_id,
    COUNT(*) as total_rows,
    ${pt}.name as name 
    FROM nstats_match_players 
    LEFT JOIN ${pt} ON ${mt}.player_id = ${pt}.id
    WHERE ${mt}.hwid=? GROUP BY ${mt}.hwid,${mt}.player_id ORDER BY total_rows DESC LIMIT 1`;


    const mostCommon = {};

    for(let i = 0; i < hwids.length; i++){

        const result = await simpleQuery(query, [hwids[i]])

        if(result.length === 0){
            mostCommon[hwids[i]] = "";
        }else{
            mostCommon[hwids[i]] = result[0].name;
        }
    }
    
    return mostCommon;

}


export async function adminRenameForceHWIDToName(hwid, newName){

    if(hwid === undefined) throw new Error("HWID is undefined");
    if(newName === undefined) throw new Error("newName is undefined");

    if(newName === "") throw new Error("newName can't be an empty string.");

    hwid = hwid.toUpperCase();
    if(hwid === "" || hwid === "n/a") throw new Error("Not a valid HWID");

    /*if(await bNameInUseByHWID(newName)){

        throw new Error("Name is already");
    }*/

    const query = `UPDATE nstats_force_name_hwid SET name=? WHERE hwid=?`;

    return await simpleQuery(query, [newName, hwid]);
}

export async function getPlayersAverages(playerIds, gametypeId, mapId){

    if(playerIds.length === 0) return {};

    const t = "nstats_player_totals";
    const mT = "nstats_player_totals_max"
  
    const columns = [
        "winrate",
        "avg_score",
        "avg_frags",
        "avg_kills",
        "avg_deaths",
        "avg_suicides",
        "avg_team_kills",
        "avg_spree_1",
        "avg_spree_2",
        "avg_spree_3",
        "avg_spree_4",
        "avg_spree_5",
        "avg_spree_best",
        "avg_multi_1",
        "avg_multi_2",
        "avg_multi_3",
        "avg_multi_4",
        "avg_multi_best",
        "avg_headshots",
        "avg_item_amp",
        "avg_item_belt",
        "avg_item_boots",
        "avg_item_body",
        "avg_item_pads",
        "avg_item_invis",
        "avg_item_shp",
        "epm_score",
        "epm_frags",
        "epm_kills",
        "epm_deaths",
        "epm_suicides",
        "epm_team_kills",
        "epm_spree_1",
        "epm_spree_2",
        "epm_spree_3",
        "epm_spree_4",
        "epm_spree_5",
        "epm_multi_1",
        "epm_multi_2",
        "epm_multi_3",
        "epm_multi_4",
        "epm_headshots",
        "epm_item_amp",
        "epm_item_belt",
        "epm_item_boots",
        "epm_item_body",
        "epm_item_pads",
        "epm_item_invis",
        "epm_item_shp",
    ];

    const maxColumns = [
        "max_playtime",
        "max_score",
        "max_frags",
        "max_kills",
        "max_deaths",
        "max_suicides",
        "max_team_kills",
        "max_spree_1",
        "max_spree_2",
        "max_spree_3",
        "max_spree_4",
        "max_spree_5",
        "max_spree_best",
        "max_multi_1",
        "max_multi_2",
        "max_multi_3",
        "max_multi_4",
        "max_multi_best",
        "max_headshots",
        "max_item_amp",
        "max_item_belt",
        "max_item_boots",
        "max_item_body",
        "max_item_pads",
        "max_item_invis",
        "max_item_shp",
        "max_dom_caps"

    ];

    let query = `SELECT ${t}.player_id,${t}.playtime,${t}.total_matches,${t}.wins,
    ${t}.draws,${t}.losses,${t}.spree_best,${t}.multi_best,`;
   
    for(let i = 0; i < columns.length; i++){

        query += `${columns[i]},`;
       // query += `printf('%.2f',${t}.${columns[i]}) as ${columns[i]},`;
       // if(i < columns.length - 1) query += `,`;
    }

    for(let i = 0; i < maxColumns.length; i++){

        query += `${maxColumns[i]}`;
        if(i < maxColumns.length - 1) query += `,`;
    }

    query += ` FROM ${t} 
    INNER JOIN ${mT} ON (${t}.player_id = ${mT}.player_id AND ${t}.gametype_id= ${mT}.gametype_id AND ${t}.map_id = ${mT}.map_id)
    WHERE ${t}.player_id IN (?) AND ${t}.gametype_id=? AND ${t}.map_id=?`;
    
    const result = await simpleQuery(query, [playerIds, gametypeId, mapId]);
    
    const data = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        //copy object ignoring the player_id key
        data[r.player_id] = (({player_id, ...newData}) =>  newData)(r);
    }

    return data;
}

export function sanitizePlayersPageParams(req, pageSettings, defaultPerPage){

    if(req.query === undefined) throw new Error(`Query is undefined`);

    let searchName = req.query?.name ?? "";
    let sortBy = req.query?.sortBy ?? pageSettings["Default Sort By"] ?? "name";
    let order = req.query?.order  ?? pageSettings["Default Order"] ?? "ASC";
    let perPage = req.query?.perPage ?? pageSettings["Results Per Page"] ?? defaultPerPage;
    if(perPage != perPage) perPage = defaultPerPage;
    if(perPage < 5 || perPage > 100) perPage = defaultPerPage;

    let page = req.query?.page ?? 1;
    page = parseInt(page);
    if(page !== page) page = 1;


    return {searchName, sortBy, order, perPage, page}
}


export function setPlayersPageMetaData(brandingSettings, searchName, sortBy, order, seasonInfo, bSkipSeasonLinks){

    let description = `Search for a player that has been active `;

    let title = "Player Search";

    if(searchName !== ""){
        title =  `${searchName} - Player Search `;
        description = `Search result for player named "${searchName}" `;
    }

    if(seasonInfo.id !== 0 && !bSkipSeasonLinks){
        description += `during the season: ${seasonInfo.name}`
    }else{
        description += `on one of our servers`;
    }

    description += `, sorted by ${sortBy} in ${order} order`;

    const siteName = brandingSettings?.["Site Name"] ?? "Node UTStats Lite";
    
    
    if(seasonInfo.id !== 0 && !bSkipSeasonLinks){
        title = `${title} - ${seasonInfo.name} - ${siteName}`;
    }else{
        title = `${title} - ${siteName}`;
    }

    return {description, title, siteName}
}


export async function sanitizePlayerPageReq(id, seasonId, seasonInfo){


    const basicPlayerInfo = await getPlayerProfileInfo(id, seasonId);
    if(basicPlayerInfo === null) throw new Error(`Player does not exist!`);

    const activeSeasons = await getPlayerActiveSeasons(id);

    let title = `${basicPlayerInfo.name}`;
    let description = `View the`;

    if(seasonInfo.id !== 0){

        title += ` - ${seasonInfo.name}`;
        description += ` ${seasonInfo.name} season player profile of ${basicPlayerInfo.name},`;
        
    }else{
        description += ` player profile of ${basicPlayerInfo.name},`
       
    }
    title += ` - Player Profile`;

    const lastSeenString = convertTimestamp(basicPlayerInfo.last_active, true, false, true);
    const playtimeString = toPlaytime(basicPlayerInfo.playtime);

    description += ` they were last seen ${lastSeenString}, and have played for a total of ${playtimeString}`;
    

    const playerId = basicPlayerInfo.id;

    if(basicPlayerInfo.country === "") basicPlayerInfo.country = "xx";

    const [pageSettings, pageLayout, brandingSettings] = await Promise.all([
        getCategorySettings("Player"),
        getPageLayout("Player"),
        getCategorySettings("Branding")]
    );



    const generalTotals = await getPlayerGeneralSummary(playerId, seasonId);


    let ctfTotals = [];

    if(pageSettings["Display CTF"] === 1){
        ctfTotals = await getPlayerCTFTotals(playerId, seasonId);
    }

    let weaponTotals = [];

    if(pageSettings["Display Weapons"] === 1){

        weaponTotals = await getPlayerWeaponTotals(playerId, seasonId);    
    
    }


    let rankingDayRange = (pageSettings["Rankings Activity Range"] !== undefined) ? parseInt(pageSettings["Rankings Activity Range"]) : 28;

    if(rankingDayRange !== rankingDayRange) rankingDayRange = 28;

    const dateMin = 60 * 60 * 24 * rankingDayRange;
    
    const minDate = new Date(Date.now() - dateMin * 1000);

    let rankings = null;

    if(pageSettings["Display Rankings"] === 1){
        //no real speed diffs with indexes
        rankings = await getPlayerRankings(playerId, minDate, seasonId);
        rankings = {"data": rankings, minDate, "maxDays": rankingDayRange}

    
    }
    
    let ctfLeagueData = [];

    let ctfLeagueSettings = {};

    if(pageSettings["Display CTF League"] === 1){
        ctfLeagueData = await getPlayerMapsLeagueData(playerId, seasonId);
        ctfLeagueSettings = await getLeagueSiteSettings();
    }

    let weaponDamage = [];

    if(pageSettings["Display Weapon Damage"] === 1){

        weaponDamage = await getPlayerWeaponDamageTotals(id, seasonId);
    }
    
    
    title = `${title} - ${brandingSettings?.["Site Name"] ?? "Node UTStats Lite"}`;


    return {
        title, description, playerId, basicPlayerInfo,
        pageSettings, pageLayout, brandingSettings, 
        generalTotals, ctfTotals, weaponTotals, rankings, 
        ctfLeagueData, ctfLeagueSettings, weaponDamage, activeSeasons
    }
}

export async function adminGetFullPlayerHistoryByHWIDMACS(hwid, mac, ip){


    if(hwid === "" && mac === "" && ip === ""){
        throw new Error(`You can't search a player's history with just blank strings`);
    }


    const vars = [];
    let query = `SELECT 
    nstats_match_players.id,
    nstats_match_players.player_id,
    nstats_match_players.spectator,
    nstats_match_players.country,
    nstats_match_players.match_id,
    nstats_match_players.map_id,
    nstats_match_players.gametype_id,
    nstats_match_players.match_date,
    nstats_match_players.match_result,
    nstats_match_players.time_on_server, 
    nstats_match_players.ip, 
    nstats_match_players.hwid, 
    nstats_match_players.mac1, 
    nstats_match_players.mac2, 
    COALESCE(nstats_gametypes.name, 'Not Found') as gametype_name,
    COALESCE(nstats_maps.name, 'Not Found') as map_name,
    COALESCE(nstats_players.name, 'Not Found') as player_name
    FROM nstats_match_players 
    LEFT JOIN nstats_gametypes ON gametype_id=nstats_gametypes.id
    LEFT JOIN nstats_maps ON map_id=nstats_maps.id
    LEFT JOIN nstats_players ON player_id=nstats_players.id
    WHERE `;

    if(hwid !== ""){
        query += ` nstats_match_players.hwid=? `
        vars.push(hwid);
    }

    if(mac !== ""){
        if(vars.length > 0) query += `AND`
        query += ` (nstats_match_players.mac1=? OR nstats_match_players.mac2=?)`;
        vars.push(mac, mac);
        
    }


    if(ip !== ""){
        if(vars.length > 0) query += `AND`;
        query += ` nstats_match_players.ip=? `
        vars.push(ip);
    }


    query += ` ORDER BY match_date DESC, match_id DESC`;

    const result = await simpleQuery(query, vars);

    const uniqueNames = new Set();
    const uniqueIps = new Set();
    const uniqueHWIDs = new Set();
    const uniqueMacs = new Set();

    for(let i = 0; i < result.length; i++){

        const {player_name, ip, hwid, mac1, mac2} = result[i];


        uniqueNames.add(player_name);

        if(ip !== "" && ip !== "0.0.0.0"){
            uniqueIps.add(ip);
        }
        if(hwid !== "" && hwid !== "N/A"){
            uniqueHWIDs.add(hwid);
        }

        if(mac1 !== ""){
            uniqueMacs.add(mac1);
        }

        if(mac2 !== ""){
            uniqueMacs.add(mac2);
        }
        
    }

    return {
        "data": result,
        "uniqueHWIDs": [...uniqueHWIDs],
        "uniqueIps": [...uniqueIps],
        "uniqueMacs": [...uniqueMacs],
        "uniqueNames": [...uniqueNames],
        "historyBy": {hwid, mac, ip}
    };
}


export async function getPlayerByName(name){

    const query = `SELECT * FROM nstats_players WHERE name=? ORDER BY name ASC, id ASC`;


    const result = await simpleQuery(query, [name]);

    if(result.length === 0) return null;

    return result[0];

}

async function getPlayerInfoByMatchRowIds(matchPlayerRowIds){

    if(matchPlayerRowIds.length === 0) return [];

    const query = `SELECT DISTINCT player_id FROM nstats_match_players WHERE id IN(?)`;

    const result = await simpleQuery(query, [matchPlayerRowIds]);

    return result.map((r) =>{ return r.player_id});
}

async function getMatchesInfoByPlayerMatchRowIds(matchPlayerRowIds, newPlayerId){

    if(matchPlayerRowIds.length === 0) return [];

    if(newPlayerId === undefined) throw new Error(`newPlayerId is missing`);

    const query = `SELECT 
    nstats_match_players.match_id,
    nstats_match_players.player_id,
    nstats_matches.season_id, 
    nstats_matches.gametype_id, 
    nstats_matches.map_id,
    nstats_players.name as player_name 
    FROM nstats_match_players 
    LEFT JOIN nstats_matches ON nstats_matches.id = nstats_match_players.match_id
    LEFT JOIN nstats_players ON nstats_match_players.player_id = nstats_players.id
    WHERE nstats_match_players.id IN(?)`;

    const result = await simpleQuery(query, [matchPlayerRowIds]);

    const uniqueSeasons = new Set();
    const uniqueGametypes = new Set();
    const uniqueMaps = new Set();
    const uniquePlayers = new Set();
    const uniquePlayerNames = new Set();

    uniquePlayers.add(newPlayerId);

    uniqueSeasons.add(0);


    for(let i = 0; i < result.length; i++){

        const r = result[i];

        uniqueSeasons.add(r.season_id);
        uniqueGametypes.add(r.gametype_id);
        uniqueMaps.add(r.map_id);
        uniquePlayers.add(r.player_id);
        uniquePlayerNames.add(r.player_id);
    }

    return {
        "data": result, 
        "uniqueSeasons": [...uniqueSeasons],
        "uniqueGametypes": [...uniqueGametypes],
        "uniqueMaps": [...uniqueMaps],
        "uniquePlayers": [...uniquePlayers],
        "uniquePlayerNames": [...uniquePlayerNames]
    }
}


/**
 * matchesInfo objects require match_id, and player_id keys
 * @param {Array<Object>} matchesInfo 
 * @param {*} newPlayerId 
 */
async function changePlayerIdInMatchesData(matchesInfo, newPlayerId){


    const targets = [];

    for(let i = 0; i < matchesInfo.data.length; i++){

        const d = matchesInfo.data[i];

        targets.push({
            "matchId": d.match_id,
            "oldPlayerId": d.player_id,
            newPlayerId
        });
    }

    const matchQuery = `UPDATE nstats_match_players SET player_id=? WHERE match_id=? AND player_id=?`;
    const weaponStatsQuery = `UPDATE nstats_match_weapon_stats SET player_id=? WHERE match_id=? AND player_id=?`;
    const killQuery = `UPDATE nstats_kills SET killer_id = IF(killer_id=?, ?, killer_id), victim_id = IF(victim_id=?, ?, victim_id) WHERE match_id=?`;
    const domQuery = `UPDATE nstats_match_dom SET player_id=? WHERE match_id=? AND player_id=?`;
    const damageQuery = `UPDATE nstats_damage_match SET player_id=? WHERE match_id=? AND player_id=?`;
    const classicWeaponStatsQuery = `UPDATE nstats_classic_weapon_match_stats SET player_id=? WHERE match_id=? AND player_id=?`;
    const weaponDamageQuery = `UPDATE nstats_match_player_weapon_damage SET player_id=? WHERE match_id=? AND player_id=?`;
   
    const matchVars = [];
    const killVars = [];

    for(let i = 0; i < targets.length; i++){

        const {matchId, oldPlayerId, newPlayerId} = targets[i];

        matchVars.push([newPlayerId, matchId, oldPlayerId]);
        killVars.push([oldPlayerId, newPlayerId, oldPlayerId, newPlayerId, matchId]);
    }

    //use same vars as query layout is the same
    await bulkUpdate(matchQuery, matchVars);
    await bulkUpdate(weaponStatsQuery, matchVars);
    await bulkUpdate(domQuery, matchVars);
    await bulkUpdate(damageQuery, matchVars);
    await bulkUpdate(classicWeaponStatsQuery, matchVars);
    await bulkUpdate(weaponDamageQuery, matchVars);

    await bulkUpdate(killQuery, killVars);

    await ctfChangePlayerMatchIds(targets);
    /**
     * 
     X nstats_match_players
     X nstats_match_weapon_stats
     X nstats_kills
     X nstats_match_dom
     X nstats_damage_match
     X nstats_classic_weapon_match_stats
     X nstats_match_player_weapon_damage
     */
}

export async function recalculatePlayerTotals(playerIds, seasonIds){

    if(playerIds.length === 0 || seasonIds.length === 0) return;

    const promises = [];

    for(let i = 0; i < seasonIds.length; i++){

        const sId = seasonIds[i];

        promises.push(updatePlayerTotals(playerIds, sId));
        promises.push(ctfUpdatePlayerTotals(playerIds, sId));
    }

    await Promise.all(promises);

}

async function insertRenameHistory(data, renameType, newName){

    const insertVars = [];

    for(let i = 0; i < data.length; i++){

        const d = data[i];

        insertVars.push([
            d.match_id,
            d.player_id,
            renameType,
            d.player_name,
            newName
        ]);
    }

    const query = `INSERT INTO nstats_force_name_history (match_id, player_id, force_type, original_name, new_name) VALUES ?`;

    await bulkInsert(query, insertVars);
}

export async function renamePlayerByMatchHistory(playerName, matchPlayerRowIds, bCreatePlayerIfNotExist, renameType){

    if(matchPlayerRowIds.length === 0) return;

    if(bCreatePlayerIfNotExist !== false && bCreatePlayerIfNotExist !== true){
        throw new Error(`bCreatePlayerIfNotExists must be a boolean`);
    }

    let playerInfo = await getPlayerByName(playerName);

    if(playerInfo === null){

        if(!bCreatePlayerIfNotExist){
            throw new Error(`A player with that name doesn't exist, and bCreatePlayer is false.`);
        }

        const playerId = await createMasterPlayer(playerName);
        playerInfo = await getPlayerById(playerId);

    }

    if(playerInfo === null){
        throw new Error(`playerInfo is null.`);
    }


    const matchesInfo = await getMatchesInfoByPlayerMatchRowIds(matchPlayerRowIds, playerInfo.id);

    await changePlayerIdInMatchesData(matchesInfo, playerInfo.id);

    if(matchesInfo.uniquePlayers.indexOf(playerInfo.id) === -1){
        matchesInfo.uniquePlayers.push(playerInfo.id);
    }

    await recalculatePlayerTotals(matchesInfo.uniquePlayers, matchesInfo.uniqueSeasons);

    await rankingsRecalculatePlayers(matchesInfo.uniquePlayers);

    await ctfLeagueRecalculatePlayers(matchesInfo.uniquePlayers);


    await insertRenameHistory(matchesInfo.data, renameType, playerName);

    /** TODO
    X Update match rows with the new player_id
    X Recalculate affected player profiles
    X Recalculate affected player totals
    X Recalculate affected player ctf league
    X Recalculate affected player rankings
     */
}

/**
 * Get all unique hwids, and ips that playerId has used
 * @param {Number} playerId 
 * @returns 
 */
async function adminGetPlayerUniqueTypes(playerId){


    const colVars = ` COUNT(*) as uses, MIN(match_date) as first_used, MAX(match_date) as last_used, SUM(time_on_server) as total_playtime `;

    const query = `SELECT 'hwid' as type, hwid as value,${colVars}
    FROM nstats_match_players WHERE player_id=? GROUP BY hwid
    UNION ALL
    SELECT 'ip' as type,ip as value,${colVars} FROM nstats_match_players WHERE player_id=? GROUP BY ip
    `;

    return await simpleQuery(query, [playerId, playerId]);
}

export async function adminGetPlayerProfile(playerId){

    const uniqueTypesToPlayerId = await adminGetPlayerUniqueTypes(playerId);

    return {uniqueTypesToPlayerId}
}

export async function adminGetPlayerHistoryById(playerId){

    const query = `SELECT match_id,match_date,ip,country,hwid,mac1,mac2,spectator FROM nstats_match_players WHERE player_id=? ORDER BY match_date DESC, match_id DESC`;

    return await simpleQuery(query, [playerId]);

}

export async function adminGetAllIps(){

    const query = `SELECT DISTINCT ip FROM nstats_match_players ORDER BY ip ASC`;

    const result = await simpleQuery(query);

    return result.map((r) => { return r.ip});
}


export async function getDuplicatePlayerProfiles(){

    const query = `SELECT name,COUNT(*) as entries FROM nstats_players GROUP BY name HAVING entries>1`;

    return await simpleQuery(query);
}


export async function getMasterAndDuplicateIds(duplicates){

    const query = `SELECT id,name FROM nstats_players WHERE name=? ORDER BY id ASC`;

    const players = {};


    for(let i = 0; i < duplicates.length; i++){

        const {name} = duplicates[i];

        const result = await simpleQuery(query, [name]);

        if(result.length === 0) continue;

        const firstId = result[0].id;

        const duplicateIds = [];

        for(let x = 1; x < result.length; x++){
            duplicateIds.push(result[x].id)
        }

        players[name] = {firstId, duplicateIds}
        
    }

    return players;
}


/**
 * all row ids for target player in nstats_match_players
 * @param {Number} playerId 
 * @returns {Promise<Array<Number>>} 
 */
export async function getPlayerMatchRowIds(playerId){

    const query = `SELECT id FROM nstats_match_players WHERE player_id=?`;

    const result = await simpleQuery(query, [playerId]);

    return result.map((r) =>{ return r.id});
}

//bug where player profiles where created without being case insensitive 
//2.10.0 preview 5
export async function fixDuplicatePlayerProfiles(){

    new Message(`Checking for duplicate player profiles`,"note");

    //table doesn't exist if this is the first time install.
    if(!await sqliteBTableExists("nstats_players")) return;

    
    const duplicates = await getDuplicatePlayerProfiles();

    if(duplicates.length === 0){
        new Message(`No duplicate player profiles found.`,"pass");
        return;
    }

    new Message(`Found ${duplicates.length} duplicate player profiles.`,"note");

    const players = await getMasterAndDuplicateIds(duplicates);


    for(const [playerName, playerData] of Object.entries(players)){

        new Message(playerName, "progress");

        for(let i = 0; i < playerData.duplicateIds.length; i++){

            const pId = playerData.duplicateIds[i];
            const matchRowIds = await getPlayerMatchRowIds(pId);

            await renamePlayerByMatchHistory(playerName, matchRowIds, false, "Duplicate Profile Merge");
            await adminDeletePlayer(pId)
        }
  
    }

}