import { bulkInsert, simpleQuery } from "./database.mjs";
import { getMatchesGametype, getMatchesPlaytime } from "./matches.mjs";
import { getAllMapIds, getTotalPlaytimeAndMatches } from "./maps.mjs";
import { readdir } from 'node:fs/promises';
import Message from "./message.mjs";


export async function getWeaponId(name){

    const query = `SELECT id FROM nstats_weapons WHERE name=?`;

    const result = await simpleQuery(query, [name]);

    if(result.length > 0) return result[0].id;

    return null;
}

export async function createWeapon(name){

    const query = `INSERT INTO nstats_weapons VALUES(NULL,?)`;

    const result = await simpleQuery(query, [name]);

    return result.insertId;
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

export async function getWeaponNames(ids){

    if(ids.length === 0) return {};

    const query = `SELECT id,name FROM nstats_weapons WHERE id IN(?)`;

    const result = await simpleQuery(query, [ids]);

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

    const names = await getWeaponNames(uniqueWeapons);

    const images = await getAllImages();

    const namesToImages = {};
    for(const [id, name] of Object.entries(names)){
    
        //console.log(bWeaponImageExist(images, name));
        namesToImages[name] = getWeaponImage(images, name);
    }
   
    return {"data": result, "names": names, "images": namesToImages}
}



async function getAllPlayerMatchData(playerIds){

    const query = `SELECT 
    gametype_id,
    player_id,
    weapon_id,
    COUNT(*) as total_matches,
    SUM(kills) as kills,
    SUM(deaths) as deaths,
    SUM(team_kills) as team_kills,
    SUM(suicides) as suicides
    FROM nstats_match_weapon_stats 
    WHERE player_id IN (?)
    GROUP BY player_id,gametype_id,weapon_id`;

    return await simpleQuery(query, [playerIds]);

}

function calcPlayerTotals(playerIds){

    
    //playerid => gametypeid => weaponStats
    const totals = {};

    console.log(data);


    return {"data": data, "matchIds": matchIds}
}


function _updatePlayerTotals(totals, data, gametypeId){


    const playerId = data.player_id;
    const weaponId = data.weapon_id;

    data.kills = parseInt(data.kills);
    data.deaths = parseInt(data.deaths);
    data.suicides = parseInt(data.suicides);
    data.team_kills = parseInt(data.team_kills);

    if(totals[playerId] === undefined){
        totals[playerId] = {};
    }

    if(totals[playerId][gametypeId] === undefined){
        
        totals[playerId][gametypeId] = {}; 
    }

    if(totals[playerId][gametypeId][weaponId] === undefined){

        let eff = 0;

        if(data.kills > 0){

            if(data.deaths > 0){
                eff = data.kills / (data.kills + data.deaths + data.team_kills) * 100;
            }else{
                eff = 100;
            }
        }


        totals[playerId][gametypeId][weaponId]  = {      
            "matches": data.total_matches,
            "kills": data.kills,
            "deaths": data.deaths,
            "team_kills": data.team_kills,
            "eff": eff,
            "suicides": data.suicides       
        };

        return;
    }

    const t = totals[playerId][gametypeId][weaponId];

    t.kills += data.kills;
    t.deaths += data.deaths;
    t.team_kills += data.team_kills;
    t.suicides += data.suicides;

    let eff = 0;

    if(t.kills > 0){

        if(t.deaths > 0){
            eff = t.kills / (t.kills + t.deaths + t.team_kills) * 100;
        }else{
            eff = 100;
        }
    }

    t.eff = eff;

    t.matches+=data.total_matches;
}

async function deleteMultiplePlayerTotals(playerIds){

    if(playerIds.length === 0) return;
    const query = `DELETE FROM nstats_player_totals_weapons WHERE player_id IN (?)`;

    return await simpleQuery(query, [playerIds]);
}

async function bulkInsertPlayerTotals(totals){

    const insertVars = [];

    const playerIds = new Set();

    for(const [playerId, playerData] of Object.entries(totals)){

        playerIds.add(playerId);

        for(const [gametypeId, gametypeData] of Object.entries(playerData)){

            for(const [weaponId, weaponData] of Object.entries(gametypeData)){

                insertVars.push([
                    playerId, gametypeId, weaponId,
                    weaponData.matches, weaponData.kills, weaponData.deaths,
                    weaponData.suicides, weaponData.team_kills, weaponData.eff
                ]);
            }
        }
    }

    await deleteMultiplePlayerTotals([...playerIds]);

    const query = `INSERT INTO nstats_player_totals_weapons (
        player_id, gametype_id, weapon_id,
        total_matches, kills, deaths, suicides, team_kills, eff
    ) VALUES ?`;

    await bulkInsert(query, insertVars);
}

export async function updatePlayerTotals(playerIds){

    if(playerIds.length === 0) return null;

    const data = await getAllPlayerMatchData(playerIds);

    const totals = {};

    for(let i = 0; i < data.length; i++){

        const d = data[i];

        //all time totals
        _updatePlayerTotals(totals, d, 0);
        //gametype specific 
        _updatePlayerTotals(totals, d, d.gametype_id);
    }

    await bulkInsertPlayerTotals(totals);

}

export async function getPlayerTotals(playerId){

    const query = `SELECT 
    nstats_player_totals_weapons.gametype_id,
    nstats_player_totals_weapons.weapon_id,
    nstats_player_totals_weapons.total_matches,
    nstats_player_totals_weapons.kills,
    nstats_player_totals_weapons.deaths,
    nstats_player_totals_weapons.team_kills,
    nstats_player_totals_weapons.eff,
    nstats_weapons.name as weapon_name
    FROM nstats_player_totals_weapons 
    LEFT JOIN nstats_weapons ON nstats_weapons.id = nstats_player_totals_weapons.weapon_id
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

async function bulkInsertMapWeaponTotals(mapId, playtime, totalMatches, totals){

    const query = `INSERT INTO nstats_map_weapon_totals
    (map_id, total_matches, total_playtime, weapon_id, kills, deaths, suicides, team_kills, kills_per_min, deaths_per_min, team_kills_per_min, suicides_per_min) 
    VALUES ?`;

    const insertVars = [];

    for(const [weaponId, d] of Object.entries(totals)){

        insertVars.push([
            mapId,
            totalMatches,
            playtime,
            weaponId,
            d.kills,
            d.deaths,
            d.suicides,
            d.teamKills,
            d.killsPMin,
            d.deathsPMin,
            d.teamKillsPMin,
            d.suicidesPMin
        ]);
    }

    await bulkInsert(query, insertVars);
}

export async function calcMapWeaponsTotals(mapId){

    const query = `SELECT weapon_id, SUM(kills) as kills, SUM(deaths) as deaths, SUM(team_kills) as team_kills, SUM(suicides) as suicides 
    FROM nstats_match_weapon_stats WHERE map_id=? GROUP BY weapon_id`;

    const result = await simpleQuery(query, [mapId]);

    const totals = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        totals[r.weapon_id] = {
            "kills": parseInt(r.kills),
            "deaths": parseInt(r.deaths),
            "teamKills": parseInt(r.team_kills),
            "suicides": parseInt(r.suicides),
            "killsPMin": 0,
            "deathsPMin": 0,
            "teamKillsPMin": 0,
            "suicidesPMin": 0
        };
    }

    const {playtime, matches} = await getTotalPlaytimeAndMatches(mapId);

    let minutes = 0;

    if(playtime > 0) minutes = playtime / 60;

    if(minutes > 0){

        for(const data of Object.values(totals)){

            if(data.kills > 0) data.killsPMin = data.kills / minutes;
            if(data.deaths > 0) data.deathsPMin = data.deaths / minutes;
            if(data.teamKills > 0) data.teamKillsPMin = data.teamKills / minutes;
            if(data.suicides > 0) data.suicidesPMin = data.suicides / minutes;
        }
    }

    await deleteMapWeaponTotals(mapId);
    await bulkInsertMapWeaponTotals(mapId, playtime, matches, totals);
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

export async function setAllMapTotals(){

    const mapIds = await getAllMapIds();

    const matchData = {};
    
    const matchIds = new Set();

    for(let i = 0; i < mapIds.length; i++){

        const m = mapIds[i];

        const current = await getAllMapData(m);

        matchData[m] = current;
        //get total playtime and matches

        for(let x = 0; x < current.length; x++){
            matchIds.add(current[x].match_id);
        }
        
    }

    const matchPlaytimes = await getMatchesPlaytime([...matchIds]);

    const mapTotals = {};
    // mapId => weaponId => weaponStats

    for(const [mapId, data] of Object.entries(matchData)){

        for(let i = 0; i < data.length; i++){

            const m = data[i];

            if(mapTotals[mapId] === undefined){
                mapTotals[mapId] = {};
            }

            if(mapTotals[mapId][m.weapon_id] === undefined){

                mapTotals[mapId][m.weapon_id] = {
                    "kills": 0,
                    "deaths": 0,
                    "teamKills": 0,
                    "suicides": 0,
                    "playtime": 0,
                    "matchIds": new Set()
                };
            }

            const playtime = matchPlaytimes[m.match_id] ?? 0;

            const t = mapTotals[mapId][m.weapon_id];

            t.kills += parseInt(m.kills);
            t.deaths += parseInt(m.deaths);
            t.teamKills += parseInt(m.team_kills);
            t.suicides += parseInt(m.suicides);
            t.playtime += playtime;
            t.matchIds.add(m.match_id);

        }
        //console.log(data);
        //console.log(playtime);
    }

    //console.log(matchData);
    //get all match weapon data for each map
    //insert new totals for maps


    await deleteAllMapTotals();
    await bulkInsertMapTotals(mapTotals);
}