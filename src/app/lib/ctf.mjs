import { simpleQuery, bulkInsert } from "./database.mjs";
import { getMatchesGametype } from "./matches.mjs";


export async function insertPlayerMatchData(playerManager, matchId){

    const query = `INSERT INTO nstats_match_ctf (
    match_id,player_id,flag_taken,flag_pickup,flag_drop,
    flag_assist,flag_cover,flag_seal,flag_cap,flag_kill,
    flag_return,flag_return_base,flag_return_mid,
    flag_return_enemy_base,flag_return_save) VALUES ?`;

    const insertVars = [];

    for(const player of Object.values(playerManager.mergedPlayers)){
        
        const s = player.stats.ctf;

        insertVars.push([
            matchId, player.masterId, s.taken, s.pickedup, s.dropped,
            s.assist, s.cover, s.seal, s.capture, s.kill,
            s.return, s.returnBase, s.returnMid, s.returnEnemyBase,
            s.returnSave 
        ]);
    }


    await bulkInsert(query, insertVars);
}

export async function getMatchData(matchId, bReturnJSON){

    if(bReturnJSON === undefined) bReturnJSON = false;

    const query = `SELECT player_id,flag_taken,flag_pickup,flag_drop,flag_assist,flag_cover,
    flag_seal,flag_cap,flag_kill,flag_return,flag_return_base,flag_return_mid,flag_return_enemy_base,flag_return_save
    FROM nstats_match_ctf WHERE match_id=?`;

    const result = await simpleQuery(query, [matchId]);

    if(!bReturnJSON) return result;

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


export async function changePlayerIds(oldIds, newId){

    if(oldIds.length === 0) return {"changedRows": 0};

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

async function insertCap(playerManager, matchId, mapId, gametypeId, cap){

    const c = cap;

    const takenPlayer = playerManager.getPlayerById(c.takenBy)?.masterId ?? -1;
    const capPlayer = playerManager.getPlayerById(c.playerId)?.masterId ?? -1;

    const query = `INSERT INTO nstats_ctf_caps VALUES(NULL,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

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
        c.uniqueCarriers
    ];

    try{

        const result = await simpleQuery(query, vars);

        const capId = result.insertId;

        if(capId === undefined) throw new Error("cap id is null");

        await insertCovers(playerManager, matchId, capId, c.covers);

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


export async function getMatchCaps(matchId){

    const query = ``;

}