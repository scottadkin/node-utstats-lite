import { bulkInsert, simpleQuery, sqlInsertOnDuplicateUpdate, sqlInsertReturnRowId, sqliteDeleteTable } from "./database.mjs";
import { readdir } from 'node:fs/promises';
import { getAllSeasonIds } from "./seasons.mjs";


export async function getWeaponId(name, bCreateIfMissing){

    const query = `SELECT id,name FROM nstats_weapons WHERE name=?`;

    const result = await simpleQuery(query, [name]);

    if(result.length > 0) return result[0];

    if(bCreateIfMissing){
        return await createWeapon(name);
    }

    return null;
}

export async function createWeapon(name){

    const query = `INSERT INTO nstats_weapons VALUES(NULL,?)`;

    const result = await sqlInsertReturnRowId(query, [name]);

    return {"id": result, name};
}


export async function bulkInsertMatchWeaponStats(data, matchId, gametypeId, mapId){

    const insertVars = [];

    for(const [pId, playerStats] of Object.entries(data)){

        const playerId = parseInt(pId);

        for(const [wId, weaponStats] of Object.entries(playerStats)){

            const weaponId = parseInt(wId);


            insertVars.push([
                matchId, mapId, gametypeId, playerId, weaponId, weaponStats.kills,
                weaponStats.deaths, weaponStats.teamKills, weaponStats.suicides
            ]);
        }
    }

    const query = `INSERT INTO nstats_match_weapon_stats (match_id,map_id,gametype_id,player_id,weapon_id,kills,deaths,team_kills,suicides) VALUES ?`;

    await bulkInsert(query, insertVars);

}

export async function getWeaponNames(ids, bReturnArray){

    if(ids.length === 0) return {};

    const query = `SELECT id,name FROM nstats_weapons WHERE id IN(?)`;

    const result = await simpleQuery(query, [ids]);

    if(bReturnArray){
        return [{"id":0,"name": "All"},...result]
    }

    const data = {
        "0": "All"
    };

    for(let i = 0; i < result.length; i++){

        const r = result[i];
        data[r.id] = r.name;
    }

    return data;
}

export async function getMatchWeaponStats(matchId){

    const query = `SELECT player_id,weapon_id,kills,deaths,team_kills,suicides FROM nstats_match_weapon_stats WHERE match_id=?`;
    const result = await simpleQuery(query, [matchId]);

    const uniqueWeapons = [...new Set(result.map((r) =>{
        return r.weapon_id;
    }))];

    const [names, images] = await Promise.all([getWeaponNames(uniqueWeapons), getAllImages()]);

    const namesToImages = {};

    for(const name of Object.values(names)){
    
        namesToImages[name] = getWeaponImage(images, name);
    }
   
    return {"data": result, "names": names, "images": namesToImages}
}



async function testCalculatePlayerTotalsFromMatchData(playerIds, seasonId){

    if(playerIds !== null && playerIds.length === 0) return null;

    const wT = `nstats_match_weapon_stats`;
    const mT = `nstats_match_players`;


    let where = "WHERE ";

    const vars = [];

    if(playerIds === null){
        where += ` ${mT}.spectator=0`;
    }else{
        where += ` ${mT}.player_id IN(?) AND ${mT}.spectator=0`;
        vars.push(playerIds);
    }


    if(seasonId !== 0){

        where += ` AND EXISTS(
        SELECT 1 FROM nstats_matches
        WHERE nstats_matches.id = ${wT}.match_id AND nstats_matches.season_id=?
        )`;

        vars.push(seasonId);
    }


    const query = `SELECT ${mT}.player_id,SUM(${mT}.time_on_server) as playtime, 
    COUNT(*) as total_matches,
    ${mT}.map_id,
    ${mT}.gametype_id,
    ${wT}.weapon_id,
    SUM(${wT}.kills) as kills,
    MAX(${wT}.kills) as max_kills,
    SUM(${wT}.deaths) as deaths,
    MAX(${wT}.deaths) as max_deaths,
    SUM(${wT}.team_kills) as team_kills,
    MAX(${wT}.team_kills) as max_team_kills,
    SUM(${wT}.suicides) as suicides, 
    MAX(${wT}.suicides) as max_suicides
    FROM ${mT} 
    INNER JOIN ${wT} on ${wT}.match_id = ${mT}.match_id AND ${wT}.player_id = ${mT}.player_id
    ${where} 
    GROUP BY ${mT}.player_id,${mT}.gametype_id,${mT}.map_id,${wT}.weapon_id`;

    return await simpleQuery(query, vars);
}



function testCreateEmptyTotalsObj(){

    return {
        "playtime": 0,
        "matches": 0,
        "kills": 0,
        "deaths": 0,
        "suicides": 0,
        "team_kills": 0,
        "max_kills": 0,
        "max_deaths": 0,
        "max_suicides": 0,
        "max_team_kills": 0,
        "avg_kills": 0,
        "avg_deaths": 0,
        "avg_suicides": 0,
        "avg_team_kills": 0,
    }
}

function testUpdatePlayerTotalsObject(totals, matchData){

    const pId = matchData.player_id;
    const gId = matchData.gametype_id;
    const mId = matchData.map_id;
    const wId = matchData.weapon_id;

    // totals => playerId => gametypeId => mapId => weaponId

    if(totals[pId] === undefined){
        totals[pId] = {};
    }

    //all time data
    if(totals[pId][0] === undefined){
        totals[pId][0] = {};
    }

    //gametype totals
    if(totals[pId][gId] === undefined){
        totals[pId][gId] = {};
    }

    //all time totals
    if(totals[pId][0][0] === undefined){
        totals[pId][0][0] = {}//testCreateEmptyTotalsObj();
    }

    //gametype all time totals
    if(totals[pId][gId][0] === undefined){
        totals[pId][gId][0] = {}//testCreateEmptyTotalsObj();
    }

    //all time map data
    if(totals[pId][0][mId] === undefined){
        totals[pId][0][mId] = {}//testCreateEmptyTotalsObj();
    }

    //gametype => map totals
    if(totals[pId][gId][mId] === undefined){
        totals[pId][gId][mId] = {}//testCreateEmptyTotalsObj();
    }

    //all time weapon totals
  //  if(totals[pId][0][0][wId]){
  //      totals[pId][0][0][wId] = {}//testCreateEmptyTotalsObj();
  //  }

    //all time weapons totals
    if(totals[pId][0][0][wId] === undefined){
        totals[pId][0][0][wId] = testCreateEmptyTotalsObj();
    }

    //gametype weapon totals
    if(totals[pId][gId][0][wId] === undefined){
        totals[pId][gId][0][wId] = testCreateEmptyTotalsObj();
    }

    //map weapon totals
    if(totals[pId][0][mId][wId] === undefined){
        totals[pId][0][mId][wId] = testCreateEmptyTotalsObj();
    }

    //gametype & map weapon totals
    if(totals[pId][gId][mId][wId] === undefined){
        totals[pId][gId][mId][wId] = testCreateEmptyTotalsObj();
    }

    const allTime = totals[pId][0][0][wId];
    const gametypeTotals = totals[pId][gId][0][wId];
    const mapTotals = totals[pId][0][mId][wId];
    const gametypeMapComboTotals = totals[pId][gId][mId][wId];

    const totalKeys = ["playtime", "kills", "deaths", "suicides", "team_kills"];

    allTime.matches += matchData.total_matches;
    gametypeTotals.matches+= matchData.total_matches;
    mapTotals.matches+= matchData.total_matches;
    gametypeMapComboTotals.matches+= matchData.total_matches;

    allTime.playtime+=matchData.playtime;
    gametypeTotals.playtime+=matchData.playtime;
    mapTotals.playtime+=matchData.playtime;
    gametypeMapComboTotals.playtime+=matchData.playtime;


    const higherKeys = {
        "kills": "max_kills", 
        "deaths": "max_deaths", 
        "suicides": "max_suicides", 
        "team_kills": "max_team_kills"
    };

    for(const [dataKey, maxKey] of Object.entries(higherKeys)){

        if(matchData[dataKey] > allTime[maxKey]) allTime[maxKey] = matchData[dataKey];
        if(matchData[dataKey] > gametypeTotals[maxKey]) gametypeTotals[maxKey] = matchData[dataKey];
        if(matchData[dataKey] > mapTotals[maxKey]) mapTotals[maxKey] = matchData[dataKey];
        if(matchData[dataKey] > gametypeMapComboTotals[maxKey]) gametypeMapComboTotals[maxKey] = matchData[dataKey];
    }


    for(let i = 0; i < totalKeys.length; i++){

        const k = totalKeys[i];

        allTime[k] += matchData[k]; 
        gametypeTotals[k] += matchData[k]; 
        mapTotals[k] += matchData[k]; 
        gametypeMapComboTotals[k] += matchData[k]; 
    }

    const avgKeys = {
        "kills": "avg_kills",
        "deaths": "avg_deaths",
        "suicides": "avg_team_kills",
        "team_kills": "avg_team_kills",
    };

    for(const [dataKey, avgKey] of Object.entries(avgKeys)){


        if(allTime.matches > 0 && allTime[dataKey] > 0){
            allTime[avgKey] = allTime[dataKey] / allTime.matches;
        }

        if(gametypeTotals.matches > 0 && gametypeTotals[dataKey] > 0){
            gametypeTotals[avgKey] = gametypeTotals[dataKey] / gametypeTotals.matches;
        }

        if(mapTotals.matches > 0 && mapTotals[dataKey] > 0){
            mapTotals[avgKey] = mapTotals[dataKey] / mapTotals.matches;
        }

        if(gametypeMapComboTotals.matches > 0 && gametypeMapComboTotals[dataKey] > 0){
            gametypeMapComboTotals[avgKey] = gametypeMapComboTotals[dataKey] / gametypeMapComboTotals.matches;
        }

    }

}

async function testBulkUpdatePlayerTotals(totals, seasonId){

    const insertVars = [];

    for(const [playerId, playerData] of Object.entries(totals)){
        
        for(const [gametypeId, playerMapData] of Object.entries(playerData)){

            for(const [mapId, mapTotals] of Object.entries(playerMapData)){
                
                for(const [weaponId, weaponData] of Object.entries(mapTotals)){

                    let eff = 0;

                    const neg = weaponData.deaths + weaponData.team_kills;

                    if(neg > 0){
                        eff = weaponData.kills / (weaponData.kills + neg) * 100;
    
                    }else if(weaponData.kills > 0){
                        eff = 100;
                    }

                 

                    const mins = (weaponData.playtime > 0) ? weaponData.playtime / 60 : 0;

                    weaponData.epm_kills = 0;
                    weaponData.epm_deaths = 0;
                    weaponData.epm_suicides = 0;
                    weaponData.epm_team_kills = 0;

                    if(mins > 0){

                        if(weaponData.kills > 0) weaponData.epm_kills = weaponData.kills / mins;
                        if(weaponData.deaths > 0) weaponData.epm_deaths = weaponData.deaths / mins;
                        if(weaponData.suicides > 0) weaponData.epm_suicides = weaponData.suicides / mins;
                        if(weaponData.team_kills > 0) weaponData.epm_team_kills = weaponData.team_kills / mins;
                    }

                    insertVars.push([
                        playerId, gametypeId, weaponId, weaponData.matches, 
                        weaponData.kills, weaponData.deaths, weaponData.suicides, 
                        weaponData.team_kills,
                        eff, mapId, weaponData.max_kills, weaponData.max_deaths, 
                        weaponData.max_suicides, weaponData.max_team_kills,
                        weaponData.playtime,
                        weaponData.avg_kills, weaponData.avg_deaths, 
                        weaponData.avg_suicides, weaponData.avg_team_kills,
                        weaponData.epm_kills, weaponData.epm_deaths, 
                        weaponData.epm_suicides, weaponData.epm_team_kills,
                        seasonId
                    ]);
                }
            }
        }
    }


    const columns = [`player_id`, `gametype_id`, `weapon_id`,
            `total_matches`, `kills`, `deaths`, `suicides`, `team_kills`, 
            `eff`, `map_id`, `max_kills`, `max_deaths`, `max_suicides`, `max_team_kills`,
            `playtime`,
            `avg_kills`, `avg_deaths`, `avg_suicides`, `avg_team_kills`,
            `epm_kills`, `epm_deaths`, `epm_suicides`, `epm_team_kills`, `season_id`
        ];

    return await sqlInsertOnDuplicateUpdate(
        "nstats_player_totals_weapons", 
        columns, 
        insertVars, 
        ["player_id", "season_id", "gametype_id", "map_id", "weapon_id"]
    );
}

export async function updatePlayerTotals(playerIds, seasonId){

    if(playerIds !== null && playerIds.length === 0) return null;
    
    if(seasonId === undefined) seasonId = 0;
    seasonId = parseInt(seasonId);
    if(seasonId !== seasonId) throw new Error(`seasonId must be valid integer`);

    const test = await testCalculatePlayerTotalsFromMatchData(playerIds, seasonId);


    const totals = {};

    for(let i = 0; i < test.length; i++){

        testUpdatePlayerTotalsObject(totals, test[i]);
    }


    await testBulkUpdatePlayerTotals(totals, seasonId);

    return;

}


export async function getPlayerTotals(playerId, seasonId){

    const query = `SELECT 
    nstats_player_totals_weapons.gametype_id,
    nstats_player_totals_weapons.map_id,
    nstats_player_totals_weapons.weapon_id,
    nstats_player_totals_weapons.total_matches,
    nstats_player_totals_weapons.kills,
    nstats_player_totals_weapons.deaths,
    nstats_player_totals_weapons.suicides,
    nstats_player_totals_weapons.team_kills,
    nstats_player_totals_weapons.eff,
    nstats_player_totals_weapons.max_kills,
    nstats_player_totals_weapons.max_deaths,
    nstats_player_totals_weapons.max_suicides,
    nstats_player_totals_weapons.max_team_kills,
    nstats_player_totals_weapons.avg_kills,
    nstats_player_totals_weapons.avg_deaths,
    nstats_player_totals_weapons.avg_suicides,
    nstats_player_totals_weapons.avg_team_kills,
    nstats_player_totals_weapons.epm_kills,
    nstats_player_totals_weapons.epm_deaths,
    nstats_player_totals_weapons.epm_suicides,
    nstats_player_totals_weapons.epm_team_kills,
    nstats_player_totals_weapons.playtime,
    nstats_weapons.name as weapon_name,
    IF(nstats_player_totals_weapons.gametype_id = 0, 'All Gametypes', nstats_gametypes.name) as gametype_name,
    IF(nstats_player_totals_weapons.map_id = 0, 'All Maps', nstats_maps.name) as map_name
    FROM nstats_player_totals_weapons 
    LEFT JOIN nstats_weapons ON nstats_weapons.id = nstats_player_totals_weapons.weapon_id
    LEFT JOIN nstats_gametypes ON nstats_gametypes.id = nstats_player_totals_weapons.gametype_id
    LEFT JOIN nstats_maps ON nstats_maps.id = nstats_player_totals_weapons.map_id
    WHERE nstats_player_totals_weapons.player_id=? AND nstats_player_totals_weapons.season_id=?`;

    return await simpleQuery(query, [playerId, seasonId]);
}


export async function changePlayerMatchIds(oldIds, newId){

    if(oldIds.length === 0) return {"changedRows": 0};

    const query = `UPDATE nstats_match_weapon_stats SET player_id=? WHERE player_id IN (?)`;

    return await simpleQuery(query, [newId, oldIds]);
}

function toWeaponImageName(name){

    name = name.toLowerCase();
    name = name.replace(/\W/ig, "");
    return name;
}

export function getWeaponImage(images, name){

    if(Object.keys(images).length === 0) return false;
    name = toWeaponImageName(name);

    for(const [key, value] of Object.entries(images)){

        if(key === name) return name;
    }

    return "blank";

}

export async function getAllImages(){

 
    const reg = /^(.+)\..+$/i;

    const files = await readdir("./public/images/weapons/");

    const data = {};

    for(let i = 0; i < files.length; i++){

        const f = files[i];

        const result = reg.exec(f);

        if(result === null) continue;

        data[result[1]] = f;
    }

    return data;

  
}

export async function setMatchMapGametypeIds(data){

    const query = `UPDATE nstats_match_weapon_stats SET gametype_id=?, map_id=? WHERE match_id=?`;

    const queries = [];

    for(const [matchId, m] of Object.entries(data)){

        queries.push(simpleQuery(query, [m.gametype, m.map, matchId]));
    }

    await Promise.all(queries);
}

export async function deleteAllMapWeaponsTotals(seasonId){

    seasonId = parseInt(seasonId);
    if(seasonId !== seasonId) throw new Error(`seasonId must be valid integer`);
    const query = `DELETE FROM nstats_map_weapon_totals WHERE season_id=?`;

    return await simpleQuery(query, [seasonId]);
}

async function bulkInsertMapWeaponTotals(seasonId, totals){

    const t = `nstats_map_weapon_totals`;

    const insertVars = [];

    for(let i = 0; i < totals.length; i++){

        const d = totals[i];

        insertVars.push([
            d.map_id,
            d.total_matches,
            d.total_playtime,
            d.weapon_id,
            d.total_kills,
            d.total_deaths,
            d.total_suicides,
            d.total_team_kills,
            d.kpm,
            d.dpm,
            d.tkpm,
            d.spm,
            d.gametype_id,
            d.max_kills,
            d.max_deaths,
            d.max_suicides,
            d.max_team_kills,
            seasonId
        ]);
    }

    const columns = [
        "map_id", "total_matches", "total_playtime", "weapon_id", "kills", 
        "deaths", "suicides", "team_kills", "kills_per_min", "deaths_per_min", 
        "team_kills_per_min", "suicides_per_min", "gametype_id", "max_kills",
        "max_deaths", "max_suicides", "max_team_kills", "season_id"
    ];

    return await sqlInsertOnDuplicateUpdate(t,columns, insertVars, ["map_id", "season_id", "gametype_id", "weapon_id"]);
    //await bulkInsert(query, insertVars);
}

export async function calcMapWeaponsTotals(seasonId, mapId, gametypeId){

    seasonId = parseInt(seasonId);
    if(seasonId !== seasonId) throw new Error(`seasonId must be valid integer`);


    let where = "";
    const vars = [];

    if(seasonId !== 0){

        where = `season_id=? AND `;
        vars.unshift(seasonId);
    }

    if(gametypeId !== 0){
        where += `gametype_id=? AND `;

        vars.push(gametypeId);

    }

    vars.push(mapId);


    const query = `
        WITH weapon_stats AS (SELECT 
            ${(gametypeId === 0) ? "0 as gametype_id," : "ws.gametype_id,"}
            ws.map_id,
            ws.weapon_id,
            SUM(ws.kills) as total_kills,
            MAX(ws.kills) as max_kills,
            SUM(ws.deaths) as total_deaths,
            MAX(ws.deaths) as max_deaths,
            SUM(ws.team_kills) as total_team_kills,
            MAX(ws.team_kills) as max_team_kills,
            SUM(ws.suicides) as total_suicides,
            MAX(ws.suicides) as max_suicides,
            m.total_playtime,
            m.total_matches
        FROM nstats_match_weapon_stats AS ws
        INNER JOIN (
            SELECT id, map_id, SUM(playtime) as total_playtime, COUNT(*) as total_matches
            FROM nstats_matches
            WHERE ${where}map_id=?
        ) as m ON ws.match_id = m.id
        GROUP BY ${(gametypeId === 0) ? "" : "ws.gametype_id,"}ws.map_id,ws.weapon_id)

        SELECT *,
        ${seasonId} as season_id, 
        COALESCE(total_kills / (NULLIF(total_playtime, 0) / 60) , 0)as kpm,
        COALESCE(total_deaths / (NULLIF(total_playtime, 0) / 60) , 0) as dpm,
        COALESCE(total_suicides / (NULLIF(total_playtime, 0) / 60) , 0) as spm,
        COALESCE(total_team_kills / (NULLIF(total_playtime, 0) / 60),  0) as tkpm
        FROM weapon_stats
   
    `;

    const result = await simpleQuery(query, vars);


    await bulkInsertMapWeaponTotals(seasonId, result);

    return;
}


export async function getMapWeaponStats(seasonId, mapId){

    seasonId = parseInt(seasonId);
    if(seasonId !== seasonId) throw new Error(`seasonId must be valid integer`);

    const query = `SELECT 
    mt.total_matches,
    mt.total_playtime,
    mt.weapon_id,
    mt.kills,
    mt.deaths,
    mt.team_kills,
    mt.kills_per_min,
    mt.deaths_per_min,
    mt.team_kills_per_min,
    mt.suicides,
    mt.suicides_per_min,
    mt.gametype_id,
    mt.max_kills,
    mt.max_deaths,
    mt.max_suicides,
    mt.max_team_kills,
    IF(mt.gametype_id != 0, gt.name, 'All Gametypes') as gametype_name, 
    wt.name as weapon_name 
    FROM nstats_map_weapon_totals as mt
    LEFT JOIN nstats_gametypes as gt ON mt.gametype_id = gt.id
    LEFT JOIN nstats_weapons as wt ON mt.weapon_id = wt.id
    WHERE mt.map_id=? AND mt.season_id=?`;

    return await simpleQuery(query, [mapId, seasonId]);

}

//this version weapon stats(playtime, matches) aren't counted for just matches used but all matches with mapId
/*export async function setAllMapTotals(){

    const seasonIds = await getAllSeasonIds(false);

    for(let i = 0; i < seasonIds.length; i++){

        const seasonId = seasonIds[i];

        let where = ``;
        const vars = [seasonId];

        if(seasonId !== 0){
            where = `WHERE ws.match_id IN(SELECT id FROM nstats_matches WHERE season_id=?)`;
            vars.push(seasonId);
        }


        //cant use nstats_seasons_unique_match_combinations as it's not been updated until log has been imported
        //gametype_id isn't used yet
        const query = `WITH playtime_stats AS (
                SELECT map_id,SUM(playtime) as total_playtime, COUNT(*) as total_matches 
                FROM nstats_matches WHERE season_id=? GROUP BY map_id
            ),
        
        
        map_totals AS (SELECT ws.match_id,ws.map_id,ws.weapon_id,
        ${seasonId} as season_id,
        SUM(ws.kills) as total_kills,
        SUM(ws.deaths) as total_deaths,
        SUM(ws.team_kills) as total_team_kills,
        SUM(ws.suicides) as total_suicides,
        MAX(ws.kills) as max_kills,
        MAX(ws.deaths) as max_deaths,
        MAX(ws.team_kills) as max_team_kills,
        MAX(ws.suicides) as max_suicides,
        COALESCE(playtime_stats.total_matches, 0) as total_matches,
        COALESCE(playtime_stats.total_playtime, 0) as total_playtime
        FROM nstats_match_weapon_stats as ws
        LEFT JOIN playtime_stats ON playtime_stats.map_id = ws.map_id
        ${where}
        GROUP BY ws.map_id,ws.weapon_id)
  
        SELECT *, 
        COALESCE(total_kills / (NULLIF(total_playtime, 0) / 60), 0) as kpm,
        COALESCE(total_deaths / (NULLIF(total_playtime, 0) / 60), 0) as dpm,
        COALESCE(total_team_kills / (NULLIF(total_playtime, 0) / 60), 0) as tkpm,
        COALESCE(total_suicides / (NULLIF(total_playtime, 0) / 60), 0) as spm
        FROM map_totals
        `;

        const result = await simpleQuery(query, vars);

        const columns = ["map_id", "total_matches", "total_playtime", "weapon_id", "kills", "deaths", "suicides", "team_kills",
            "kills_per_min", "deaths_per_min", "team_kills_per_min", "suicides_per_min", "gametype_id", 
            "max_kills", "max_deaths", "max_team_kills", "max_suicides", "season_id"];

        const insertVars = result.map((r) =>{
            
            return [
                r.map_id, r.total_matches, r.total_playtime, r.weapon_id, r.total_kills, 
                r.total_deaths, r.total_suicides, r.total_team_kills, r.kpm, r.dpm, r.tkpm,
                r.spm, 0, r.max_kills, r.max_deaths, r.max_team_kills, r.max_suicides, seasonId
            ]
        });

        await sqlInsertOnDuplicateUpdate("nstats_map_weapon_totals", columns, insertVars, ["map_id","season_id","gametype_id","weapon_id"]);
    }
}*/



async function recalculateMapTotals(seasonId, bAllTime){

    const query = `WITH weapon_stats AS (SELECT 
    ${seasonId} as season_id,
    ${((bAllTime) ? "0 as gametype_id," : "ws.gametype_id,")}
    ws.map_id,
    ws.weapon_id,
    SUM(ws.kills) as total_kills,
    SUM(ws.deaths) as total_deaths,
    SUM(ws.suicides) as total_suicides,
    SUM(ws.team_kills) as total_team_kills,
    MAX(ws.kills) as max_kills,
    MAX(ws.deaths) as max_deaths,
    MAX(ws.suicides) as max_suicides,
    MAX(ws.team_kills) as max_team_kills,
    m.total_playtime,
    m.total_matches
    FROM nstats_match_weapon_stats AS ws
    INNER JOIN (
        SELECT id,map_id,${(bAllTime) ? "" : "gametype_id,"}SUM(playtime) as total_playtime, 
        COUNT(*) as total_matches 
        FROM nstats_matches 
        ${((seasonId === 0) ? "" : "WHERE season_id=?")} GROUP BY ${(bAllTime) ? "" : "gametype_id,"}map_id
    ) as m ON ws.match_id=m.id
    GROUP BY ${((bAllTime) ? "" : "ws.gametype_id,")} ws.map_id, ws.weapon_id)
    
    SELECT *,
    COALESCE(total_kills / (NULLIF(total_playtime, 0) / 60), 0) as kpm,
    COALESCE(total_deaths / (NULLIF(total_playtime, 0) / 60), 0) as dpm,
    COALESCE(total_team_kills / (NULLIF(total_playtime, 0) / 60), 0) as tkpm,
    COALESCE(total_suicides / (NULLIF(total_playtime, 0) / 60), 0) as spm
    FROM weapon_stats
    `;

    const vars = [];

    if(seasonId !== 0) vars.push(seasonId);

    const result = await simpleQuery(query, vars);


    const columns = ["map_id", "total_matches", "total_playtime", "weapon_id", "kills", "deaths", "suicides", "team_kills",
        "kills_per_min", "deaths_per_min", "team_kills_per_min", "suicides_per_min", "gametype_id", 
        "max_kills", "max_deaths", "max_team_kills", "max_suicides", "season_id"];

    const insertVars = result.map((r) =>{
        
        return [
            r.map_id, r.total_matches, r.total_playtime, r.weapon_id, r.total_kills, 
            r.total_deaths, r.total_suicides, r.total_team_kills, r.kpm, r.dpm, r.tkpm,
            r.spm, r.gametype_id, r.max_kills, r.max_deaths, r.max_team_kills, r.max_suicides, seasonId
        ]
    });

    await sqlInsertOnDuplicateUpdate("nstats_map_weapon_totals", columns, insertVars, ["map_id","season_id","gametype_id","weapon_id"]);
}


export async function setAllMapTotals(){


    await sqliteDeleteTable("map_weapon_totals");

    const seasonIds = await getAllSeasonIds(false);

    for(let i = 0; i < seasonIds.length; i++){

        const seasonId = seasonIds[i];

        //gametypeTotals
        await recalculateMapTotals(seasonId, false);
        //map all time totals
        await recalculateMapTotals(seasonId, true);
    }

}


async function deleteAllPlayerWeaponTotals(){

    return await simpleQuery(`DELETE FROM nstats_player_totals_weapons WHERE id>=0`);
}

export async function recalculateAllPlayerTotals(){


    await deleteAllPlayerWeaponTotals();
    return await updatePlayerTotals(null);

    
}