import { bulkInsert, simpleQuery } from "./database.mjs";
import { getMatchesGametype } from "./matches.mjs";
import { readdir } from 'node:fs/promises';


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
                weaponStats.deaths, weaponStats.teamKills
            ]);
        }
    }

    const query = `INSERT INTO nstats_match_weapon_stats (match_id,map_id,gametype_id,player_id,weapon_id,kills,deaths,team_kills) VALUES ?`;

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

    const query = `SELECT player_id,weapon_id,kills,deaths,team_kills FROM nstats_match_weapon_stats WHERE match_id=?`;
    const result = await simpleQuery(query, [matchId]);

    const uniqueWeapons = [...new Set(result.map((r) =>{
        return r.weapon_id;
    }))];

    const names = await getWeaponNames(uniqueWeapons);

    return {"data": result, "names": names}
}



async function _getAllPlayerMatchData(playerIds){

    const query = `SELECT match_id,player_id,weapon_id,kills,deaths,team_kills FROM nstats_match_weapon_stats WHERE player_id IN (?)`;

    const result = await simpleQuery(query, [playerIds]);

    const matchIds = [...new Set(result.map((r) =>{
        return r.match_id;
    }))];


    return {"data": result, "matchIds": matchIds}

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
            "matches": 1,
            "kills": data.kills,
            "deaths": data.deaths,
            "team_kills": data.team_kills,
            "eff": eff       
        };

        return;
    }

    const t = totals[playerId][gametypeId][weaponId];

    t.kills += data.kills;
    t.deaths += data.deaths;
    t.team_kills += data.team_kills;

    let eff = 0;

    if(t.kills > 0){

        if(t.deaths > 0){
            eff = t.kills / (t.kills + t.deaths + t.team_kills) * 100;
        }else{
            eff = 100;
        }
    }

    t.eff = eff;

    t.matches++;
}

/*async function deletePlayerTotals(playerId, gametypeId, weaponId){

    const query = `DELETE FROM nstats_player_totals_weapons WHERE player_id=? AND gametype_id=? AND weapon_id=?`;

    return await simpleQuery(query, [playerId, gametypeId, weaponId]);
}*/

async function deletePlayerTotals(playerId, gametypeIds, weaponIds){

    if(gametypeIds.length === 0 || weaponIds.length === 0) return;

    const query = `DELETE FROM nstats_player_totals_weapons WHERE player_id=? AND gametype_id IN (?) AND weapon_id IN (?)`;

    return await simpleQuery(query, [playerId, gametypeIds, weaponIds]);
}

async function bulkInsertPlayerTotals(totals){

    const insertVars = [];

    for(const [playerId, playerData] of Object.entries(totals)){

        const gametypeIdsToDelete = [];
        const weaponIdsToDelete = [];

        for(const [gametypeId, gametypeData] of Object.entries(playerData)){

            gametypeIdsToDelete.push(gametypeId);

            for(const [weaponId, weaponData] of Object.entries(gametypeData)){

                weaponIdsToDelete.push(weaponId);

                //await deletePlayerTotals(playerId, gametypeId, weaponId);

                insertVars.push([
                    playerId, gametypeId, weaponId,
                    weaponData.matches, weaponData.kills, weaponData.deaths,
                    weaponData.team_kills, weaponData.eff
                ]);
            }
        }

        await deletePlayerTotals(playerId, gametypeIdsToDelete, weaponIdsToDelete);
    }

    const query = `INSERT INTO nstats_player_totals_weapons (
        player_id, gametype_id, weapon_id,
        total_matches, kills, deaths, team_kills, eff
    ) VALUES ?`;

    await bulkInsert(query, insertVars);
   //console.log(insertVars);
   //console.log(insertVars.length);
}

export async function updatePlayerTotals(playerIds){

    if(playerIds.length === 0) return null;

    const {data, matchIds} = await _getAllPlayerMatchData(playerIds);

    const matchGametypeIds = await getMatchesGametype(matchIds);
    //console.log(matchIds);

    //const gametypeIds = [...new Set(Object.values(matchGametypeIds))];
    //const gametypeNames = await getGametypeNames(gametypeIds);

    //console.log(matchGametypeIds);
    const totals = {};

    for(let i = 0; i < data.length; i++){

        const d = data[i];

        const gametypeId = matchGametypeIds[d.match_id];

        //all time totals
        _updatePlayerTotals(totals, d, 0);
        //gametype specific 
        _updatePlayerTotals(totals, d, gametypeId);
    }

   // console.log(totals);


    await bulkInsertPlayerTotals(totals);

}

export async function getPlayerTotals(playerId){

    const query = `SELECT gametype_id,weapon_id,total_matches,kills,deaths,team_kills,eff FROM nstats_player_totals_weapons WHERE player_id=?`;

    return await simpleQuery(query, [playerId]);
}


export async function changePlayerMatchIds(oldIds, newId){

    if(oldIds.length === 0) return {"changedRows": 0};

    const query = `UPDATE nstats_match_weapon_stats SET player_id=? WHERE player_id IN (?)`;

    return await simpleQuery(query, [newId, oldIds]);
}


export function bWeaponImageExist(images, name){

    if(Object.keys(images).length === 0) return false;

    name = name.toLowerCase();

    for(const [key, value] of Object.entries(images)){

        if(key === name) return true;
    }

    return false;

}

export async function getAllImages(){

    try {

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

    } catch (err) {
        console.error(err);
    } 
}