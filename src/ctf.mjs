import { simpleQuery, bulkInsert, mysqlGetColumnsAsArray } from "./database.mjs";
import { getTeamName, toMatchResultString } from "./generic.mjs";
import { getMatchBasicTeamGame, getMatchesGametype, getMatchStartTimestamp } from "./matches.mjs";
import { toJSONAPIKeyNames } from "./json.mjs";
import Message from "./message.mjs";
import { getPlayersById } from "./players.mjs";


export async function insertPlayerMatchData(players, matchId, gametypeId, mapId){

    const query = `INSERT INTO nstats_match_ctf (
    match_id,map_id,gametype_id,player_id,flag_taken,flag_pickup,flag_drop,
    flag_assist,flag_cover,flag_seal,flag_cap,flag_kill,
    flag_return,flag_return_base,flag_return_mid,
    flag_return_enemy_base,flag_return_save,flag_carry_time,flag_carry_time_min,flag_carry_time_max) VALUES ?`;

    const insertVars = [];

    for(let i = 0; i < players.length; i++){
        
        const p = players[i];
        if(p.playtime === 0) continue;
        const s = p.stats.ctf;

        insertVars.push([
            matchId, mapId, gametypeId, p.masterId, s.taken, s.pickedup, s.dropped,
            s.assist, s.cover, s.seal, s.capture, s.kill,
            s.return, s.returnBase, s.returnMid, s.returnEnemyBase,
            s.returnSave, s.flagCarryTime.total, s.flagCarryTime.min, s.flagCarryTime.max 
        ]);
    }

    await bulkInsert(query, insertVars);
}

/**
 * 
 * @param {*} playerStats mysql row from nstats_match_ctf
 */
function setAverageCarryTime(playerStats){

    playerStats.flag_carry_time_avg = 0;

    playerStats.times_held = playerStats.flag_pickup + playerStats.flag_taken;

    if(playerStats.times_held > 0 && playerStats.flag_carry_time > 0){
        playerStats.flag_carry_time_avg = playerStats.flag_carry_time / playerStats.times_held;
    }

}

export async function getMatchData(matchId, bReturnJSON){

    const query = `SELECT player_id,flag_taken,flag_pickup,flag_drop,flag_assist,flag_cover,
    flag_seal,flag_cap,flag_kill,flag_return,flag_return_base,flag_return_mid,flag_return_enemy_base,
    flag_return_save,flag_carry_time,flag_carry_time_min,flag_carry_time_max
    FROM nstats_match_ctf WHERE match_id=?`;

    const result = await simpleQuery(query, [matchId]);

    for(let i = 0; i < result.length; i++){

        const r = result[i];
        setAverageCarryTime(r);
    }


    const caps = await getMatchCaps(matchId);

    if(!bReturnJSON){
        return {"playerData": result, "caps": caps};
    }

    const obj = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        obj[r.player_id] = {...r};
        delete obj[r.player_id].player_id;
    }

    return obj;
}

function _updatePlayerTotals(totals, gametypeId, mapId, matchData){

    const playerId = matchData.player_id;

    if(totals[playerId] === undefined) totals[playerId] = {};

    if(totals[playerId][gametypeId] === undefined){
        totals[playerId][gametypeId] = {};
    }
    

    const keys = [
        "flag_taken", "flag_pickup", "flag_drop", "flag_assist",
        "flag_cover", "flag_seal", "flag_cap", "flag_kill",
        "flag_return", "flag_return_base", "flag_return_mid",
        "flag_return_enemy_base", "flag_return_save"
    ];

    if(totals[playerId][gametypeId][mapId] === undefined){

        const current = {
            "matches": matchData.total_matches
        };

        for(let i = 0; i < keys.length; i++){

            const k = keys[i];

            current[k] = parseInt(matchData[k]);
            current[`max_${k}`] = parseInt(matchData[`max_${k}`]);
        }

        totals[playerId][gametypeId][mapId] = current;

        return;
    }

    const t = totals[playerId][gametypeId][mapId];

    t.matches += matchData.total_matches;

    for(let i = 0; i < keys.length; i++){

        const k = keys[i];
        const mk = `max_${k}`;

        t[k] += parseInt(matchData[k]);

        if(matchData[mk] > t[mk]){
            t[mk] = matchData[mk];
        }
    }
}

async function getPlayersMatchesData(playerIds){

    const query = `SELECT map_id,gametype_id,player_id,
    COUNT(*) as total_matches,
    SUM(flag_taken) as flag_taken,
    MAX(flag_taken) as max_flag_taken,
    SUM(flag_pickup) as flag_pickup,
    MAX(flag_pickup) as max_flag_pickup,
    SUM(flag_drop) as flag_drop,
    MAX(flag_drop) as max_flag_drop,
    SUM(flag_assist) as flag_assist,
    MAX(flag_assist) as max_flag_assist,
    SUM(flag_cover) as flag_cover,
    MAX(flag_cover) as max_flag_cover,
    SUM(flag_seal) as flag_seal,
    MAX(flag_seal) as max_flag_seal,
    SUM(flag_cap) as flag_cap,
    MAX(flag_cap) as max_flag_cap,
    SUM(flag_kill) as flag_kill,
    MAX(flag_kill) as max_flag_kill,
    SUM(flag_return) as flag_return,
    MAX(flag_return) as max_flag_return,
    SUM(flag_return_base) as flag_return_base,
    MAX(flag_return_base) as max_flag_return_base,
    SUM(flag_return_mid) as flag_return_mid,
    MAX(flag_return_mid) as max_flag_return_mid,
    SUM(flag_return_enemy_base) as flag_return_enemy_base,
    MAX(flag_return_enemy_base) as max_flag_return_enemy_base,
    SUM(flag_return_save) as flag_return_save,
    MAX(flag_return_save) as max_flag_return_save
    FROM nstats_match_ctf WHERE player_id IN (?)
    GROUP BY player_id,gametype_id,map_id`;

    return await simpleQuery(query, [playerIds]);
}

async function calcPlayerTotals(playerIds){
  
    const result = await getPlayersMatchesData(playerIds);

    const totals = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        //all time totals
        _updatePlayerTotals(totals, 0, 0, r);

        //gametype totals
        _updatePlayerTotals(totals, r.gametype_id, 0, r);

        //map totals
        _updatePlayerTotals(totals, 0, r.map_id, r);

        //map gametype totals
        _updatePlayerTotals(totals, r.gametype_id, r.map_id, r);
    }

    return totals;
}


async function deleteMultiplePlayerTotals(playerIds){

    if(playerIds.length === 0) return;

    const query = `DELETE FROM nstats_player_totals_ctf WHERE player_id IN (?)`;

    return await simpleQuery(query, [playerIds]);
}


async function insertPlayerTotals(insertVars){

    const query = `INSERT INTO nstats_player_totals_ctf (
        player_id, gametype_id, map_id, total_matches, flag_taken,
        max_flag_taken, flag_pickup, max_flag_pickup, flag_drop,
        max_flag_drop, flag_assist, max_flag_assist, flag_cover,
        max_flag_cover, flag_seal, max_flag_seal, flag_cap, max_flag_cap,
        flag_kill, max_flag_kill, flag_return, max_flag_return,
        flag_return_base, max_flag_return_base, flag_return_mid,
        max_flag_return_mid, flag_return_enemy_base, max_flag_return_enemy_base,
        flag_return_save, max_flag_return_save
    ) VALUES ?`;

    await bulkInsert(query, insertVars);
}

export async function updatePlayerTotals(playerIds){

    if(playerIds.length === 0) return;

    const data = await calcPlayerTotals(playerIds);

    const insertVars = [];

    for(const [playerId, gametypes] of Object.entries(data)){

        for(const [gametypeId, maps] of Object.entries(gametypes)){

            for(const [mapId, d] of Object.entries(maps)){

                insertVars.push([
                    playerId, gametypeId, mapId, d.matches,
                    d.flag_taken, d.max_flag_taken,
                    d.flag_pickup, d.max_flag_pickup,
                    d.flag_drop, d.max_flag_drop,
                    d.flag_assist, d.max_flag_assist,
                    d.flag_cover, d.max_flag_cover,
                    d.flag_seal, d.max_flag_seal,
                    d.flag_cap, d.max_flag_cap,
                    d.flag_kill, d.max_flag_kill,
                    d.flag_return, d.max_flag_return,
                    d.flag_return_base, d.max_flag_return_base,
                    d.flag_return_mid, d.max_flag_return_mid,
                    d.flag_return_enemy_base, d.max_flag_return_enemy_base,
                    d.flag_return_save, d.max_flag_return_save
                ]);
            }
        }
    }
    await deleteMultiplePlayerTotals(playerIds);
    await insertPlayerTotals(insertVars);
    
}

export async function getPlayerCTFTotals(playerId){

    const query = `SELECT * FROM nstats_player_totals_ctf WHERE player_id=?`;

    return await simpleQuery(query, [playerId]);
}

async function changeCapPlayerIds(oldIds, newId){

    const queries = [
        `UPDATE nstats_ctf_caps SET 
        taken_player = IF(taken_player IN (?), ?, taken_player),
        cap_player = IF(cap_player IN (?), ?, cap_player)`,

        `UPDATE nstats_ctf_cap_kills SET
        killer_id = IF(killer_id IN (?), ?, killer_id)`,

        `UPDATE nstats_ctf_cap_suicides SET
        player_id = IF(player_id IN (?), ?, player_id)`,

        `UPDATE nstats_ctf_carry_times SET
        player_id = IF(player_id IN (?), ?, player_id)`,

        `UPDATE nstats_ctf_covers SET
        player_id = IF(player_id IN (?), ?, player_id)`
    ];

    const vars = [
        [oldIds, newId, oldIds, newId],
        [oldIds, newId],
        [oldIds, newId],
        [oldIds, newId],
        [oldIds, newId]
    ];

 
    for(let i = 0; i < queries.length; i++){

        const q = queries[i];

        const v = vars[i];

        await simpleQuery(q, v);
    }
}

export async function changePlayerIds(oldIds, newId){

    if(oldIds.length === 0) return {"changedRows": 0};

    await changeCapPlayerIds(oldIds, newId);

    const query = `UPDATE nstats_match_ctf SET
    player_id = IF(player_id IN (?), ?, player_id)`;

    return await simpleQuery(query, [oldIds, newId]);
}

async function insertCovers(playerManager, matchId, capId, covers){


    const insertVars = [];

    for(let i = 0; i < covers.length; i++){

        const c = covers[i];

        const playerId = playerManager.getPlayerById(c.playerId)?.masterId ?? -1;

        insertVars.push([matchId, capId, c.timestamp, playerId]);
    }

    const query = `INSERT INTO nstats_ctf_covers (match_id, cap_id, timestamp, player_id) VALUES ?`;

    await bulkInsert(query, insertVars);
}

async function insertCarryTimes(playerManager, matchId, mapId, gametypeId, capId, carriers){

    const insertVars = [];

    for(let i = 0; i < carriers.length; i++){

        const c = carriers[i];

        const player = playerManager.getPlayerById(c.playerId);
      
        insertVars.push([
            matchId, mapId, gametypeId, capId, player?.masterId ?? -1, c.timestamp, c.endTimestamp, c.carryTime
        ]);
    }

    const query = `INSERT INTO nstats_ctf_carry_times (match_id, map_id, gametype_id, cap_id, player_id, start_timestamp, end_timestamp, carry_time) VALUES ?`;

    await bulkInsert(query, insertVars);

}


function setCapTeamTotalKills(playerManager, cap){

    const kills = {"red": 0, "blue": 0, "green": 0, "yellow": 0};

    for(let i = 0; i < cap.kills.length; i++){

        const k = cap.kills[i];

        switch(k.killerTeam){
            case 0: {   kills.red++; } break;
            case 1: {   kills.blue++; } break;
            case 2: {   kills.green++; } break;
            case 3: {   kills.yellow++; } break;
            default: { new Message(`setCapTeamKills Unknown team ${k.killerTeam}`,"warning")} break;
        }
    }

    return kills;
}


function setCapTeamTotalSuicides(cap){

    const suicides = {"red": 0, "blue": 0, "green": 0, "yellow": 0};

    for(let i = 0; i < cap.suicides.length; i++){

        const k = cap.suicides[i];

        switch(k.playerTeam){
            case 0: {   suicides.red++; } break;
            case 1: {   suicides.blue++; } break;
            case 2: {   suicides.green++; } break;
            case 3: {   suicides.yellow++; } break;
            default: { new Message(`setCapTeamSuicides Unknown team`,"warning")} break;
        }
    }

    return suicides;
}

async function insertCapKills(matchId, capId, cap){

    const insertVars = [];

    const query = `INSERT INTO nstats_ctf_cap_kills (match_id, cap_id, timestamp, killer_id, killer_team) VALUES ?`;

    for(let i = 0; i < cap.kills.length; i++){

        const c = cap.kills[i];

        insertVars.push([matchId, capId, c.timestamp, c.killer, c.killerTeam]);
    }

    await bulkInsert(query, insertVars);

}

async function insertCapSuicides(matchId, capId, cap){

    const insertVars = [];

    const query = `INSERT INTO nstats_ctf_cap_suicides (match_id, cap_id, timestamp, player_id, player_team) VALUES ?`;

    for(let i = 0; i < cap.suicides.length; i++){

        const c = cap.suicides[i];

        insertVars.push([matchId, capId, c.timestamp, c.player, c.playerTeam]);
    }

    await bulkInsert(query, insertVars);

}

async function insertCap(playerManager, matchId, mapId, gametypeId, cap){

    const c = cap;

    const takenPlayer = playerManager.getPlayerById(c.takenBy)?.masterId ?? -1;
    const capPlayer = playerManager.getPlayerById(c.playerId)?.masterId ?? -1;

    const query = `INSERT INTO nstats_ctf_caps VALUES(NULL,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

    const kills = setCapTeamTotalKills(playerManager, cap);

    const suicides = setCapTeamTotalSuicides(cap);

   // const suicides = {"red": 0, "blue": 0, "green": 0, "yellow": 0};

    const vars = [
        matchId, mapId, gametypeId, 
        Number(c.uniqueCarriers === 1), 
        c.flagTeam, c.cappingTeam,
        c.takenTimestamp, 
        takenPlayer,
        c.timestamp,
        capPlayer,
        c.totalTime,
        c.carryTime,
        c.dropTime,
        c.drops.length,
        c.covers.length,
        c.uniqueCarriers,
        kills.red,
        kills.blue,
        kills.green,
        kills.yellow,
        suicides.red,
        suicides.blue,
        suicides.green,
        suicides.yellow
    ];

    try{

        const result = await simpleQuery(query, vars);

        const capId = result.insertId;

        if(capId === undefined) throw new Error("cap id is null");

        await insertCovers(playerManager, matchId, capId, c.covers);
        await insertCarryTimes(playerManager, matchId, mapId, gametypeId, capId, cap.carriers);
        await insertCapKills(matchId, capId, cap);
        await insertCapSuicides(matchId, capId, cap);

    }catch(err){

        new Message(`Failed to insert cap! ${err.toString()}`,`error`);

    
    }
}

export async function insertCaps(playerManager, matchId, mapId, gametypeId, caps){

    caps.sort((a, b) =>{
        a = a.timestamp;
        b = b.timestamp;

        if(a < b) return -1;
        if(a > b) return 1;
        return 0;
    });


    /*const query = `INSERT INTO nstats_ctf_caps (match_id,map_id,gametype_id,cap_type,flag_team,
    capping_team,taken_timestamp,taken_player,cap_timestamp,cap_player, cap_time, carry_time, drop_time,
    total_drops, total_covers, unique_carriers) 
    VALUES ?`;

    const insertVars = [];*/

    for(let i = 0; i < caps.length; i++){

        const c = caps[i];

        await insertCap(playerManager, matchId, mapId, gametypeId, c);
    }

    //await bulkInsert(query, insertVars);
}

/**
 * 
 * @param {Number} matchId 
 * @returns {Promise<Object>} keys are capIds, subKeys are playerIds, values are timestamps
 */
async function getMatchCovers(matchId){

    const query = `SELECT * FROM nstats_ctf_covers WHERE match_id=? ORDER by timestamp ASC`;
    
    const result = await simpleQuery(query, [matchId]);

    const data = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        if(data[r.cap_id] === undefined){
            data[r.cap_id] = {};
        }

        if(data[r.cap_id][r.player_id] === undefined){
            data[r.cap_id][r.player_id] = [];
        }

        data[r.cap_id][r.player_id].push(r.timestamp);
    }

    return data;
}

async function getMatchCarryTimes(matchId){

    const query = `SELECT cap_id,player_id,start_timestamp,end_timestamp,carry_time FROM nstats_ctf_carry_times WHERE match_id=? ORDER BY start_timestamp ASC`;

    const result = await simpleQuery(query, [matchId]);

    const data = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        if(data[r.cap_id] === undefined) data[r.cap_id] = [];

        data[r.cap_id].push({
            "player_id": r.player_id,
            "start_timestamp": r.start_timestamp,
            "end_timestamp": r.end_timestamp,
            "carry_time": r.carry_time
        });
    }

    return data;
}

async function getMatchCapKills(matchId){

    const query = `SELECT cap_id,timestamp,killer_id,killer_team FROM nstats_ctf_cap_kills WHERE match_id=?`;

    const result = await simpleQuery(query, [matchId]);

    const data = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        if(data[r.cap_id] === undefined) data[r.cap_id] = [];

        data[r.cap_id].push({
            "timestamp": r.timestamp,
            "killerId": r.killer_id,
            "killerTeam": r.killer_team
        });
    }

    return data;
}

async function getMatchCapSuicides(matchId){

    const query = `SELECT timestamp,cap_id,player_id,player_team FROM nstats_ctf_cap_suicides WHERE match_id=? ORDER BY timestamp ASC`;

    const result = await simpleQuery(query, [matchId]);

    const data = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        if(data[r.cap_id] === undefined) data[r.cap_id] = [];

        data[r.cap_id].push({
            "timestamp": r.timestamp,
            "playerId": r.player_id,
            "playerTeam": r.player_team
        });
    }

    return data;

}

export async function getMatchCaps(matchId){

    const query = `SELECT * FROM nstats_ctf_caps WHERE match_id=? ORDER BY cap_timestamp ASC`;

    const result = await simpleQuery(query, [matchId]);

    const covers = await getMatchCovers(matchId);
    const carryTimes = await getMatchCarryTimes(matchId);
    const kills = await getMatchCapKills(matchId);
    const suicides = await getMatchCapSuicides(matchId);

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        r.covers = covers?.[r.id] ?? [];
        r.carryTimes = carryTimes?.[r.id] ?? [];
        r.kills = kills?.[r.id] ?? [];
        r.suicides = suicides?.[r.id] ?? [];

    }

    return result;
}


export async function setMatchMapGametypeIds(data){

    const query = `UPDATE nstats_match_ctf SET gametype_id=?, map_id=? WHERE match_id=?`;

    const queries = [];

    for(const [matchId, m] of Object.entries(data)){

        queries.push(simpleQuery(query, [m.gametype, m.map, matchId]));
    }

    await Promise.all(queries);
}


export async function getPlayerMapTotals(playerIds, mapId){

    if(playerIds.length === 0) return {};

    const query = `SELECT player_id, SUM(flag_taken) as flag_taken, SUM(flag_pickup) as flag_pickup, 
    SUM(flag_drop) as flag_drop, SUM(flag_assist) as flag_assist, SUM(flag_cover) as flag_cover,
    SUM(flag_seal) as flag_seal, SUM(flag_cap) as flag_cap, SUM(flag_kill) as flag_kill, 
    SUM(flag_return) as flag_return, SUM(flag_return_base) as flag_return_base, 
    SUM(flag_return_mid) as flag_return_mid, SUM(flag_return_enemy_base) as flag_return_enemy_base, 
    SUM(flag_return_save) as flag_return_save 
    FROM nstats_match_ctf WHERE player_id IN (?) AND map_id=? GROUP BY player_id`;

    const result = await simpleQuery(query, [playerIds, mapId]);


    const data = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        data[r.player_id] = r;
    }

    return data;
}

async function deleteAllTotals(){


    const query = `DELETE FROM nstats_player_totals_ctf`;

    return await simpleQuery(query);
}

async function getTotalsFromMatchData(){

    const query = `SELECT
    player_id,gametype_id,
    COUNT(*) as total_matches,
    SUM(flag_taken) as flag_taken,
    SUM(flag_pickup) as flag_pickup,
    SUM(flag_drop) as flag_drop,
    SUM(flag_assist) as flag_assist,
    SUM(flag_cover) as flag_cover,
    SUM(flag_seal) as flag_seal,
    SUM(flag_cap) as flag_cap,
    SUM(flag_kill) as flag_kill,
    SUM(flag_return) as flag_return,
    SUM(flag_return_base) as flag_return_base,
    SUM(flag_return_mid) as flag_return_mid,
    SUM(flag_return_enemy_base) as flag_return_enemy_base,
    SUM(flag_return_save) as flag_return_save
    FROM nstats_match_ctf
    GROUP BY player_id,gametype_id,map_id`;

    const result = await simpleQuery(query);

    await deleteAllTotals();

    const allTimeTotals = {};

    const insertVars = [];

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        if(allTimeTotals[r.player_id] === undefined){
            allTimeTotals[r.player_id] = r;
        }else{

            const a = allTimeTotals[r.player_id];
            a.total_matches += r.total_matches;
            a.flag_taken += r.flag_taken;
            a.flag_pickup += r.flag_pickup;
            a.flag_drop += r.flag_drop;
            a.flag_assist += r.flag_assist;
            a.flag_cover += r.flag_cover;
            a.flag_seal += r.flag_seal;
            a.flag_cap += r.flag_cap;
            a.flag_kill += r.flag_kill;
            a.flag_return += r.flag_return;
            a.flag_return_base += r.flag_return_base;
            a.flag_return_mid += r.flag_return_mid;
            a.flag_return_enemy_base += r.flag_return_enemy_base;
            a.flag_return_save += r.flag_return_save
        }


        insertVars.push([
            r.player_id, r.gametype_id, 0, r.total_matches, r.flag_taken, r.flag_pickup,
            r.flag_drop, r.flag_assist, r.flag_cover, r.flag_seal, r.flag_cap, r.flag_kill,
            r.flag_return, r.flag_return_base, r.flag_return_mid, r.flag_return_enemy_base,
            r.flag_return_save
        ]);
    }


    for(const [playerId, d] of Object.entries(allTimeTotals)){

        insertVars.push([
            playerId, 0, 0, d.total_matches, d.flag_taken, d.flag_pickup,
            d.flag_drop, d.flag_assist, d.flag_cover, d.flag_seal, d.flag_cap, d.flag_kill,
            d.flag_return, d.flag_return_base, d.flag_return_mid, d.flag_return_enemy_base,
            d.flag_return_save
        ]);
    }

    const insertQuery = `INSERT INTO nstats_player_totals_ctf (
    player_id, gametype_id, map_id, total_matches, flag_taken, flag_pickup,
    flag_drop, flag_assist, flag_cover, flag_seal, flag_cap, flag_kill,
    flag_return, flag_return_base, flag_return_mid, flag_return_enemy_base,
    flag_return_save
    ) VALUES ?`;

    await bulkInsert(insertQuery, insertVars);

}

async function recalculateTotals(playerIds){

    await updatePlayerTotals(playerIds);
    //const gametypeTotals = await getTotalsFromMatchData();
}

async function getPlayerIdsInMatch(matchId){

    const query = `SELECT DISTINCT player_id FROM nstats_match_ctf WHERE match_id=?`;
    const result = await simpleQuery(query, [matchId]);

    return result.map((r) =>{
        return r.player_id;
    });
}

export async function deleteMatch(matchId){

    const deleteFromTables = [
        "nstats_ctf_caps","nstats_ctf_cap_kills","nstats_ctf_cap_suicides",
        "nstats_ctf_carry_times","nstats_ctf_covers", "nstats_match_ctf"
    ];

    const playerIds = await getPlayerIdsInMatch(matchId);

    let rowsAffected = 0;

    for(let i = 0; i < deleteFromTables.length; i++){

        const t = deleteFromTables[i];

        const result = await simpleQuery(`DELETE FROM ${t} WHERE match_id=?`, [matchId]);

        if(result.affectedRows !== undefined){
            rowsAffected += result.affectedRows;
        }
    }

    await recalculateTotals(playerIds);

    return rowsAffected;
}



export async function getMatchesTeamResults(matchIds){

    if(matchIds.length === 0) return {};

    const query = `SELECT id,date,playtime,team_0_score,team_1_score FROM nstats_matches WHERE id IN(?)`;

    const result = await simpleQuery(query, [matchIds]);

    const data = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        const redScore = r.team_0_score;
        const blueScore = r.team_1_score

        //draw
        let winner = -1;

        if(redScore > blueScore) winner = 0;
        if(redScore < blueScore) winner = 1;

        data[r.id] = {
            "red": redScore,
            "blue": blueScore,
            "winner": winner,
            "date": r.date,
            "playtime": r.playtime
        };

    }
    return data;
}

export async function getCTFGametypes(){

    const query = `SELECT DISTINCT gametype_id FROM nstats_match_ctf`;

    const result = await simpleQuery(query);

    return result.map((r) => r.gametype_id);
}

function createTeamTotalsMatchCTFJSON(players, teamCapIds){

    const teams = {};

    const ignore = ["totalPlayers", "capIds", "assistIds"];

    for(let i = 0; i < players.length; i++){

        const p = players[i];

        const teamName = p.team.toLowerCase();

        if(teams[teamName] === undefined){

            teams[teamName] = {...p};
            teams[teamName].totalPlayers = 1;
            teams[teamName].capIds = teamCapIds[teamName];

            delete teams[teamName].name;
            delete teams[teamName].id;
            delete teams[teamName].country;
            delete teams[teamName].team;
            delete teams[teamName].assistIds;
            continue;
        }

        const team = teams[teamName];

        team.totalPlayers++;

        for(const key of Object.keys(team)){

            if(ignore.indexOf(key) !== -1) continue;

            if(key === "returnTypes"){

                for(const rKey of Object.keys(team[key])){
                    team[key][rKey] += p[key][rKey];
                }

                continue;

            }else if(key === "flagCarryTime"){

                for(const fKey of Object.keys(team[key])){

                    const playerValue = p[key][fKey];
                    const teamValue = team[key][fKey];
                    const teamPlayerCount = team.totalPlayers;

                    if(fKey === "total"){

                        team[key][fKey] += playerValue;

                        if(team[key][fKey] > 0){

                            team[key].average = team[key][fKey] / teamPlayerCount;
                        }

                    }else if(fKey === "min"){

                        if(teamValue > playerValue && playerValue >= 0){
                            team[key][fKey] = playerValue;
                        }

                    }else if(fKey === "max"){

                        if(teamValue < playerValue){
                            team[key][fKey] = playerValue;
                        }
                    }
                }

                continue;
            }
            //anything else
            team[key] += p[key];
        }
    }

    return teams;
}

async function getCapAssistPlayers(matchId){

    const query = `SELECT cap_id,player_id,carry_time FROM nstats_ctf_carry_times WHERE match_id=? ORDER BY cap_id ASC, start_timestamp ASC`;

    const  result = await simpleQuery(query, [matchId]);

    console.log(result);
}

/**
 * 
 * @param {Array<Object>} carryTimes 
 * @param {*} ignorePlayer player to ignore from list normally the player that capped the flag
 * @returns 
 */
function getAssistPlayersFromCarryTimes(carryTimes, ignorePlayer){

    const assists = new Set();

    for(let i = 0; i < carryTimes.length; i++){

        if(carryTimes[i].player_id === ignorePlayer) continue;

        assists.add(carryTimes[i].player_id);
    }

    return [...assists];
}



/**
 * 
 * @param {number} id 
 * @param {object} players id: name 
 * @returns 
 */
async function getMatchCTFCapsJSON(id, players){

    const query = `SELECT id,cap_type,flag_team,
    taken_timestamp,cap_timestamp,taken_player,cap_player,cap_time,carry_time,capping_team,
    drop_time,total_drops,total_covers,unique_carriers,red_kills,
    blue_kills,green_kills,yellow_kills,red_suicides,blue_suicides,green_suicides,yellow_suicides
    FROM nstats_ctf_caps
    WHERE match_id=? ORDER BY cap_timestamp ASC`;

    const result = await simpleQuery(query, [id]);

    const covers = await getMatchCovers(id);
    const carryTimes = await getMatchCarryTimes(id);

    if(result.length === 0) return [];

    const playerCapIds = {};
    const teamCapIds = {"red": [], "blue": [], "green": [], "yellow": []};
    const playerAssistIds = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        if(playerCapIds[r.cap_player] === undefined){
            playerCapIds[r.cap_player] = [];
        }

        playerCapIds[r.cap_player].push(r.id);

        r.coverPlayers = [];

        if(covers[r.id] !== undefined){
            r.coverPlayers = Object.keys(covers[r.id]).map((p) =>{
                return {"name": players?.[p] ?? "Not Found", "totalCovers": covers[r.id][p].length, "timestamps": [...covers[r.id][p]]};
            });
        }

        r.carryInfo = carryTimes[r.id];

        r.cap_type = (r.cap_type === 1) ? "Solo" : "Assisted";
        r.cap_player_id = r.cap_player;
        r.taken_player_id = r.taken_player;

        r.cap_player = players?.[r.cap_player] ?? "Not Found";
        r.taken_player = players?.[r.taken_player] ?? "Not Found";

        r.taken_timestamp = r.taken_timestamp;
        r.cap_timestamp = r.cap_timestamp;

        r.flag_team = getTeamName(r.flag_team).toLowerCase();
        const capTeamName = getTeamName(r.capping_team).toLowerCase();
        r.capping_team = capTeamName;
        teamCapIds[capTeamName].push(r.id);

        r.assistsBy = [];

        if(r.unique_carriers > 1){

            const assists = getAssistPlayersFromCarryTimes(carryTimes[r.id], r.cap_player_id);  

            playerAssistIds[r.id] = assists;

            r.assistsBy = assists.map((pId) =>{
                return players[pId] ?? "Not Found";
            });
        }

        toJSONAPIKeyNames(r);

        for(let x = 0; x < r.carryInfo.length; x++){

            r.carryInfo[x].name = players[r.carryInfo[x].player_id] ?? "Not Found";
            delete r.carryInfo[x].player_id;
            toJSONAPIKeyNames(r.carryInfo[x]);   
        }    
    }

    return {"caps": result, playerCapIds, teamCapIds, playerAssistIds};
}


export async function getMatchCTFJSON(id){

    const columns = [
        "player_id", "flag_taken",
        "flag_pickup", "flag_drop",
        "flag_assist", "flag_cover",
        "flag_seal", "flag_cap",
        "flag_kill", "flag_return",
        "flag_return_base", "flag_return_mid",
        "flag_return_enemy_base", "flag_return_save",
        "flag_carry_time", "flag_carry_time_min",
        "flag_carry_time_max"
    ];

    const table = "nstats_match_ctf";

    let query = `SELECT `;

    for(let i = 0; i < columns.length; i++){

        const c = columns[i];
        query += `${table}.${c},`;      
    }

    query += `nstats_players.name as name,
    nstats_players.country as country,
    nstats_match_players.team as team
    FROM ${table}
    LEFT JOIN nstats_players ON nstats_players.id = nstats_match_ctf.player_id 
    LEFT JOIN nstats_match_players ON nstats_match_players.player_id = nstats_match_ctf.player_id AND nstats_match_players.match_id=?
    WHERE ${table}.match_id=?`;

    const result = await simpleQuery(query, [id, id]);

    if(result.length === 0){
        return {"error": "Not a CTF Match."};
    }

    const players = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];
        r.capIds = [];
        r.assistIds = [];

        if(players[r.player_id] === undefined){
            players[r.player_id] = r.name;
        }

        r.team = getTeamName(r.team);
        setAverageCarryTime(r);

        toJSONAPIKeyNames(r);

    }

    const {caps, playerCapIds, teamCapIds, playerAssistIds} = await getMatchCTFCapsJSON(id, players);

    const teams = createTeamTotalsMatchCTFJSON(result, teamCapIds);

    for(const [playerId, capIds] of Object.entries(playerCapIds)){

        for(let i = 0; i < result.length; i++){

            const r = result[i];

            if(r.id == playerId){
                r.capIds = [...capIds];
                break;
            }
        }
    }

    for(const [capId, assistPlayers] of Object.entries(playerAssistIds)){

        for(let i = 0; i < result.length; i++){

            const r = result[i];
            
            if(assistPlayers.indexOf(r.id) !== -1){
                r.assistIds.push(parseInt(capId));
            }
        }
    }

    return {teams, caps, "players": result};
}


export async function getMatchLadderJSON(id){

    const match = await getMatchBasicTeamGame(id);

    if(match === null){
        throw new Error("Match doesn't exist");
    }

    const mt = "nstats_match_ctf";
    const pmt = "nstats_match_players";
    const pt = "nstats_players";

    const query = `SELECT 
    ${mt}.player_id,
    ${mt}.flag_taken,
    ${mt}.flag_pickup,
    ${mt}.flag_drop,
    ${mt}.flag_assist,
    ${mt}.flag_cover,
    ${mt}.flag_seal,
    ${mt}.flag_cap,
    ${mt}.flag_kill,
    ${mt}.flag_return,
    ${pmt}.country,
    ${pmt}.team,
    ${pmt}.match_result,
    ${pt}.name
    FROM nstats_match_ctf
    LEFT JOIN ${pmt} ON ${pmt}.player_id = ${mt}.player_id AND ${pmt}.match_id = ?
    LEFT JOIN nstats_players ON nstats_players.id = ${mt}.player_id
    WHERE ${mt}.match_id=? AND ${pmt}.bot=0 AND ${pmt}.spectator=0`;

    const result = await simpleQuery(query, [id, id]);

    const players = [];

    for(let i = 0; i < result.length; i++){

        players.push(toJSONAPIKeyNames(result[i]));
        result[i].team = getTeamName(result[i].team);
        result[i].matchResult = toMatchResultString(result[i].matchResult);
    }

    return {...match, players};
}