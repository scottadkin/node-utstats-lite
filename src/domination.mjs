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

export async function insertMatchResult(matchId, realScores, fakeScores){

    const query = `INSERT INTO nstats_matches_dom VALUES(
    NULL,?,?,?,?,
    ?,?,?,?,
    ?,?,?,?,
    ?,?,?,?,
    ?,?,?,?,
    ?,?,?,?
    )`;

    const vars = [
        matchId, 
        realScores.totalScore, 
        fakeScores.totalScore,
        fakeScores.totalControlTime,
        realScores.teamScores[0],
        realScores.teamScores[1],
        realScores.teamScores[2],
        realScores.teamScores[3],
        fakeScores.teamScores[0],
        fakeScores.teamScores[1],
        fakeScores.teamScores[2],
        fakeScores.teamScores[3],
        fakeScores.teamControlTimes[0],
        fakeScores.teamControlTimes[1],
        fakeScores.teamControlTimes[2],
        fakeScores.teamControlTimes[3],
        fakeScores.teamControlPercent[0].toFixed(2),
        fakeScores.teamControlPercent[1].toFixed(2),
        fakeScores.teamControlPercent[2].toFixed(2),
        fakeScores.teamControlPercent[3].toFixed(2),
        fakeScores.teamCaps[0],
        fakeScores.teamCaps[1],
        fakeScores.teamCaps[2],
        fakeScores.teamCaps[3]
    ];


    return await simpleQuery(query, vars);
}

export async function insertPlayerMatchData(players, matchId, gametypeId, mapId){

    const query = `INSERT INTO nstats_match_dom (
    match_id,map_id,gametype_id,
    player_id,point_id,total_caps,
    total_control_time, longest_control_time,
    shortest_control_time,
    control_percent,
    control_point_score,
    max_control_point_score,
    total_score_time,
    max_total_score_time,
    stolen_points,
    stolen_caps
    ) VALUES ?`;

    const insertVars = [];

    for(let i = 0; i < players.length; i++){

        const player = players[i];

        for(const [pointId, capData] of Object.entries(player.stats.dom.controlPoints)){

            insertVars.push([
                matchId, mapId, gametypeId, 
                player.masterId, pointId, capData.caps,
                capData.totalControlTime, capData.longestTimeControlled, 
                capData.shortestTimeControlled, capData.controlPercent,
                capData.totalPointsEarned, capData.maxPointsEarned,
                capData.totalScoreTime, capData.maxScoreTime,
                capData.stolenPoints, capData.stolenCaps
            ]);
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

async function getMatchDetailedResult(matchId){

    const query = `SELECT * FROM nstats_matches_dom WHERE match_id=?`;

    const result = await simpleQuery(query, [matchId]);

    if(result.length === 0) return {};

    return result[0];
}

export async function getMatchData(matchId){

    const query = `SELECT 
    player_id,point_id,total_caps,total_control_time,
    longest_control_time,shortest_control_time,control_percent,
    control_point_score,max_control_point_score,total_score_time,
    stolen_points,stolen_caps
     FROM nstats_match_dom WHERE match_id=?`;

    const result = await simpleQuery(query, [matchId]);

    const pointIds = [...new Set(result.map((r) =>{
        return r.point_id;
    }))];

    const pointNames = await getControlPointNames(pointIds);

    const detailedResult = await getMatchDetailedResult(matchId);

    return {"data": result, "controlPoints": pointNames, detailedResult};
}


export async function changePlayerMatchIds(oldIds, newId){

    if(oldIds.length === 0) return {"changedRows": 0};

    const query = `UPDATE nstats_match_dom SET player_id=? WHERE player_id IN (?)`;

    return await simpleQuery(query, [newId, oldIds]);
}

export async function setMatchMapGametypeIds(data){

    const query = `UPDATE nstats_match_dom SET gametype_id=?, map_id=? WHERE match_id=?`;

    const queries = [];

    for(const [matchId, m] of Object.entries(data)){

        queries.push(simpleQuery(query, [m.gametype, m.map, matchId]));
    }

    await Promise.all(queries);
}

export async function getPlayerMapTotals(playerIds, mapId){

    if(playerIds.length === 0) return {};

    const query = `SELECT player_id, SUM(total_caps) as dom_caps
    FROM nstats_match_dom WHERE player_id IN (?) AND map_id=? GROUP BY player_id`;

    const result = await simpleQuery(query, [playerIds, mapId]);

    const data = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        data[r.player_id] = r;
    }

    return data;
}