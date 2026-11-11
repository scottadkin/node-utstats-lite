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


function createPlayerTotalsSubQuery(bGroupSeasons, bGroupGametypes, bGroupMaps){

    const minutes = `NULLIF((SUM(playtime) / 60), 0)`;

    const totalMatches = `SUM(total_matches)`;

    const totalKills = `(SUM(kills) * 1.0)`;
    const totalDeaths = `(SUM(deaths) * 1.0)`;
    const totalTeamKills = `(SUM(team_kills) * 1.0)`;
    const totalSuicides = `(SUM(suicides) * 1.0)`;


    return `SELECT player_id,
    ${(bGroupSeasons) ? "season_id" : "0 as season_id"},
    ${(bGroupMaps) ? "map_id" : "0 as map_id"},
    ${(bGroupGametypes) ? "gametype_id" : "0 as gametype_id"},
    weapon_id,
    ${totalMatches} as total_matches,
    SUM(playtime) as playtime,
    SUM(kills) as kills,
    ${totalKills} / ${totalMatches} as avg_kills,
    ${totalKills} /  ${minutes} as epm_kills,
    MAX(kills) as max_kills,
    SUM(deaths) as deaths,
    ${totalDeaths} / ${totalMatches} as avg_deaths,
    ${totalDeaths} / ${minutes} as epm_deaths,
    MAX(deaths) as max_deaths,
    SUM(team_kills) as team_kills,
    ${totalTeamKills} / ${totalMatches} as avg_team_kills,
    ${totalTeamKills} / ${minutes} as epm_team_kills,
    MAX(team_kills) as max_team_kills,
    SUM(suicides) as suicides,
    ${totalSuicides} / ${totalMatches} as avg_suicides,
    ${totalSuicides} / ${minutes} as epm_suicides,
    MAX(suicides) as max_suicides,
    IF(${totalKills} > 0, ${totalKills} / (${totalKills} + ${totalDeaths} + ${totalTeamKills}) * 100, 0) as eff
    FROM player_totals GROUP BY player_id
    ${(bGroupSeasons) ? ",season_id" : ""}
    ${(bGroupGametypes) ? ",gametype_id" : ""}
    ${(bGroupMaps) ? ",map_id" : ""}
    ,weapon_id
    `;
}

export async function updatePlayerTotals(playerIds, seasonId){

 
    if(playerIds !== null && playerIds.length === 0) return;
    
    if(seasonId === undefined) seasonId = 0;
    seasonId = parseInt(seasonId);
    if(seasonId !== seasonId) throw new Error(`seasonId must be valid integer`);


    const vars = [playerIds];


    const query = `WITH player_totals AS (
        SELECT ws.player_id,ws.map_id,ws.gametype_id,ws.weapon_id,
        COUNT(*) as total_matches,
        nstats_matches.season_id,
        SUM(mp.time_on_server) as playtime,
        SUM(ws.kills) as kills,
        MAX(ws.kills) as max_kills,
        SUM(ws.deaths) as deaths,
        MAX(ws.deaths) as max_deaths,
        SUM(ws.team_kills) as team_kills,
        MAX(ws.team_kills) as max_team_kills,
        SUM(ws.suicides) as suicides,
        MAX(ws.suicides) as max_suicides
        FROM nstats_match_weapon_stats AS ws
        INNER JOIN nstats_matches ON nstats_matches.id = ws.match_id
        INNER JOIN nstats_match_players AS mp ON mp.player_id=ws.player_id AND mp.match_id=ws.match_id
        WHERE ws.player_id IN (?)
        AND mp.spectator=0
        
        GROUP BY season_id,ws.player_id,ws.gametype_id,ws.map_id,ws.weapon_id

    )
    ${createPlayerTotalsSubQuery(false, true, true)}  
    UNION ALL ${createPlayerTotalsSubQuery(false, true, false)}  
    UNION ALL ${createPlayerTotalsSubQuery(false, false, true)}  
    UNION ALL ${createPlayerTotalsSubQuery(false, false, false)}  

    UNION ALL ${createPlayerTotalsSubQuery(true, true, true)}  
    UNION ALL ${createPlayerTotalsSubQuery(true, true, false)}  
    UNION ALL ${createPlayerTotalsSubQuery(true, false, true)}  
    UNION ALL ${createPlayerTotalsSubQuery(true, false, false)}  
    `;



    const result = await simpleQuery(query, vars);

    //console.log(result);

    //for(let i = 0; i < result.length; i++){

      //  const r = result[i];

      //  console.log(r.player_id, r.season_id, r.gametype_id, r.map_id, r.weapon_id, r.total_matches)
   // }

   // process.exit();


    
    const columns = [`player_id`, `gametype_id`, `weapon_id`,
            `total_matches`, `kills`, `deaths`, `suicides`, `team_kills`, 
            `eff`, `map_id`, `max_kills`, `max_deaths`, `max_suicides`, `max_team_kills`,
            `playtime`,
            `avg_kills`, `avg_deaths`, `avg_suicides`, `avg_team_kills`,
            `epm_kills`, `epm_deaths`, `epm_suicides`, `epm_team_kills`, `season_id`
        ];

    const insertVars = [];

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        const vars = [];

        for(let x = 0; x < columns.length; x++){

            vars.push(r[columns[x]])
        }

        insertVars.push(vars);
    }

    await sqlInsertOnDuplicateUpdate(
        "nstats_player_totals_weapons", 
        columns, 
        insertVars, 
        ["player_id", "season_id", "gametype_id", "map_id", "weapon_id"]
    );

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