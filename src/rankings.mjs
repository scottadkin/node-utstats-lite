import { simpleQuery, sqlInsertOnDuplicateUpdate } from "./database.mjs";
import { sanitizePagePerPage } from "./generic.mjs";
import { getAllIds as getAllGametypeIds } from "./gametypes.mjs";
import { getAllPlayerGametypeIds, getAllPlayerMapIds } from "./players.mjs";
import { getAllMapIds } from "./maps.mjs";
import { getAllSeasonIds, seasonGetAllGametypeIds, seasonGetAllGametypeNames, seasonGetAllMapIds, seasonGetAllMapNames } from "./seasons.mjs";
import Message from "./message.mjs";

export const DEFAULT_RANKING_SETTINGS = [
    // penalty is score * points
    {"category": "penalty", "name": "under_30", "displayName": "Under 30 Minutes Playtime Penalty", "points": 0.10},
    {"category": "penalty", "name": "under_60", "displayName": "Under 60 Minutes Playtime Penalty", "points": 0.15},
    {"category": "penalty", "name": "under_90", "displayName": "Under 90 Minutes Playtime Penalty", "points": 0.20},
    {"category": "penalty", "name": "under_120", "displayName": "Under 2 Hours Playtime Penalty", "points": 0.25},
    {"category": "penalty", "name": "under_180", "displayName": "Under 3 Hours Playtime Penalty", "points": 0.40},
    {"category": "penalty", "name": "under_240", "displayName": "Under 4 Hours Playtime Penalty", "points": 0.50},
    {"category": "penalty", "name": "under_300", "displayName": "Under 5 Hours Playtime Penalty", "points": 0.66},
    {"category": "penalty", "name": "under_600", "displayName": "Under 10 Hours Playtime Penalty", "points": 0.75},
    {"category": "penalty", "name": "min_matches", "displayName": "Minimum Matches Played", "points": 20},
    {"category": "penalty", "name": "map_min_matches", "displayName": "Minimum Matches Played(Map Rankings)", "points": 5},

    {"category": "general", "name": "kills", "displayName": "Kill", "points": 300},
    {"category": "general", "name": "deaths", "displayName": "Death", "points": -150},
    {"category": "general", "name": "suicides", "displayName": "Suicide", "points": -150},
    {"category": "general", "name": "team_kills", "displayName": "Team Kill", "points": -1200},
    {"category": "general", "name": "spree_1", "displayName": "Killing Spree", "points": 600},
    {"category": "general", "name": "spree_2", "displayName": "Rampage", "points": 600},
    {"category": "general", "name": "spree_3", "displayName": "Dominating", "points": 900},
    {"category": "general", "name": "spree_4", "displayName": "Unstoppable", "points": 1200},
    {"category": "general", "name": "spree_5", "displayName": "Godlike", "points": 1800},
    {"category": "general", "name": "multi_1", "displayName": "Double Kill", "points": 600},
    {"category": "general", "name": "multi_2", "displayName": "Multi Kill", "points": 600},
    {"category": "general", "name": "multi_3", "displayName": "Ultra Kill", "points": 600},
    {"category": "general", "name": "multi_4", "displayName": "Monster Kill", "points": 1200},

    {"category": "ctf", "name": "flag_taken", "displayName": "Flag Taken", "points": 600},
    {"category": "ctf", "name": "flag_pickup", "displayName": "Flag Pickup", "points": 600},
    {"category": "ctf", "name": "flag_drop", "displayName": "Flag Dropped", "points": 0},
    {"category": "ctf", "name": "flag_assist", "displayName": "Flag Assist", "points": 3000},
    {"category": "ctf", "name": "flag_cover", "displayName": "Flag Cover", "points": 1800},
    {"category": "ctf", "name": "flag_seal", "displayName": "Flag Seal", "points": 1200},
    {"category": "ctf", "name": "flag_cap", "displayName": "Flag Capture", "points": 6000},
    {"category": "ctf", "name": "flag_kill", "displayName": "Flag Kill", "points": 1200},
    {"category": "ctf", "name": "flag_return", "displayName": "Flag Return", "points": 600},
    {"category": "ctf", "name": "flag_return_base", "displayName": "Flag Return Base", "points": 50},
    {"category": "ctf", "name": "flag_return_mid", "displayName": "Flag Return Mid", "points": 100},
    {"category": "ctf", "name": "flag_return_enemy_base", "displayName": "Flag Return Enemy Base", "points": 200},
    {"category": "ctf", "name": "flag_return_save", "displayName": "Flag Return Save", "points": 250},
];

const VALID_RANKING_TYPES = ["gametype", "map"];


async function bRankingSettingExist(category, name){

    const query = `SELECT COUNT(*) as total_rows FROM nstats_ranking_settings WHERE category=? AND name=?`;
    const result = await simpleQuery(query, [category, name]);

    return result[0].total_rows > 0;
}


async function insertRankingSetting(data){

    const query = `INSERT INTO nstats_ranking_settings VALUES(NULL,?,?,?,?)`;

    await simpleQuery(query,[
        data.category,
        data.name,
        data.displayName,
        data.points
    ]);
}


export async function insertDefaultRankingSettings(){


    for(let i = 0; i < DEFAULT_RANKING_SETTINGS.length; i++){

        const s = DEFAULT_RANKING_SETTINGS[i];

        if(!await bRankingSettingExist(s.category, s.name)){
            await insertRankingSetting(s);
        }
    }
}

function bValidRankingType(type){

    type = type.toLowerCase();
    return VALID_RANKING_TYPES.indexOf(type) !== -1;
}

async function rankingsGetPlayerTotals(seasonId, gametypeId, mapId, playerIds, minMatches, settings){


    if(settings === undefined) throw new Error(`rankingSettings missing`);
    if(settings.general === undefined) throw new Error(`general ranking settings are missing`);
    if(settings.penalty === undefined) throw new Error(`penalty ranking settings are missing`);

    minMatches = parseInt(minMatches);
    if(minMatches !== minMatches) minMatches = 0;

    const vars = [gametypeId, mapId, playerIds];

    let seasonWhere = ``;

    if(seasonId !== 0){
        seasonWhere = `m.season_id IN(0, ?)`;
        vars.unshift(seasonId);
    }else{
        seasonWhere = `m.season_id=0`

    }

    vars.push(minMatches);

    const {kills, deaths, suicides, team_kills, 
        spree_1, spree_2, spree_3, spree_4, spree_5,
        multi_1, multi_2, multi_3, multi_4,
    } = settings.general;


    const {flag_taken, flag_pickup, flag_drop, flag_assist, flag_cover, flag_seal, 
        flag_cap, flag_kill, flag_return, flag_return_base, flag_return_mid, flag_return_enemy_base,
        flag_return_save
    } = settings.ctf;

    const query = `
        SELECT 
        m.season_id,
        m.gametype_id,
        m.map_id,
        m.player_id,
        m.last_active,
        m.playtime,
        m.playtime / 60 as minutes,
        m.total_matches,(
        m.kills * ${kills} +
        m.deaths * ${deaths} +
        m.suicides * ${suicides} +
        m.team_kills * ${team_kills} +

        m.spree_1 * ${spree_1} +
        m.spree_2 * ${spree_2} +
        m.spree_3 * ${spree_3} +
        m.spree_4 * ${spree_4} +
        m.spree_5 * ${spree_5} +
        m.multi_1 * ${multi_1} +
        m.multi_2 * ${multi_2} +
        m.multi_3 * ${multi_3} + 
        m.multi_4 * ${multi_4} +
        COALESCE(
        ctf.flag_taken * ${flag_taken} +
        ctf.flag_pickup * ${flag_pickup} +
        ctf.flag_drop * ${flag_drop}  +
        ctf.flag_assist * ${flag_assist}  +
        ctf.flag_cover * ${flag_cover}  +
        ctf.flag_seal * ${flag_seal}  +
        ctf.flag_cap * ${flag_cap}  +
        ctf.flag_kill * ${flag_kill}  +
        ctf.flag_return * ${flag_return}  +
        ctf.flag_return_base * ${flag_return_base}  +
        ctf.flag_return_mid * ${flag_return_mid} +
        ctf.flag_return_enemy_base * ${flag_return_enemy_base}  +
        ctf.flag_return_save * ${flag_return_save},0)
        ) as points

        FROM nstats_player_totals AS m

        LEFT JOIN nstats_player_totals_ctf AS ctf ON 
        ctf.season_id = m.season_id AND 
        ctf.gametype_id=m.gametype_id AND 
        ctf.map_id = m.map_id AND ctf.player_id = m.player_id

        WHERE ${seasonWhere} AND m.gametype_id IN (?,0) AND m.map_id IN(?,0) AND m.player_id IN(?) AND m.total_matches>=?

    `;

    return await simpleQuery(query, vars);

}



export async function getRankingSettings(bIncDisplayName){

    if(bIncDisplayName === undefined) bIncDisplayName = false;

    const query = `SELECT category,name,points${(bIncDisplayName) ? ",display_name" : ""} FROM nstats_ranking_settings`;

    const result = await simpleQuery(query);

    const data = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        if(data[r.category] === undefined){
            data[r.category] = {};
        }

        
        if(bIncDisplayName){
            data[r.category][r.name] = {"points": r.points, "displayName": r.display_name}
        }else{
            data[r.category][r.name] = r.points;
        }
    }


    return data;
}


async function bulkInsertRankings(data){



    const conflicts = ["season_id", "gametype_id", "map_id", "player_id"];


    const insertVars = [];

    for(let i = 0; i < data.length; i++){

        const d = data[i];
        insertVars.push([
            d.player_id,
            d.season_id,
            d.gametype_id,
            d.map_id,
            d.total_matches,
            d.playtime,
            d.points,
            d.last_active,
        ]);
    }


    const columns = [
        "player_id", "season_id", "gametype_id", "map_id", "matches", "playtime", "score", "last_active"
    ];

    return await sqlInsertOnDuplicateUpdate("nstats_rankings", columns, insertVars, conflicts);
}


export async function calculateRankings(seasonId, gametypeId, mapId, playerIds){

    seasonId = parseInt(seasonId);
    if(seasonId !== seasonId) throw new Error(`SeasonId must be a valid integer`);

    if(playerIds.length === 0) return;


    const settings = await getRankingSettings();

    if(settings.penalty === undefined) throw new Error("Penalty settings are missing");

    let minKey = "min_matches";

    if(mapId !== 0){
        minKey = "map_min_matches";
    }

    const minMatches = settings.penalty?.[minKey] ?? 0;

    const totals = await rankingsGetPlayerTotals(seasonId, gametypeId, mapId, playerIds, minMatches, settings);

    const penalty = settings.penalty;

    for(let i = 0; i < totals.length; i++){

        const t = totals[i];

        const mins = t.minutes;

        if(t.points === 0) continue;

        if(mins < 30){
            t.points = t.points * penalty.under_30;
        }else if(mins < 60){
            t.points = t.points * penalty.under_60;
        }else if(mins < 90){
            t.points = t.points * penalty.under_90;
        }else if(mins < 120){
            t.points = t.points * penalty.under_120;
        }else if(mins < 180){
            t.points = t.points * penalty.under_180;
        }else if(mins < 240){
            t.points = t.points * penalty.under_240;
        }else if(mins < 300){
            t.points = t.points * penalty.under_300;
        }else if(mins < 600){
            t.points = t.points * penalty.under_600;
        }

        t.points = (t.minutes > 0) ? t.points / t.minutes : 0;

    }

    await bulkInsertRankings(totals);

}



async function getRankingPlayerCount(seasonId, gametypeId, mapId, minDate){

    const query = `SELECT COUNT(*) as total_rows FROM nstats_rankings WHERE season_id=? AND gametype_id=? AND map_id=? AND last_active>=?`;

    const result = await simpleQuery(query, [seasonId, gametypeId, mapId, minDate]);

    return result[0].total_rows;
}


/**
 * 
 * @param {*} targetId 
 * @param {*} page 
 * @param {*} perPage 
 * @param {*} timeRange 
 * @param {*} type if undefined will fetch gametype rankings
 * @returns 
 */
export async function getRankings(seasonId, gametypeId, mapId, page, perPage, timeRange){

    const day = 60 * 60 * 24;

    const now = new Date();
    const minDate = (timeRange > 0) ? new Date(now - day * timeRange * 1000) : new Date(0);

    const [cleanPage, cleanPerPage, start] = sanitizePagePerPage(page, perPage);

    const vars = [seasonId, gametypeId, mapId, minDate, start, cleanPerPage];

    const query = `SELECT rt.player_id,
    rt.matches,
    rt.playtime,
    rt.score,
    rt.last_active,
    p.name,
    p.country
    FROM nstats_rankings as rt 
    LEFT JOIN nstats_players as p ON p.id = rt.player_id
    WHERE rt.season_id=? AND  rt.gametype_id=? AND rt.map_id=? AND rt.last_active>=? ORDER by rt.score DESC LIMIT ?, ?`;

    const data = await simpleQuery(query, vars);
    const totalResults = await getRankingPlayerCount(seasonId, gametypeId, mapId, minDate);

    return {data, totalResults};
}

export async function getAllSettings(){

    return await simpleQuery(`SELECT * FROM nstats_ranking_settings`);
}


async function updateRankingSetting(id, value){

    const query = `UPDATE nstats_ranking_settings SET points=? WHERE id=?`;

    return await simpleQuery(query, [value, id]);
}

export async function updateRankingSettings(settings){

    const passed = [];
    const fails = [];

    for(let i = 0; i < settings.length; i++){

        const s = settings[i];

        const result = await updateRankingSetting(s.id, s.value);

        if(result.affectedRows > 0){
            passed.push(s.id);
        }else{
            fails.push(s.id);
        }
    }

    return {passed, fails};
}

async function deleteAllPlayerSeasonRankings(seasonId){

    const query = `DELETE FROM nstats_rankings WHERE season_id=?`;

    await simpleQuery(query, [seasonId]);
}

async function deleteGametypeRankings(seasonId, id){

    const query = `DELETE FROM nstats_rankings WHERE gametype_id=? AND season_id=?`;

    await simpleQuery(query, [id, seasonId]);

}


async function deleteMapRankings(seasonId, id){

    const query = `DELETE FROM nstats_map_rankings WHERE map_id=? AND season_id=?`;

    await simpleQuery(query, [id, seasonId]);
}

async function deleteAllMapSeasonRankings(seasonId){

    const query = `DELETE FROM nstats_map_rankings WHERE season_id=?`;

    await simpleQuery(query, [seasonId]);
}


export async function recalculateSeasonRankings(seasonId){

    seasonId = parseInt(seasonId);
    if(seasonId !== seasonId) throw new Error(`seasonId must be valid integer`);

    await Promise.all([
        deleteAllPlayerSeasonRankings(seasonId),
        deleteAllMapSeasonRankings(seasonId)
    ]);

    const [gametypeIds, mapIds] = await Promise.all([
        seasonGetAllGametypeIds(seasonId), 
        seasonGetAllMapIds(seasonId)
    ]);


    const seasonPromises = [];

    for(let i = 0; i < gametypeIds.length; i++){

        const gId = gametypeIds[i];

        seasonPromises.push(recalculateGametype(seasonId, gId));
    }

    for(let i = 0; i < mapIds.length; i++){

        const mId = mapIds[i];
        seasonPromises.push(recalculateMap(seasonId, mId));
    }


    return await Promise.all(seasonPromises);
}


export async function recalculateAllRankings(){

    const seasonIds = await getAllSeasonIds(false);

    let totalGametypesRecalculated = 0;
    let totalMapsRecalculated = 0;


    for(let i = 0; i < seasonIds.length; i++){

        const seasonId = seasonIds[i];

        new Message(`Recalculating rankings for season ${seasonId}`, "note");

        const gametypeIds = (seasonId !== 0) ? await seasonGetAllGametypeIds(seasonId) : await getAllGametypeIds();
        //await deleteAllPlayerSeasonRankings(seasonId); already done in recalculate gametype
        //await deleteAllMapSeasonRankings(seasonId);   already done in recalculate map
        const seasonPromises = [];


        for(let x = 0; x < gametypeIds.length; x++){

            const gametypeId = gametypeIds[x];

            totalGametypesRecalculated++;

            new Message(`Recalculating rankings for gametypeId ${gametypeId}(season ${seasonId})`, "note");
            seasonPromises.push(recalculateGametype(seasonId, gametypeId));
        }

        //await deleteAllPlayerSeasonRankings(seasonId);
        await Promise.all(seasonPromises);

        
        const mapIds = (seasonId !== 0) ? await seasonGetAllMapIds(seasonId) : await getAllMapIds();
        
        const mapPromises = [];

        for(let x = 0; x < mapIds.length; x++){

            totalMapsRecalculated++;
            new Message(`Recalculating rankings for mapId ${mapIds[x]}(season ${seasonId})`, "note");
            mapPromises.push(recalculateMap(seasonId, mapIds[x]));
        }

        //await deleteAllMapSeasonRankings(seasonId);
        await Promise.all(mapPromises);

    }

    return `Recalculated ${seasonIds.length} season rankings, ${totalGametypesRecalculated} gametypes, and ${totalMapsRecalculated} map rankings`;

}

export async function recalculateGametype(seasonId, id){

    if(arguments.length === 1) throw new Error(`You need to add seasonId parameter`);

 
    await deleteGametypeRankings(seasonId, id);

    const playerIds = await getAllPlayerGametypeIds(seasonId, id);

    await calculateRankings(seasonId, id, playerIds);
  
}


export async function getPlayerRankings(playerId, minDate, seasonId){

    const query = `WITH rankings AS(SELECT nstats_rankings.score,
    nstats_rankings.player_id,
    nstats_rankings.gametype_id,
    nstats_rankings.map_id,
    nstats_rankings.matches,
    nstats_rankings.playtime,
    nstats_rankings.last_active,
    nstats_rankings.season_id,
    RANK() OVER(
        PARTITION BY gametype_id,map_id ORDER BY score DESC
    ) as position
     FROM nstats_rankings 
     WHERE  last_active>=? AND season_id=?)
    SELECT rankings.*,
    IF(gametype_id = 0, 'All Time', COALESCE(nstats_gametypes.name, 'Not Found')) as gametype_name,
    IF(map_id = 0, 'All Time', COALESCE(nstats_maps.name, 'Not Found')) as map_name 
    FROM rankings 
    
    LEFT JOIN nstats_gametypes ON gametype_id=nstats_gametypes.id
    LEFT JOIN nstats_maps ON map_id=nstats_maps.id
    WHERE player_id=?
    `;

    return await simpleQuery(query, [minDate, seasonId, playerId])

}


export async function recalculateMap(seasonId, id){

    seasonId = parseInt(seasonId);
    if(seasonId !== seasonId) throw new Error(`seasonId must be valid integer`);
    if(arguments.length === 1) throw new Error(`seasonId is missing`);
    await deleteMapRankings(seasonId, id);

    const playerIds = await getAllPlayerMapIds(seasonId, id);

    await calculateRankings(seasonId, id, playerIds, "map");
  
}


export async function getUniqueMaps(){

    const query = `SELECT DISTINCT map_id FROM nstats_map_rankings`;

    const result = await simpleQuery(query);

    return result.map((r) =>{
        return r.map_id;
    });
}


export async function getUniqueGametypes(){

    const query = `SELECT DISTINCT gametype_id FROM nstats_rankings`;

    const result = await simpleQuery(query);

    return result.map((r) =>{
        return r.gametype_id;
    });
}

//use for rankings main page instead of just using the latest
export async function getMostActiveInTimeRange(seasonId, type, timeRange){


    const column = (type === "gametype") ? "gametype_id" : "map_id";

    const query = `SELECT ${column} as id,COUNT(*) as total_players FROM nstats_rankings 
    WHERE last_active>=? AND season_id=? GROUP BY ${column} ORDER BY total_players DESC LIMIT 1`;

    const minDate = new Date(Date.now() - 60 * 60 * 24 * 1000 * timeRange);

    const result = await simpleQuery(query, [minDate, seasonId]);

    if(result.length === 0) return 0;
    return result[0].id;

}


export async function getMinMatchesSetting(type){

    type = type.toLowerCase();

    const targetName = (type === "gametype") ? "min_matches" : "map_min_matches";

    const query = `SELECT points FROM nstats_ranking_settings WHERE category='penalty' AND name=?`;

    const result = await simpleQuery(query, [targetName]);

    if(result.length === 0) return null;

    return result[0].points;
}


export async function sanitizeRankingsPageReq(req, pageSettings){

    let mode = req?.query?.mode ?? "gametype";
    mode = mode.toLowerCase();

    if(mode !== "gametype" && mode !== "map" && mode !== "custom") mode = "gametype";

    let page = (req.query.p !== undefined) ? parseInt(req.query.p) : 1;
    let perPage = req.query.pp ?? pageSettings["Results Per Page"] ?? 25;
    let gametypeId = (req.query.g !== undefined) ? parseInt(req.query.g) : 0;
    let mapId = (req.query.m !== undefined) ? parseInt(req.query.m) : 0;
    let seasonId = req.params?.season ?? 0;

    if(gametypeId !== gametypeId || mapId !== mapId){

        throw new Error(`gametypeId and mapId must be valid integers`);
    }

    seasonId = parseInt(seasonId);

    let defaultLastActive = 28;

    if(req.query.tf !== undefined){
        defaultLastActive = req.query.tf;
    }else{

        const key = (mode === "gametype") ? "Default Last Active Limit(Gametypes)" : "Default Last Active Limit(Maps)"
        defaultLastActive = pageSettings?.[key];
    }

    const timeRange = defaultLastActive;

    const [gametypeNames, mapNames] = await Promise.all([
        (mode === "gametype" || mode === "custom") ? seasonGetAllGametypeNames(seasonId) : {},
        (mode === "map" || mode === "custom") ? seasonGetAllMapNames(seasonId) : {}
    ]);

    const gametypeKeys = Object.keys(gametypeNames);
    const mapKeys = Object.keys(mapNames);
    
    let targetId = 0;

    if(mode === "gametype" && gametypeId === 0){
        targetId = await getMostActiveInTimeRange(seasonId, "gametype", timeRange);
    }else if(mode === "map" && mapId === 0){
        targetId = await getMostActiveInTimeRange(seasonId, "map", timeRange);
    }else if(mode === "custom" && gametypeId === 0 && mapId === 0){
        targetId = await getMostActiveInTimeRange(seasonId, "gametype", timeRange);
    }


    let typeName = "Not Found";

    if(targetId === 0){

        if((mode === "gametype" || mode === "custom") && gametypeKeys.length > 0){

            typeName = gametypeNames[gametypeKeys[0]];

        }else if(mode === "map" && mapKeys.length > 0){

            typeName = mapNames[mapKeys[0]];
        }

    }
    
    return {mode, gametypeNames, mapNames, gametypeId, mapId, timeRange, typeName, page, perPage, seasonId}
}


async function getUniquePlayerMatchCombinations(playerIds){

    const query = `
    SELECT player_id,COUNT(*) as total_matches,gametype_id as id,'gametype' as type FROM nstats_match_players WHERE player_id IN(?) GROUP BY player_id,gametype_id
    UNION ALL
    SELECT player_id,COUNT(*) as total_matches,map_id as id,'map' as type FROM nstats_match_players WHERE player_id IN(?) GROUP BY player_id,map_id
    `;

    const result = await simpleQuery(query, [playerIds, playerIds]);

    const playerStats = {};

    const gametypes = {};
    const maps = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        /*if(playerStats[r.player_id] === undefined){
            playerStats[r.player_id] = {
                "gametypes":{},
                "maps":{},
                "uniqueGametypes": [],
                "uniqueMaps":[]
            };
        }*/

        if(r.type === "gametype"){

            if(gametypes[r.id] === undefined){
                gametypes[r.id] = [];
            }

            gametypes[r.id].push(r.player_id);

         //   playerStats[r.player_id].gametypes[r.id] = r.total_matches;
         //   playerStats[r.player_id].uniqueGametypes.push(r.id);

        }else if(r.type === "map"){

            if(maps[r.id] === undefined){
                maps[r.id] = [];
            }

            maps[r.id].push(r.player_id);

           // playerStats[r.player_id].maps[r.id] = r.total_matches;
          //  playerStats[r.player_id].uniqueMaps.push(r.id);
        }
    }

    return {gametypes, maps, playerStats};
}


async function deletePlayerRankings(playerIds){

    if(playerIds.length === 0) return;

    const gametypeQuery = `DELETE FROM nstats_rankings WHERE player_id IN(?)`;
    const mapQuery = `DELETE FROM nstats_map_rankings WHERE player_id IN(?)`;

    return Promise.all([
        simpleQuery(gametypeQuery, [playerIds]),
        simpleQuery(mapQuery, [playerIds])
    ]);
}

/**
 * Recalculate all matching player ids
 * @param {Array<Number>} playerIds 
 * @returns 
 */
export async function rankingsRecalculatePlayers(playerIds){

    if(playerIds.length === 0) return;

    const {gametypes, maps} = await getUniquePlayerMatchCombinations(playerIds);

    await deletePlayerRankings(playerIds);

    //lazy should only get ones players where involved with
    const seasonIds = await getAllSeasonIds(false);

    for(const [gametypeId, gametypePlayerIds] of Object.entries(gametypes)){

        for(let i = 0; i < seasonIds.length; i++){

            new Message(`Recalculating gametype rankings for selected players for season ${seasonIds[i]} and gametype=${gametypeId}`,"note");
            await calculateRankings(seasonIds[i], gametypeId, gametypePlayerIds, "gametype");
        }
    }

    for(const [mapId, mapPlayerIds] of Object.entries(maps)){

        for(let i = 0; i < seasonIds.length; i++){
            new Message(`Recalculating map rankings for selected players for season ${seasonIds[i]} and map=${mapId}`,"note");
            await calculateRankings(seasonIds[i], mapId, mapPlayerIds, "map");
        }
    }


}