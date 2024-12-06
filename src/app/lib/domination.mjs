import { simpleQuery, bulkInsert } from "./database.mjs";

export async function getPointsIds(names){

    if(names.length === 0) return null;

    const query = `SELECT id,name FROM nstats_dom_control_points WHERE name IN (?)`;

    const result = await simpleQuery(query, [names]);

    const namesToIds = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];
        namesToIds[r.name] = r.id;
    }

    return namesToIds;
}

export async function createControlPoint(name){

    const query = `INSERT INTO nstats_dom_control_points VALUES(NULL,?)`;

    const result = await simpleQuery(query, [name]);

    return result.insertId;
}


export async function insertPlayerMatchData(players, matchId, gametypeId, mapId){

    const query = `INSERT INTO nstats_match_dom (match_id,map_id,gametype_id,player_id,point_id,total_caps) VALUES ?`;

    const insertVars = [];

    for(const player of Object.values(players)){

        for(const [pointId, pointCaps] of Object.entries(player.stats.dom.controlPoints)){

            insertVars.push([matchId, mapId, gametypeId, player.masterId, pointId, pointCaps]);
        }
    }

    await bulkInsert(query, insertVars);
}

async function getControlPointNames(ids){

    if(ids.length === 0) return {};

    const query = `SELECT id,name FROM nstats_dom_control_points WHERE id IN(?)`;

    const result = await simpleQuery(query, [ids]);

    const data = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];
        data[r.id] = r.name;
    }

    return data;
}

export async function getMatchData(matchId){

    const query = `SELECT player_id,point_id,total_caps FROM nstats_match_dom WHERE match_id=?`;

    const result = await simpleQuery(query, [matchId]);

    const pointIds = [...new Set(result.map((r) =>{
        return r.point_id;
    }))];

    const pointNames = await getControlPointNames(pointIds);

    return {"data": result, "controlPoints": pointNames};
}


export async function changePlayerMatchIds(oldIds, newId){

    if(oldIds.length === 0) return {"changedRows": 0};

    const query = `UPDATE nstats_match_dom SET player_id=? WHERE player_id IN (?)`;

    return await simpleQuery(query, [newId, oldIds]);
}