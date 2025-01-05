import { simpleQuery, bulkInsert } from "./database.mjs";
import { getMatchesGametype } from "./matches.mjs";
import Message from "./message.mjs";


export async function insertPlayerMatchData(playerManager, matchId, gametypeId, mapId){

    const query = `INSERT INTO nstats_match_ctf (
    match_id,map_id,gametype_id,player_id,flag_taken,flag_pickup,flag_drop,
    flag_assist,flag_cover,flag_seal,flag_cap,flag_kill,
    flag_return,flag_return_base,flag_return_mid,
    flag_return_enemy_base,flag_return_save,flag_carry_time,flag_carry_time_min,flag_carry_time_max) VALUES ?`;

    const insertVars = [];

    for(const player of Object.values(playerManager.mergedPlayers)){
        
        const s = player.stats.ctf;

        insertVars.push([
            matchId, mapId, gametypeId, player.masterId, s.taken, s.pickedup, s.dropped,
            s.assist, s.cover, s.seal, s.capture, s.kill,
            s.return, s.returnBase, s.returnMid, s.returnEnemyBase,
            s.returnSave, s.flagCarryTime.total, s.flagCarryTime.min, s.flagCarryTime.max 
        ]);
    }

    await bulkInsert(query, insertVars);
}

export async function getMatchData(matchId, bReturnJSON){

    if(bReturnJSON === undefined) bReturnJSON = false;

    const query = `SELECT player_id,flag_taken,flag_pickup,flag_drop,flag_assist,flag_cover,
    flag_seal,flag_cap,flag_kill,flag_return,flag_return_base,flag_return_mid,flag_return_enemy_base,
    flag_return_save,flag_carry_time,flag_carry_time_min,flag_carry_time_max
    FROM nstats_match_ctf WHERE match_id=?`;

    const result = await simpleQuery(query, [matchId]);


    const caps = await getMatchCaps(matchId);

    if(!bReturnJSON){
        return {"playerData": result, "caps": caps};
    }

    const obj = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        obj[r.player_id] = {
            "taken": r.flag_taken,
            "pickup": r.flag_pickup,
            "drop": r.flag_drop,
            "assist": r.flag_assist,
            "cover": r.flag_cover,
            "seal": r.flag_seal,
            "cap": r.flag_cap,
            "kill": r.flag_kill,
            "return": r.flag_return,
            "returnTypes": {
                "base": r.flag_return_base,
                "mid": r.flag_return_mid,
                "enemyBase": r.flag_return_enemy_base,
                "save": r.flag_return_save
            }
        };
    }

    return obj;
}

function _updatePlayerTotals(totals, gametypeId, matchData){

    const playerId = matchData.player_id;

    const ignore = ["id", "match_id", "player_id", "gametype"];

    if(totals[playerId] === undefined){
        totals[playerId] = {};
    }

    if(totals[playerId][gametypeId] === undefined){

        const current = {
            "matches": 1
        };

        for(const key of Object.keys(matchData)){

            if(ignore.indexOf(key) !== -1) continue;

            current[key] = matchData[key];

        }

        totals[playerId][gametypeId] = current;
        return;
    }

    const t = totals[playerId][gametypeId];

    t.matches++;

    for(const key of Object.keys(matchData)){

        if(ignore.indexOf(key) !== -1) continue;

        t[key] += matchData[key];

    }
}

async function getPlayersMatchesData(playerIds){

    const query = `SELECT * FROM nstats_match_ctf WHERE player_id IN (?)`;

    const result = await simpleQuery(query, [playerIds]);

    const matchIds = [...new Set(result.map((r) =>{
        return r.match_id;
    }))]

    const gametypeIds = await getMatchesGametype(matchIds);

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        r.gametype = gametypeIds[r.match_id] ?? -1;
    }

    return result;
}

async function calcPlayerTotals(playerIds){

    
    const result = await getPlayersMatchesData(playerIds);

    //console.log(result);

    const totals = {};


    for(let i = 0; i < result.length; i++){

        const r = result[i];

        //all time totals
        _updatePlayerTotals(totals, 0, r);

        //gametype totals
        _updatePlayerTotals(totals, r.gametype, r);
    }

    return totals;
}


async function deletePlayerTotals(playerId, gametypeIds){

    if(gametypeIds.length === 0) return;

    const query = `DELETE FROM nstats_player_totals_ctf WHERE player_id=? AND gametype_id IN (?)`;

    return await simpleQuery(query, [playerId, gametypeIds]);
}


async function insertPlayerTotals(insertVars){

    const query = `INSERT INTO nstats_player_totals_ctf (
        player_id, gametype_id, total_matches, flag_taken,
        flag_pickup, flag_drop, flag_assist, flag_cover,
        flag_seal, flag_cap, flag_kill, flag_return,
        flag_return_base, flag_return_mid, flag_return_enemy_base,
        flag_return_save
    ) VALUES ?`;

    await bulkInsert(query, insertVars);
}

export async function updatePlayerTotals(playerIds){

    if(playerIds.length === 0) return;

    const data = await calcPlayerTotals(playerIds);

    const insertVars = [];

    for(const [playerId, playerData] of Object.entries(data)){

        let gametypeIdsToDelete = [];

        for(const [gametypeId, d] of Object.entries(playerData)){

            gametypeIdsToDelete.push(gametypeId);

            insertVars.push([
                playerId, gametypeId, d.matches,
                d.flag_taken, d.flag_pickup, d.flag_drop,
                d.flag_assist, d.flag_cover, d.flag_seal, d.flag_cap,
                d.flag_kill, d.flag_return, d.flag_return_base,
                d.flag_return_mid, d.flag_return_enemy_base, d.flag_return_save
            ]);
        }

        await deletePlayerTotals(playerId, gametypeIdsToDelete);
    }

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


function setCapTeamTotalKills(cap){

    const kills = {"red": 0, "blue": 0, "green": 0, "yellow": 0};

    for(let i = 0; i < cap.kills.length; i++){

        const k = cap.kills[i];

        switch(k.killerTeam){
            case 0: {   kills.red++; } break;
            case 1: {   kills.blue++; } break;
            case 2: {   kills.green++; } break;
            case 3: {   kills.yellow++; } break;
            default: { new Message(`setCapTeamKills Unknown team`,"warning")} break;
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

    const kills = setCapTeamTotalKills(cap);
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

        data[r.cap_id].push(r);
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

    const query = `SELECT cap_id,player_id,player_team FROM nstats_ctf_cap_suicides WHERE match_id=? ORDER BY timestamp ASC`;

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
    GROUP BY player_id,gametype_id`;

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
            r.player_id, r.gametype_id, r.total_matches, r.flag_taken, r.flag_pickup,
            r.flag_drop, r.flag_assist, r.flag_cover, r.flag_seal, r.flag_cap, r.flag_kill,
            r.flag_return, r.flag_return_base, r.flag_return_mid, r.flag_return_enemy_base,
            r.flag_return_save
        ]);
    }


    for(const [playerId, d] of Object.entries(allTimeTotals)){

        insertVars.push([
            playerId, 0, d.total_matches, d.flag_taken, d.flag_pickup,
            d.flag_drop, d.flag_assist, d.flag_cover, d.flag_seal, d.flag_cap, d.flag_kill,
            d.flag_return, d.flag_return_base, d.flag_return_mid, d.flag_return_enemy_base,
            d.flag_return_save
        ]);
    }

    const insertQuery = `INSERT INTO nstats_player_totals_ctf (
    player_id, gametype_id, total_matches, flag_taken, flag_pickup,
    flag_drop, flag_assist, flag_cover, flag_seal, flag_cap, flag_kill,
    flag_return, flag_return_base, flag_return_mid, flag_return_enemy_base,
    flag_return_save
    ) VALUES ?`;

    await bulkInsert(insertQuery, insertVars);

}

async function recalculateTotals(){


    const gametypeTotals = await getTotalsFromMatchData();
}

export async function deleteMatch(matchId){

    /*nstats_ctf_caps, match_id
     * nstats_ctf_cap_kills, match_id
     * nstats_ctf_cap_suicides, match_id
     * nstats_ctf_carry_times, match_id
     * nstats_ctf_covers, match_id*/

    //nstats_player_totals_ctf

    const deleteFromTables = [
        "nstats_ctf_caps","nstats_ctf_cap_kills","nstats_ctf_cap_suicides",
        "nstats_ctf_carry_times","nstats_ctf_covers", "nstats_match_ctf"
    ];

    for(let i = 0; i < deleteFromTables.length; i++){

        const t = deleteFromTables[i];

        await simpleQuery(`DELETE FROM ${t} WHERE match_id=?`, [matchId]);
    }


    await recalculateTotals();
}