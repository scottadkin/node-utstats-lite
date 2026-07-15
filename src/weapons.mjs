import { bulkInsert, simpleQuery, sqlInsertOnDuplicateUpdate, sqlInsertReturnRowId } from "./database.mjs";
import { getMatchesGametype, getMatchesPlaytime } from "./matches.mjs";
import { getAllMapIds, getAllUniquePlayedGametypes, getTotalPlaytimeAndMatches } from "./maps.mjs";
import { readdir } from 'node:fs/promises';
import Message from "./message.mjs";


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



async function getAllPlayerMatchData(playerIds){

    const query = `SELECT 
    gametype_id,
    map_id,
    player_id,
    weapon_id,
    COUNT(*) as total_matches,
    SUM(kills) as kills,
    SUM(deaths) as deaths,
    SUM(team_kills) as team_kills,
    SUM(suicides) as suicides
    FROM nstats_match_weapon_stats 
    WHERE player_id IN (?)
    GROUP BY player_id,gametype_id,map_id,weapon_id`;

    return await simpleQuery(query, [playerIds]);
}


async function deleteMultiplePlayerTotals(playerIds){

    if(playerIds.length === 0) return;
    const query = `DELETE FROM nstats_player_totals_weapons WHERE player_id IN (?)`;

    return await simpleQuery(query, [playerIds]);
}


async function calcPlayersTotalsFromMatchDataByGroup(playerIds, type){

    if(playerIds !== null && playerIds.length === 0) return;
    const validTypes = ["all", "gametypes", "maps"];

    if(validTypes.indexOf(type) === -1) throw new Error("Not a valid type for getPlayersMatchDataByGroup");


    const columns = `player_id,
        weapon_id,
        COUNT(*) as total_matches,
        SUM(kills) as kills,
        MAX(kills) as max_kills,
        SUM(deaths) as deaths,
        MAX(deaths) as max_deaths,
        SUM(team_kills) as team_kills,
        MAX(team_kills) as max_team_kills,
        SUM(suicides) as suicides,
        MAX(suicides) as max_suicides`;

    let query = ``;

    const where = (playerIds !== null) ? `WHERE player_id IN (?)` : ``;

    const vars = (playerIds !== null) ? [playerIds] : [];

    if(type === "all"){

        query = `SELECT 
        ${columns}
        FROM nstats_match_weapon_stats 
        ${where}
        GROUP BY player_id,weapon_id`;

    }else if(type === "gametypes"){

        query = `SELECT 
        gametype_id,
        ${columns}
        FROM nstats_match_weapon_stats 
        ${where}
        GROUP BY player_id,gametype_id,weapon_id`;

    }else if(type === "maps"){

        query = `SELECT 
        map_id,
        ${columns}
        FROM nstats_match_weapon_stats 
        ${where}
        GROUP BY player_id,map_id,weapon_id`;
    }


    return await simpleQuery(query, vars);
}


export async function updatePlayerTotals(playerIds){

    if(playerIds.length === 0) return null;

    const allTotals = await calcPlayersTotalsFromMatchDataByGroup(playerIds, "all");
    const gametypeTotals = await calcPlayersTotalsFromMatchDataByGroup(playerIds, "gametypes");
    const mapTotals = await calcPlayersTotalsFromMatchDataByGroup(playerIds, "maps");


    const promises = [
        bulkInsertPlayerTotalsNew(allTotals, "all", false), 
        bulkInsertPlayerTotalsNew(gametypeTotals, "gametypes", false), 
        bulkInsertPlayerTotalsNew(mapTotals, "maps", false)
    ];

    return await Promise.all(promises);


}

async function bulkInsertPlayerTotalsNew(data, type, bRecalc){

    const validTypes = ["all", "gametypes", "maps"];

    if(validTypes.indexOf(type) === -1) throw new Error(`Not a valid type for bulkInsertPlayerTotalsNew`);
    const insertVars = [];

    const playerIds = new Set();


    for(let i = 0; i < data.length; i++){

        const d = data[i];

        let gametype = 0;
        let map = 0;

        if(type === "gametypes"){
            gametype = d.gametype_id;
        }else if(type === "maps"){
            map = d.map_id;
        }


        let eff = 0;

        if(d.kills > 0){

            const totalNeg = d.deaths + d.team_kills;

            if(totalNeg > 0){
                eff = (d.kills / (d.kills + totalNeg)) * 100;
            }else{
                eff = 100;
            }
        }


      
        insertVars.push([
            d.player_id, gametype, d.weapon_id,
            d.total_matches, d.kills, d.deaths,
            d.suicides, d.team_kills, eff, 
            map, d.max_kills, d.max_deaths, 
            d.max_suicides, d.max_team_kills
        ]);

   
    }


    if(!bRecalc){

        const t = "nstats_player_totals_weapons";

        const columns = [`player_id`, `gametype_id`, `weapon_id`,
            `total_matches`, `kills`, `deaths`, `suicides`, `team_kills`, 
            `eff`, `map_id`, `max_kills`, `max_deaths`, `max_suicides`, `max_team_kills`
        ];

        await sqlInsertOnDuplicateUpdate(t, columns, insertVars, ["player_id","gametype_id", "map_id", "weapon_id"]);

    }else{

        //need to make sure we have deleted all data in table first

        const query = `INSERT INTO nstats_player_totals_weapons (player_id, gametype_id, weapon_id,
            total_matches, kills, deaths, suicides, team_kills, 
            eff, map_id, max_kills, max_deaths, max_suicides, max_team_kills) 
            VALUES ?`;

        await bulkInsert(query, insertVars);
    }


}

export async function getPlayerTotals(playerId){

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
    nstats_weapons.name as weapon_name,
    IF(nstats_player_totals_weapons.gametype_id = 0, 'All Gametypes', nstats_gametypes.name) as gametype_name,
    IF(nstats_player_totals_weapons.map_id = 0, 'All Maps', nstats_maps.name) as map_name
    FROM nstats_player_totals_weapons 
    LEFT JOIN nstats_weapons ON nstats_weapons.id = nstats_player_totals_weapons.weapon_id
    LEFT JOIN nstats_gametypes ON nstats_gametypes.id = nstats_player_totals_weapons.gametype_id
    LEFT JOIN nstats_maps ON nstats_maps.id = nstats_player_totals_weapons.map_id
    WHERE nstats_player_totals_weapons.player_id=?`;

    return await simpleQuery(query, [playerId]);
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

async function deleteMapWeaponTotals(mapId){

    const query = `DELETE FROM nstats_map_weapon_totals WHERE map_id=?`;

    return await simpleQuery(query, [mapId]);
}

async function bulkInsertMapWeaponTotals(totals){

    const t = `nstats_map_weapon_totals`;

    const insertVars = [];

    for(let i = 0; i < totals.length; i++){

        const d = totals[i];

        insertVars.push([
            d.mapId,
            d.matches,
            d.playtime,
            d.weapon_id,
            d.kills,
            d.deaths,
            d.suicides,
            d.team_kills,
            d.killsPerMin,
            d.deathsPerMin,
            d.teamKillsPerMin,
            d.suicidesPerMin,
            d.gametypeId,
            d.max_kills,
            d.max_deaths,
            d.max_suicides,
            d.max_team_kills,
        ]);
    }


    const columns = [
        "map_id", "total_matches", "total_playtime", "weapon_id", "kills", 
        "deaths", "suicides", "team_kills", "kills_per_min", "deaths_per_min", 
        "team_kills_per_min", "suicides_per_min", "gametype_id", "max_kills",
        "max_deaths", "max_suicides", "max_team_kills"
    ];

    return await sqlInsertOnDuplicateUpdate(t,columns, insertVars, ["map_id", "gametype_id", "weapon_id"]);
    //await bulkInsert(query, insertVars);
}

async function calcMapWeaponTotalsFromMatchTable(mapId, gametypeId){


    let gametypeIdString = "";
    let whereString = "WHERE map_id=?";
    const vars = [mapId];

    if(gametypeId !== 0){
        vars.push(gametypeId);
        gametypeIdString = "gametype_id,";
        whereString += " AND gametype_id=?";
    }

    const query = `SELECT ${gametypeIdString}weapon_id, 
    SUM(kills) as kills, 
    MAX(kills) as max_kills,
    SUM(deaths) as deaths,
    MAX(deaths) as max_deaths, 
    SUM(team_kills) as team_kills,
    MAX(team_kills) as max_team_kills, 
    SUM(suicides) as suicides,
    MAX(suicides) as max_suicides
    FROM nstats_match_weapon_stats ${whereString} GROUP BY ${gametypeIdString}weapon_id`;


    return await simpleQuery(query, vars);
}


function setXPH(data, totalMatches, playtime, mapId, gametypeId){

    for(let i = 0; i < data.length; i++){

        const d = data[i];

        d.matches = totalMatches;
        d.playtime = playtime;
        d.mapId = mapId;
        d.gametypeId = gametypeId;

        d.killsPerMin = 0;
        d.deathsPerMin = 0;
        d.teamKillsPerMin = 0;
        d.suicidesPerMin = 0;

        if(playtime <= 0) continue;

        if(d.kills > 0){
            d.killsPerMin = (d.kills / playtime) * 60;
        }

        if(d.deaths > 0){
            d.deathsPerMin = (d.deaths / playtime) * 60;
        }

        if(d.suicides > 0){
            d.suicidesPerMin = (d.suicides / playtime) * 60;
        }

        if(d.team_kills > 0){
            d.teamKillsPerMin = (d.team_kills / playtime) * 60;
        }
    }
}

export async function calcMapWeaponsTotals(mapId, gametypeId){

    const gametypeData = await calcMapWeaponTotalsFromMatchTable(mapId, gametypeId);
    const allTimeData = await calcMapWeaponTotalsFromMatchTable(mapId, 0);

    const {playtime: allTimePlaytime, matches: allTimeMatches} = await getTotalPlaytimeAndMatches(mapId, 0);
    const {playtime: gametypePlaytime, matches: gametypeMatches} = await getTotalPlaytimeAndMatches(mapId, gametypeId);

    setXPH(allTimeData, allTimeMatches, allTimePlaytime, mapId, 0);
    setXPH(gametypeData, gametypeMatches, gametypePlaytime, mapId, gametypeId);

    await bulkInsertMapWeaponTotals(allTimeData);
    await bulkInsertMapWeaponTotals(gametypeData);
}


export async function getMapWeaponStats(mapId){

    const query = `SELECT total_matches,total_playtime,weapon_id,kills,deaths,team_kills,kills_per_min,
    deaths_per_min,team_kills_per_min,suicides,suicides_per_min FROM nstats_map_weapon_totals WHERE map_id=?`;

    const result = await simpleQuery(query, [mapId]);

    const weaponIds = [...result.map((r) =>{
        return r.weapon_id;
    })]

    const weaponNames = await getWeaponNames(weaponIds);

    const totals = {
        "kills": 0,
        "deaths": 0,
        "suicides": 0,
        "team_kills": 0,
    };

    for(let i = 0; i < result.length; i++){

        const r = result[i]; 
        r.name = weaponNames[r.weapon_id] ?? "Not Found";

        totals.kills += r.kills;
        totals.deaths += r.deaths;
        totals.suicides += r.suicides;
        totals.team_kills += r.team_kills;
    }

    return {"weapons": result, totals};
}



async function getAllMapData(mapId){

    const query = `SELECT match_id,map_id,weapon_id,SUM(kills) as kills,SUM(deaths) as deaths, SUM(team_kills) as team_kills,SUM(suicides) as suicides
    FROM nstats_match_weapon_stats WHERE map_id=? GROUP BY match_id,weapon_id,map_id`;

    return await simpleQuery(query, [mapId]);
}


async function deleteAllMapTotals(){

    const query = `DELETE FROM nstats_map_weapon_totals`;

    await simpleQuery(query);
}


async function bulkInsertMapTotals(totals){


    const insertVars = [];

    for(const [mapId, mapData] of Object.entries(totals)){

        for(const [weaponId, wData] of Object.entries(mapData)){

            let kpm = 0;
            let dpm = 0;
            let tkpm = 0;
            let spm = 0;

            if(wData.playtime > 0){

                if(wData.kills > 0){
                    kpm = wData.kills / (wData.playtime / 60);
                }

                if(wData.deaths > 0){
                    dpm = wData.deaths / (wData.playtime / 60);
                }

                if(wData.teamKills > 0){
                    tkpm = wData.teamKills / (wData.playtime / 60);
                }

                if(wData.suicides > 0){
                    spm = wData.suicides / (wData.playtime / 60);
                }
            }


            insertVars.push([
                mapId, wData.matchIds.size,wData.playtime,weaponId,wData.kills,wData.deaths,wData.suicides,
                wData.teamKills, kpm, dpm, tkpm, spm
            ]);
        }   
    }

    const query = `INSERT INTO nstats_map_weapon_totals (
    map_id,total_matches,total_playtime,weapon_id,kills,deaths,suicides,
    team_kills,kills_per_min,deaths_per_min,team_kills_per_min,suicides_per_min
    ) VALUES ?`;

    await bulkInsert(query, insertVars);
}


async function bAnyWeaponTotalsData(){

    const query = `SELECT id FROM nstats_map_weapon_totals LIMIT 1`;

    const result = await simpleQuery(query);
    
    return result.length > 0;
}

export async function setAllMapTotals(){


    const mapIds = await getAllMapIds();
    

    for(let i = 0; i < mapIds.length; i++){

        const m = mapIds[i];

        const current = await getAllMapData(m);
        const uniqueGametypes = await getAllUniquePlayedGametypes(m);

        //all time map totals
        const {playtime: allTimePlaytime, matches: allTimeMatches} = await getTotalPlaytimeAndMatches(m, 0);
        const mapAllTimeData = await calcMapWeaponTotalsFromMatchTable(m, 0);
        setXPH(mapAllTimeData, allTimeMatches, allTimePlaytime, m, 0);

        await bulkInsertMapWeaponTotals(mapAllTimeData);

        for(let x = 0; x < uniqueGametypes.length; x++){

            const g = uniqueGametypes[x];

            const {playtime, matches} = await getTotalPlaytimeAndMatches(m,g);
            const mapGametypeData = await calcMapWeaponTotalsFromMatchTable(m, g);
            setXPH(mapGametypeData, matches, playtime, m, g);
            await bulkInsertMapWeaponTotals(mapGametypeData);
        }   
    }
}


async function deleteAllPlayerWeaponTotals(){

    return await simpleQuery(`DELETE FROM nstats_player_totals_weapons WHERE id>=0`);
}

export async function recalculateAllPlayerTotals(){

    const all = await calcPlayersTotalsFromMatchDataByGroup(null, "all");
    const gametypes = await calcPlayersTotalsFromMatchDataByGroup(null, "gametypes");
    const maps = await calcPlayersTotalsFromMatchDataByGroup(null, "maps");

    await deleteAllPlayerWeaponTotals();

    const promises = [
        bulkInsertPlayerTotalsNew(all, "all", true), 
        bulkInsertPlayerTotalsNew(gametypes, "gametypes", true), 
        bulkInsertPlayerTotalsNew(maps, "maps", true)
    ];

    return await Promise.all(promises);
}