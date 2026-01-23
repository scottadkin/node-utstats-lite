import {mysqlGetColumnsAsArray, simpleQuery} from "./database.mjs";
import {getMapNames, getNameById} from "./maps.mjs";
import { getGametypeNames, updateBasicTotals as gametypeUpdateBasicTotals } from "./gametypes.mjs";
import { getAllNames, getServerNames } from "./servers.mjs";
import { getMapImages, updateTotals as mapUpdateTotals } from "./maps.mjs";
import { getPlayersById, getBasicPlayerInfo, getPlayerNamesByIds, setPlayerMapAverages, getPlayerIdsInMatch, updatePlayerTotals } from "./players.mjs";
import { getMatchWeaponStats, getWeaponNames, calcMapWeaponsTotals as weaponCalcMapWeaponsTotals, updatePlayerTotals as weaponUpdatePlayerTotals } from "./weapons.mjs";
import { getMatchKills, getMatchKillsBasic, deleteMatchKills } from "./kills.mjs";
import { getMatchData as ctfGetMatchData, deleteMatch as ctfDeleteMatch } from "./ctf.mjs";
import { getMatchData as domGetMatchData } from "./domination.mjs";
import md5 from "md5";
import { getWinner, getTeamName, sanitizePagePerPage, mysqlSetTotalsByDate, DAY, setInt, convertTimestamp, getMapImageName, getHeatmapDates } from "./generic.mjs";
import { getMatchDamage, deleteMatch as deleteMatchDamage } from "./damage.mjs";
import { recalculateGametype as rankingRecalculateGametype, recalculateMap as rankingRecalculateMap} from "./rankings.mjs";
import { getValidGametypes, getValidMaps, deleteMatch as deleteMatchCTFLeague } from "./ctfLeague.mjs";


const MATCH_TABLE_COLUMNS_VERBOSE = `nstats_matches.id,
    nstats_matches.server_id,
    nstats_matches.gametype_id,
    nstats_matches.map_id,
    nstats_matches.hardcore,
    nstats_matches.insta,
    nstats_matches.date,
    nstats_matches.playtime,
    nstats_matches.match_start,
    nstats_matches.match_end,
    nstats_matches.players,
    nstats_matches.total_teams,
    nstats_matches.team_0_score,
    nstats_matches.team_1_score,
    nstats_matches.team_2_score,
    nstats_matches.team_3_score,
    nstats_matches.solo_winner,
    nstats_matches.solo_winner_score,
    nstats_matches.target_score,
    nstats_matches.time_limit,
    nstats_matches.mutators,
    nstats_matches.hash`;


export async function createMatch(serverId, gametypeId, mapId, bHardcore, bInsta, date, playtime, matchStart, matchEnd,
     players, totalTeams, team0Scores, team1Scores, 
    team2Scores, team3Score, soloWinner, soloWinnerScore, targetScore, timeLimit, mutators){

    const query = `INSERT INTO nstats_matches VALUES(NULL,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,"")`;

    const vars = [
        serverId, gametypeId, mapId, bHardcore, bInsta, 
        date, playtime, matchStart, matchEnd, players, totalTeams, team0Scores, 
        team1Scores, team2Scores, team3Score, soloWinner, soloWinnerScore,
        targetScore, timeLimit, mutators
    ];

    const result = await simpleQuery(query, vars);

    if(result.insertId !== undefined) return result.insertId;

    return null;
}

function _getUniqueTypeIds(matches){

    const serverIds = new Set();
    const gametypeIds = new Set();
    const mapIds = new Set();


    for(let i = 0; i < matches.length; i++){

        const m = matches[i];

        serverIds.add(m.server_id);
        gametypeIds.add(m.gametype_id);
        mapIds.add(m.map_id);
    }

    return {
        "serverIds": [...serverIds],
        "gametypeIds": [...gametypeIds],
        "mapIds": [...mapIds],
    };
}

/**
 * Get the names for all serverIds, gametypeIds, mapIds that are in the supplied matches
 */
async function setMatchTypeNames(matches){

    throw new Error(`Don't use setMatchTypeNames use sql joins`);
    
    const {mapIds, gametypeIds, serverIds} = _getUniqueTypeIds(matches);

    const mapNames = await getMapNames(mapIds);
    const gametypeNames = await getGametypeNames(gametypeIds);
    const serverNames = await getServerNames(serverIds);
    const mapImages = await getMapImages(mapNames);

    for(let i = 0; i < matches.length; i++){

        const m = matches[i];
        m.server_name = serverNames[m.server_id];
        m.gametype_name = gametypeNames[m.gametype_id];
        m.map_name = mapNames[m.map_id];
        m.map_image = mapImages[m.map_name.toLowerCase()];
    }

}



function createSearchWhere(server, gametype, map){

    let where = ``;

    const whereVars = [];
    const vars = [];

    if(server !== 0){
        whereVars.push(`server_id=?`);
        vars.push(server);
    }

    if(gametype !== 0){
        whereVars.push(`gametype_id=?`);
        vars.push(gametype);
    }

    if(map !== 0){
        whereVars.push(`map_id=?`);
        vars.push(map);
    }

    for(let i = 0; i < whereVars.length; i++){

        const w = whereVars[i];

        if(i === 0){
            where = `WHERE ${w} `;
        }else{
            where += ` AND ${w} `;
        }
    }


    return {where, vars}
}


export async function getTotalMatches(server, gametype, map){

    const {where, vars} = createSearchWhere(server, gametype, map);
    const query = `SELECT COUNT(*) as total_matches FROM nstats_matches ${where}`;

    const result = await simpleQuery(query, vars);

    if(result.length > 0) return result[0].total_matches;
    return 0;
}

export async function getRecentMatches(dirtyPage, dirtyPerPage, server, gametype, map){

    const DEFAULT_PER_PAGE = 50;

    const [page, perPage, start] = sanitizePagePerPage(dirtyPage, dirtyPerPage);

    server = parseInt(server);
    gametype = parseInt(gametype);
    map = parseInt(map);

    if(server !== server || gametype !== gametype || map !== map){
        throw new Error(`server, gametype, and map must be a valid integer`);
    }
    const {where, vars} = createSearchWhere(server, gametype, map);

    let query = `SELECT ${MATCH_TABLE_COLUMNS_VERBOSE},
    nstats_servers.name as server_name,
    nstats_gametypes.name as gametype_name,
    nstats_maps.name as map_name,
    nstats_players.name as solo_winner_name,
    nstats_players.country as solo_winner_country 
    FROM nstats_matches 
    LEFT JOIN nstats_servers ON nstats_servers.id = nstats_matches.server_id
    LEFT JOIN nstats_gametypes ON nstats_gametypes.id = nstats_matches.gametype_id
    LEFT JOIN nstats_maps ON nstats_maps.id = nstats_matches.map_id
    LEFT JOIN nstats_players ON nstats_players.id = nstats_matches.solo_winner
    ${where} ORDER BY nstats_matches.date DESC, nstats_matches.id DESC LIMIT ?, ?`;

    const result = await simpleQuery(query, [...vars, start, perPage]);

    const mapNames = new Set();

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        if(typeof r.map_name === "string"){
            mapNames.add(r.map_name);
            r.image_name = r.map_name.toLowerCase();
        }else{
            r.image_name = "default";
        }

    }

    const mapImages = await getMapImages([...mapNames]);

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        if(mapImages[r.image_name] !== undefined){
            r.map_image = mapImages[r.image_name];
        }else{
            r.map_image = "default.jpg";
        }
    }
    
    const totalMatches = await getTotalMatches(server, gametype, map);

    return {"data": result, "total": totalMatches};
}

//
export async function getMatch(id){

    if(id === null) return null;

    const query = `SELECT ${MATCH_TABLE_COLUMNS_VERBOSE},
    nstats_servers.name as server_name,
    nstats_gametypes.name as gametype_name,
    nstats_maps.name as map_name,
    nstats_players.name as player_name 
    FROM nstats_matches
    LEFT JOIN nstats_servers ON nstats_servers.id = nstats_matches.server_id
    LEFT JOIN nstats_gametypes ON nstats_gametypes.id = nstats_matches.gametype_id
    LEFT JOIN nstats_maps ON nstats_maps.id = nstats_matches.map_id
    LEFT JOIN nstats_players ON nstats_players.id = nstats_matches.solo_winner
     WHERE nstats_matches.id=?`;

    const result = await simpleQuery(query, [id]);

    if(result.length === 0) return null;

    result[0].dateString = convertTimestamp(result[0].date, true, false, true);

    const data = result[0];

    const mapImages = await getMapImages([data.map_name]);
    data.mapImage = Object.values(mapImages)[0];

    return data;
}

async function getPlayerMatchData(id){


    const query = `SELECT id,player_id,spectator,country,bot,ping_min,ping_avg,ping_max,team,score,frags,kills,deaths,suicides,team_kills,efficiency,time_on_server,
    ttl,spree_1,spree_2,spree_3,spree_4,spree_5,spree_best,first_blood,multi_1,multi_2,multi_3,multi_4,multi_best,headshots,
    item_amp,item_belt,item_boots,item_body,item_pads,item_invis,item_shp 
    FROM nstats_match_players WHERE match_id=? ORDER BY score DESC`;

    const damageData = await getMatchDamage(id);

    const result = await simpleQuery(query, [id]);

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        if(damageData[r.player_id] != undefined){
            r.damage = damageData[r.player_id];
        }
    }

    return result;
}

async function getPlayerMatchScores(id){

    const query = `SELECT player_id,team,score,frags,kills,deaths,spectator FROM nstats_match_players WHERE match_id=? ORDER BY score DESC`;

    return await simpleQuery(query, [id]);

}


export async function getMatchIdFromHash(hash){

    const query = `SELECT id FROM nstats_matches WHERE hash=?`;

    const result = await simpleQuery(query, [hash]);

    if(result.length > 0) return result[0].id;

    return null;
}


export async function bMatchExists(id){

    if(id.length === 32){

        id = await getMatchIdFromHash(id);
        if(id !== null) return true;
    }

    const query = `SELECT COUNT(*) as total_matches FROM nstats_matches WHERE id=?`;
    const result = await simpleQuery(query, [id]);

    if(result[0].total_matches > 0) return true;
    return false;
}

export async function getMatchData(id, bIgnoreKills, bIgnoreWeaponStats, bIgnorePlayers, bIgnoreBasic){

    try{

        if(bIgnoreKills === undefined) bIgnoreKills = false;
        if(bIgnoreWeaponStats === undefined) bIgnoreWeaponStats = false;
        if(bIgnorePlayers === undefined) bIgnorePlayers = false;
        if(bIgnoreBasic === undefined) bIgnoreBasic = false;

        if(bIgnoreBasic && bIgnoreKills && bIgnorePlayers && bIgnoreWeaponStats) return {"error": "Everything is set to ignore"};

        if(id.length !== 32){

            id = parseInt(id);
            if(id !== id) throw new Error(`MatchId must be a valid integer`);

        }else{

            id = await getMatchIdFromHash(id);
            if(id === null) throw new Error(`No match with that hash exists`);

        }

        const basic = await getMatch(id);
        if(basic === null) throw new Error(`Match doesnt exist`);

        let playerData = null;
        let playerNames = {};
        let basicPlayers = {};

        if(!bIgnorePlayers){

            playerData = await getPlayerMatchData(id);

            const uniquePlayers = [...new Set(playerData.map((p) =>{
                return p.player_id;
            }))]

            playerNames = await getPlayersById(uniquePlayers);

            for(let i = 0; i < playerData.length; i++){

                const p = playerData[i];

                p.name = playerNames[p.player_id] ?? "Not Found";
            }


            for(let i = 0; i < playerData.length; i++){

                const p = playerData[i];

                basicPlayers[p.player_id] = {
                    "name": p.name,
                    "country": p.country,
                    "team": p.team,
                    "bSpectator": p.spectator
                };
            }

        }

        const weaponStats = (bIgnoreWeaponStats) ? null : await getMatchWeaponStats(id);
   
        const kills = (bIgnoreKills) ? [] : await getMatchKills(id);

        const ctf = await ctfGetMatchData(id);
        const dom = await domGetMatchData(id);

        return {basic, playerData, playerNames, weaponStats, basicPlayers, kills, ctf, dom};
        
    }catch(err){
        console.trace(err);
        return {"error": err.toString()};
    }
}



/**
 * get one or more match details(map_id, gametype_id)
 * @param {*} matchIds 
 * @returns 
 */
export async function getMultipleMatchDetails(matchIds){

    if(matchIds.length === 0) return {};

    const query = `SELECT id,gametype_id,map_id,date,total_teams,team_0_score,team_1_score,team_2_score,team_3_score,solo_winner 
    FROM nstats_matches WHERE id IN(?)`;
    const result = await simpleQuery(query, [matchIds]);

    const data = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        data[r.id] = {
            "gametype": r.gametype_id, 
            "map": r.map_id, 
            "date": r.date,
            "teams": r.total_teams,
            "teamScores": [
                r.team_0_score,
                r.team_1_score,
                r.team_2_score,
                r.team_3_score,
            ],
            "soloWinner": r.solo_winner
        };
    }

    return data;
}



export async function getMatchesGametype(matchIds){

    if(matchIds.length === 0) return {};

    const query = `SELECT id,gametype_id FROM nstats_matches WHERE id IN(?)`;

    const result = await simpleQuery(query, [matchIds]);

    const data = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];
        data[r.id] = r.gametype_id;
    }

    return data;
}

export async function getMatchesResultByIds(ids){

    if(ids.length === 0) return {};

    const query = `SELECT 
    id,server_id,gametype_id,map_id,total_teams,team_0_score,team_1_score,
    team_2_score,team_3_score,solo_winner,solo_winner_score FROM nstats_matches WHERE id IN (?)`;

    const result = await simpleQuery(query, [ids]);

    const data = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];
        data[r.id] = r;
    }

    return data;
}


export async function setMatchHash(id, hash){

    const query = `UPDATE nstats_matches SET hash=? WHERE id=?`;

    hash = md5(hash);

    return await simpleQuery(query, [hash, id]);
}

export async function getBasicMatchesInfo(matchIds){

    if(matchIds.length === 0) return {};

    const query = `SELECT id,server_id,gametype_id,map_id FROM nstats_matches WHERE id IN(?)`;

    const result = await simpleQuery(query, [matchIds]);

    const {mapIds, gametypeIds, serverIds} = _getUniqueTypeIds(result);

    const serverNames = await getServerNames(serverIds);
    const gametypeNames = await getGametypeNames(gametypeIds);
    const mapNames = await getMapNames(mapIds);

    const data = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];
        data[r.id] = r;

        r.server_name = serverNames[r.server_id];
        r.gametype_name = gametypeNames[r.gametype_id];
        r.map_name = mapNames[r.map_id];
    }


    return data;

}



function _JSONAddPlayerDetails(players, data, weaponNames, weaponStats, bIgnoreSpecial, bIgnorePickups){

  
    if(players === null) return;

    for(let i = 0; i < data.ctf.length; i++){

        const d = data.ctf[i];

        const player = players[d.player_id] ?? null;

        if(player === null) continue;

        player.ctf = {
            "taken": d.flag_taken,
            "pickup": d.flag_pickup,
            "drop": d.flag_drop,
            "assist": d.flag_assist,
            "cover": d.flag_cover,
            "seal": d.flag_seal,
            "cap": d.flag_cap,
            "kill": d.flag_kill,
            "return": d.flag_return,
            "returnBase": d.flag_return_base,
            "returnMid": d.flag_return_mid,
            "returnEnemyBase": d.flag_return_enemy_base,
            "returnSave": d.flag_return_save,
        };

    }

    if(data.playerData === null) return;

    for(let i = 0; i < data.playerData.length; i++){

        const d = data.playerData[i];

        //console.log(d);

        const player = players[d.player_id] ?? null;

        if(player === null) continue;

        player.team = d.team;
        player.ping = d.ping_avg;

        player.general = {
            "score": d.score,
            "frags": d.frags,
            "kills": d.kills,
            "deaths": d.deaths,
            "suicides": d.suicides,
            "teamKills": d.team_kills,
            "efficiency": d.efficiency,
            "playtime": d.time_on_server,
            "ttl": d.ttl,
        };

        if(d.damage !== undefined){

            player.damage = d.damage;
        }

        if(!bIgnorePickups){

            player.pickups = {
                "amp": d.item_amp,
                "belt": d.item_belt,
                "boots": d.item_boots,
                "body": d.item_body,
                "pads": d.item_pads,
                "invis": d.item_invis,
                "shp": d.item_shp,
            };
        }

        if(!bIgnoreSpecial){

            player.events = {
                "firstBlood": d.first_blood === 1,
                "sprees": {
                    "spree": d.spree_1,
                    "rampage": d.spree_2,
                    "dominating": d.spree_3,
                    "unstoppable": d.spree_4,
                    "godlike": d.spree_5,
                    "best": d.spree_best
                },
                "multis": {
                    "double": d.multi_1,
                    "multi": d.multi_2,
                    "ultra": d.multi_3,
                    "monster": d.multi_4,
                    "best": d.multi_best
                }
            };
        }

        if(data.dom.data.length === 0) continue;


        for(const [key, value] of Object.entries(players)){
            value.dom = {
                "total": 0,
                "controlPoints": {}
            };
        }


        for(let i = 0; i < data.dom.data.length; i++){

            const d = data.dom.data[i];

            const pointName = data.dom.controlPoints[d.point_id] ?? `Not Found (${d.point_id})`;

            const player = players[d.player_id] ?? null;

            if(player === null) continue;

            if(player.dom.controlPoints[pointName] === undefined){
                player.dom.controlPoints[pointName] = d.total_caps;
            }

            player.dom.total += d.total_caps;
        }
    }


    if(weaponStats === null) return;

    for(let i = 0; i < weaponStats.length; i++){

        const w = weaponStats[i];

        let weapon = weaponNames[w.weapon_id];

        if(weapon === undefined) weapon = "Not Found";

        const player = players[w.player_id] ?? null;

        if(player === null) continue;

        if(player.weaponStats === undefined) player.weaponStats = {};

        player.weaponStats[weapon] = {
            "kills": w.kills ?? 0,
            "deaths": w.deaths ?? 0,
            "teamKills": w.teamKills ?? 0
        };
    }
}


async function _JSONCreateMatchInfo(basic, ctf){

    const b = basic;

    const winner = getWinner({"basic": basic});

    const data = {
        "server": b.serverName,
        "gametype": b.gametypeName,
        "map": b.mapName,
        "playtime": b.playtime,
        "players": b.players,
        "matchId": b.id,
        "matchPermaLinkId": b.hash,
        "bInstagib": b.insta === 1,
        "winners": winner.winners,
        "timestamp": Math.floor(new Date(basic.date) * 0.001)
            
    };

    if(winner.type === "teams"){

        data.redTeamScore = b.team_0_score;
        data.blueTeamScore = b.team_1_score;
        data.greenTeamScore = b.team_2_score;
        data.yellowTeamScore = b.team_3_score;

        data.winnerScore = b[`team_${winner.winners[0]}_score`] ?? -9999;

        for(let i = 0; i < data.winners.length; i++){

            const d = data.winners[i];

            data.winners[i] = getTeamName(d);
        }

    }else{

        data.winnerScore = b.solo_winner_score ?? -9999;
        const winningPlayer = await getPlayersById(b.solo_winner);

        if(winningPlayer[b.solo_winner] === undefined){
            data.winningPlayer = "Not Found";
        }else{
            data.winningPlayer = winningPlayer[b.solo_winner];
        }
    }

    return data;
}


function _JSONSetDomData(dom){

    const totals = {
        "all": 0
    };

    for(let i = 0; i < dom.data.length; i++){

        const d = dom.data[i];

        const pointName = dom.controlPoints[d.point_id] ?? `Not Found ${d.point_id}`;

        if(totals[pointName] === undefined) totals[pointName] = 0;

        totals[pointName] += d.total_caps;
        totals.all += d.total_caps;
    }

    if(totals.all === 0) return null;

    return totals;
}


function _setKillsData(kills, playerNames, weaponNames, bIgnoreTimestamp, bIgnoreWeapons){

    if(bIgnoreTimestamp === undefined) bIgnoreTimestamp = false;
    if(bIgnoreWeapons === undefined) bIgnoreWeapons = false;

    const killers = {};


    const data = kills.map((k) =>{
        
        const killerName = playerNames[k.killer_id] ?? k.killer_id;
        const victimName = playerNames[k.victim_id] ?? k.victim_id;

        if(killers[killerName] === undefined) killers[killerName] = {};

        if(killers[killerName][victimName] === undefined){

            killers[killerName][victimName] = {
                "kills": 0
            };

            if(!bIgnoreTimestamp){
                killers[killerName][victimName].timestamps = [];
            }
        }

        killers[killerName][victimName].kills++;

        if(!bIgnoreTimestamp){
            killers[killerName][victimName].timestamps.push(k.timestamp);
        }

        const current = {
            "k": killerName,
            "v": victimName
        };

        if(!bIgnoreTimestamp) current.t = k.timestamp;

        if(!bIgnoreWeapons){
            current.vw = weaponNames[k.victim_weapon];
            current.kw = weaponNames[k.killer_weapon];
        }


        return current;
    });


    return {"killers": killers};
}

/**
 * used for /api/json/match
 */
export async function getMatchJSON(id, bIgnoreKills, bIgnoreWeaponStats, bIgnorePlayers, bIgnoreBasic, bIgnoreSpecial, bIgnorePickups){

    try{

        if(bIgnoreKills === undefined) bIgnoreKills = false;
        if(bIgnoreWeaponStats === undefined) bIgnoreWeaponStats = false;
        if(bIgnorePlayers === undefined) bIgnorePlayers = false;
        if(bIgnoreBasic === undefined) bIgnoreBasic = false;
        if(bIgnoreSpecial === undefined) bIgnoreSpecial = false;
        if(bIgnorePickups === undefined) bIgnorePickups = false;

        const data = await getMatchData(
            id, 
            bIgnoreKills, 
            bIgnoreWeaponStats, 
            bIgnorePlayers, 
            bIgnoreBasic);

        if(data.error !== undefined) throw new Error(data.error);

        const players = data.basicPlayers;


        const weaponNames = (data.weaponStats === null) ? {} : data.weaponStats.names;
        const weaponStats = (data.weaponStats === null) ? {} : data.weaponStats.data;
        
        //console.log(data);

        _JSONAddPlayerDetails(players, data, weaponNames, weaponStats, bIgnoreSpecial, bIgnorePickups);

        //console.log(data.ctf);

    // console.log(players);

        

        const finalPlayers = [];

        for(const p of Object.values(players)){
            finalPlayers.push(p);
        }

        //console.log(data.basic);

        const basic = await _JSONCreateMatchInfo(data.basic);

        const dom = _JSONSetDomData(data.dom);

        //console.log(basic);

        const jsonObject = {};

        if(!bIgnoreBasic && dom !== null) jsonObject.dom = dom;
        if(!bIgnoreBasic) jsonObject.basic = basic;
        if(!bIgnorePlayers) jsonObject.players = finalPlayers;
        if(!bIgnoreKills){

            let weapons = {};
            let playerIds = new Set();

            
            let weaponIds = new Set();

            

            for(let i = 0; i < data.kills.length; i++){

                const k = data.kills[i];
                weaponIds.add(k.killer_weapon);
                weaponIds.add(k.victim_weapon);

                playerIds.add(k.killer_id);
                playerIds.add(k.victim_id);
            }

            weaponIds = [...weaponIds]
 
            weapons = await getWeaponNames(weaponIds);

            const playerNames = await getPlayerNamesByIds([...playerIds]);

            jsonObject.kills = _setKillsData(data.kills, playerNames, weapons, true, bIgnoreWeaponStats);

        }

        return jsonObject;

    }catch(err){
        return {"error": err.toString()}
    }
    //return {"players":  finalPlayers, "basic": basic};
}



export async function getBasicMatchJSON(id){


    const data = await getMatch(id);

    if(data === null) throw new Error("Match doesn't exist!");

    const winner = getWinner({"basic": data});

    const obj = {
        "matchId": data.id,
        "hash": data.hash,
        "server": data.serverName,
        "gametype": data.gametypeName,
        "map": data.mapName,
        "playtime": data.playtime,
        "players": data.players,
        "winners": [],
        "bInstagib": data.insta === 1
    };

    if(data.total_teams > 0){

        obj.teams = data.total_teams;
        obj.redTeamScore = data.team_0_score;
        obj.blueTeamScore = data.team_1_score;
        obj.greenTeamScore = data.team_2_score;
        obj.yellowTeamScore = data.team_3_score;

        for(let i = 0; i < winner.winners.length; i++){

            const w = winner.winners[i];

            obj.winners.push(getTeamName(w));

        }

    }else{

        const winningPlayerInfo = await getBasicPlayerInfo([winner.winnerId]);

        const winningPlayer = winningPlayerInfo[winner.winnerId]?.name ?? "Not Found";

        obj.winners.push(winningPlayer);
    }


    return obj;
}

export async function getMatchKillsBasicJSON(id){

    const data = await getMatchKillsBasic(id);

    const playerIds = new Set();

    const kills = [];

    for(let i = 0; i < data.length; i++){

        const d = data[i];

        playerIds.add(d.killer_id);
        playerIds.add(d.victim_id);

        kills.push([
            d.killer_id, d.victim_id
        ]);    
    }

    const players = await getPlayerNamesByIds([...playerIds]);

    return {"players": players, "kills": kills};
}


export async function getMatchKillsDetailedJSON(id){

    const data = await getMatchKills(id);

    const playerIds = new Set();
    const weaponIds = new Set();
    
    const kills = [];

    for(let i = 0; i < data.length; i++){

        const d = data[i];

        playerIds.add(d.killer_id);
        playerIds.add(d.victim_id);
        weaponIds.add(d.killer_weapon);
        weaponIds.add(d.victim_weapon);
        kills.push([d.timestamp, d.killer_id, d.victim_id, d.killer_weapon, d.victim_weapon]);
    }

    const players = await getPlayerNamesByIds([...playerIds]);
    const weapons = await getWeaponNames([...weaponIds]);

    return {"players": players, "weapons": weapons, "kills": kills};
}

async function _createPlayerWeaponKillsJSON(matchId){

    const kills = await getMatchKills(matchId);

    const weaponIds = new Set();

    for(let i = 0; i < kills.length; i++){

        const k = kills[i];

        weaponIds.add(k.killer_weapon);
        weaponIds.add(k.victim_weapon);
    }

    const weaponNames = await getWeaponNames([...weaponIds]);
    const data = {};

    for(let i = 0; i < kills.length; i++){

        const k = kills[i];

        const kId = k.killer_id;
        const kW = weaponNames[k.killer_weapon] ?? "Not Found";
        const vId = k.victim_id;
        const vW = weaponNames[k.victim_weapon] ?? "Not Found";


        if(data[kId] === undefined){
            data[kId] = {};//{"kills": 0, "deaths": 0};
        }

        if(data[vId] === undefined){
            data[vId] = {};//{"kills": 0, "deaths": 0};
        }

        if(data[kId][kW] === undefined){
            data[kId][kW]  = {"kills": 0, "deaths": 0};
        }

        if(data[vId][vW] === undefined){
            data[vId][vW]  = {"kills": 0, "deaths": 0};
        }

        const killerStats = data[kId][kW];
        const victimStats = data[vId][vW];

        killerStats.kills++;
        victimStats.deaths++;
    }

    return data;
}

export async function getPlayerStatsJSON(matchId){

    const result = await getPlayerMatchData(matchId);

    const weaponStats = await _createPlayerWeaponKillsJSON(matchId);

    const ctfStats = await ctfGetMatchData(matchId, true);

    const playerIds = [...new Set(result.map((r) =>{
        return r.player_id;
    }))]

    const playerNames = await getPlayerNamesByIds(playerIds);

    const data = [];

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        const p = {};

        p.name = playerNames[r.player_id] ?? "Not Found";

        p.spectator = r.spectator === 1;
        p.bot = r.bot === 1;
        p.ping = r.ping;
        p.country = r.country;

        p.weaponStats = (weaponStats[r.player_id] !== undefined) ? weaponStats[r.player_id] : {};

        p.general = {
            "score": r.score,
            "frags": r.frags,
            "kills": r.kills,
            "deaths": r.deaths,
            "suicides": r.suicides,
            "teamKills": r.team_kills,
            "efficiency": r.efficiency,
            "playtime": r.playtime,
        };

        p.special = {
            "multis": [
                r.multi_1,
                r.multi_2,
                r.multi_3,
                r.multi_4,
            ],
            "multiBest": r.multi_best,
            "sprees": [
                r.spree_1,
                r.spree_2,
                r.spree_3,
                r.spree_4,
                r.spree_5,
            ],
            "spreeBest": r.spree_best,
            "firstBlood": r.first_blood === 1
        };

        if(r.damage !== undefined) p.damage = r.damage;

        p.items = {
            "amp": r.item_amp,
            "belt": r.item_belt,
            "boots": r.item_boots,
            "body": r.item_body,
            "pads": r.item_pads,
            "invis": r.item_invis,
            "shp": r.item_shp,
        };

        if(ctfStats[r.player_id] !== undefined){
            p.ctf = ctfStats[r.player_id] 

        }

        data.push(p);
    }

    return data;
}

export async function getPlayersWeaponStatsJSON(id){

}


export async function getMatchesByHashes(hashes){

    if(hashes.length === 0) return {"matches":[], "missing": []};
    if(hashes.length > 1000) throw new Error(`getMatchesByHashes has a limit of 1000 hashes at a time`);

    const query = `SELECT 
    nstats_matches.*,
    nstats_gametypes.name as gametype_name,
    nstats_maps.name as map_name,
    nstats_servers.name as server_name,
    IF(nstats_matches.solo_winner > 0, nstats_players.name, "") as solo_winner_name,
    IF(nstats_matches.solo_winner > 0, nstats_players.country, "") as solo_winner_country
    FROM nstats_matches 
    LEFT JOIN nstats_gametypes ON nstats_gametypes.id = nstats_matches.gametype_id
    LEFT JOIN nstats_maps ON nstats_maps.id = nstats_matches.map_id
    LEFT JOIN nstats_servers ON nstats_servers.id = nstats_matches.server_id
    LEFT JOIN nstats_players ON nstats_players.id = nstats_matches.solo_winner
    WHERE nstats_matches.hash IN(?)
    ORDER BY nstats_matches.date DESC`;

    const result = await simpleQuery(query, [hashes]);

    const missing = [...hashes];

    for(let i = 0; i < result.length; i++){

        const index = missing.indexOf(result[i].hash);
        if(index === -1) continue;
        missing.splice(index, 1);
    }

    return {"matches": result, missing};
}


export async function getMapAndGametypeIds(matchIds){

    if(matchIds.length === 0) return [];

    const query = `SELECT id,gametype_id,map_id FROM nstats_matches WHERE id IN (?)`;

    const result = await simpleQuery(query, [matchIds]);

    const data = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        data[r.id] = {"gametype": r.gametype_id, "map": r.map_id};
    }

    return data;
}


export async function getMatchesPlaytime(matchIds){

    if(matchIds.length === 0) return {};

    const query = `SELECT id,playtime FROM nstats_matches WHERE id IN(?)`;

    const result = await simpleQuery(query, [matchIds]);

    const data = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        data[r.id] = r.playtime;
    }

    return data;
}
//lazy copy past of above
export async function getMatchesGametypes(matchIds){

    if(matchIds.length === 0) return {};

    const query = `SELECT id,gametype_id FROM nstats_matches WHERE id IN(?)`;

    const result = await simpleQuery(query, [matchIds]);

    const data = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        data[r.id] = r.gametype_id;
    }

    return data;
}



export async function deleteMatch(id){
    
    const basicInfo = await getBasicMatchesInfo([id]);
    const playerIds = await getPlayerIdsInMatch(id);

    await simpleQuery(`DELETE FROM nstats_matches WHERE id=?`, [id]);
    await simpleQuery(`DELETE FROM nstats_match_dom WHERE match_id=?`, [id]);
    await simpleQuery(`DELETE FROM nstats_match_players WHERE match_id=?`, [id]);
    await simpleQuery(`DELETE FROM nstats_match_weapon_stats WHERE match_id=?`, [id]);

    await deleteMatchKills(id);
    await deleteMatchDamage(id);
    const ctfRowsDeleted = await ctfDeleteMatch(id);
    

    if(basicInfo[id] !== undefined){

        const basic = basicInfo[id];

        
        if(ctfRowsDeleted > 0){
            await deleteMatchCTFLeague(basic.map_id, basic.gametype_id);
        }

        await gametypeUpdateBasicTotals(basic.gametype_id); 
        await mapUpdateTotals(basic.map_id); 
        await weaponCalcMapWeaponsTotals(basic.map_id); 
        await setPlayerMapAverages(basic.map_id); 
        await rankingRecalculateGametype(basic.gametype_id);
        await rankingRecalculateMap(basic.map_id);

        if(playerIds.length > 0){
            await weaponUpdatePlayerTotals(playerIds);
        }


        
    }

    if(playerIds.length > 0){
        await updatePlayerTotals(playerIds);
    }

}

function _generateAdminGetMatchesWhere(map, gametype, server){

    let string = ``;
    const vars = [];

    if(map !== 0){
        string += `map_id=?`;
        vars.push(map);
    }

    if(gametype !== 0){

        if(string === ""){
            string = `gametype_id=?`;
        }else{
            string += ` AND gametype_id=?`;
        }
        vars.push(gametype);
    }

    if(server !== 0){
        
        if(string === ""){
            string = `server_id=?`;
        }else{
            string += ` AND server_id=?`;
        }
        vars.push(server);
    }

    if(string !== "") string = ` WHERE ${string}`;


    return [string, vars];
}

async function adminGetMatchesTotalMatches(whereString, whereVars){
    
    const query = `SELECT COUNT(*) as total_matches FROM nstats_matches ${whereString}`;

    const result = await simpleQuery(query, whereVars);

    return result[0].total_matches;
}

export async function adminGetMatches(page, perPage, map, gametype, server){

    
    const [whereString, whereVars] =  _generateAdminGetMatchesWhere(map, gametype, server);

    const query = `SELECT id,gametype_id,map_id,server_id,date,playtime,players,total_teams,team_0_score,team_1_score,
    team_2_score,team_3_score,solo_winner,solo_winner_score FROM nstats_matches ${whereString} ORDER BY date DESC, id DESC LIMIT ?, ?`;

    const [cleanPage, cleanPerPage, start] = sanitizePagePerPage(page, perPage);


    const result = await simpleQuery(query, [...whereVars,start, cleanPerPage]);

    const totalMatches = await adminGetMatchesTotalMatches(whereString, whereVars)

    const gametypeIds = new Set();
    const mapIds = new Set();
    const playerIds = new Set();

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        gametypeIds.add(r.gametype_id);
        mapIds.add(r.map_id);

        if(r.solo_winner !== 0){
            playerIds.add(r.solo_winner);
        }
    }

    const gametypeNames = await getGametypeNames([...gametypeIds]);
    const mapNames = await getMapNames([...mapIds]);
    const playerNames = await getPlayerNamesByIds([...playerIds]);
    const serverNames = await getAllNames();


    for(let i = 0; i < result.length; i++){

        const r = result[i];

        r.gametypeName = gametypeNames[r.gametype_id] ?? "Not Found";
        r.mapName = mapNames[r.map_id] ?? "Not Found";
        r.serverName = serverNames[r.server_id] ?? "Not Found";

        if(r.solo_winner !== 0){
            r.soloWinnerName = playerNames[r.solo_winner] ?? "Not Found";
        }
    }

    return {"matches": result, "totalMatches": totalMatches};
}

export async function adminGetMatchLogDetails(id){

    const logQuery = `SELECT file_name,date FROM nstats_logs WHERE match_id=?`;
    const logInfo = await simpleQuery(logQuery, [id]);

    if(logInfo.length > 0) return {"fileName": logInfo[0].file_name, "date": logInfo[0].date};

    return null;
}



export async function getMatchesPlayedCountBetween(startDate, endDate){

    const query = `SELECT id,date,playtime FROM nstats_matches WHERE date>=? AND date<=? ORDER BY date DESC`;

    const result = await simpleQuery(query, [startDate, endDate]);

    return mysqlSetTotalsByDate(result, "date", ["playtime"]);

}


export async function getMatchMapName(matchId){

    const query = `SELECT map_id FROM nstats_matches WHERE id=?`;

    const result = await simpleQuery(query, [matchId]);

    if(result.length === 0) return null;

    return await getNameById(result[0].map_id);
}



export async function getOGImagePlayerMatchData(matchId){

    const playerScores = await getPlayerMatchScores(matchId);

    const playerIds = [...new Set(playerScores.map((p) =>{
        return p.player_id;
    }))];

    const players = await getPlayersById(playerIds);

    for(let i = 0; i < playerScores.length; i++){

        const p = playerScores[i];
        
        if(players[p.player_id] === undefined){
            p.name = "Not Found";
            continue;
        }
        
        p.name = players[p.player_id];
    }

    playerScores.sort((a, b) =>{
        
        a = a.frags;
        b = b.frags;

        if(a < b) return 1;
        if(a < b) return -1;
        return 0;
    });

    return playerScores;
}


export async function getAllMatchesGametypesPlayersTotalTeams(){

    const query = `SELECT id,gametype_id,players,total_teams FROM nstats_matches`;
    
    return await simpleQuery(query);
}


export async function changeMatchGametype(matchId, gametypeId){

    const query = `UPDATE nstats_matches SET gametype_id=? WHERE id=?`;

    await simpleQuery(query, [gametypeId, matchId]);

    const tables = [
        "ctf_caps",
        "ctf_carry_times",
        "damage_match",
        "match_ctf",
        "match_dom",
        "match_players",
        "match_weapon_stats"
    ];

    for(let x = 0; x < tables.length; x++){

        const t = tables[x];

        await simpleQuery(`UPDATE nstats_${t} SET gametype_id=? WHERE match_id=?`, [gametypeId, matchId]);

    }
}


/**
 * Get match id, map_id, gametype_ids of matches played in the past x days
 * @param {*} daysLimit 
 */
export async function getBasicMatchesInfoInPastDays(daysLimit){

    daysLimit = setInt(daysLimit, 28);
    if(daysLimit < 1) daysLimit = 1;

    const query = `SELECT id,map_id,gametype_id FROM nstats_matches WHERE date>=? ORDER BY date DESC`;

    const now = Date.now();
    const minDate = new Date(now - daysLimit * DAY);

    return await simpleQuery(query, [minDate]);
}

/**
 * 
 * @param {*} daysLimit 
 * @returns Unique gametype, map combinations e
 */
export async function getUniqueMapGametypeCombosInPastDays(daysLimit){

    daysLimit = setInt(daysLimit, 28);
    if(daysLimit < 1) daysLimit = 1;

    const validGametypes = await getValidGametypes();
    const validMaps = await getValidMaps();

    const query = `SELECT DISTINCT map_id,gametype_id FROM nstats_matches 
    WHERE date>=? ${(validGametypes.length > 0) ? "AND gametype_id IN(?) " : ""} 
    ${(validMaps.length > 0) ? "AND map_id IN(?)" : ""} 
    GROUP BY map_id,gametype_id`;

    const now = Date.now();
    const minDate = new Date(now - daysLimit * DAY);

    const vars = [minDate];

    if(validGametypes.length > 0){
        vars.push(validGametypes);
    }
    if(validMaps.length > 0){
        vars.push(validMaps);
    }

    return await simpleQuery(query, vars);
    
}

export async function getUniqueGametypesInPastDays(daysLimit){

    daysLimit = setInt(daysLimit, 28);
    if(daysLimit < 1) daysLimit = 1;

    const query = `SELECT DISTINCT gametype_id FROM nstats_matches WHERE date>=?`;

    const now = Date.now();
    const minDate = new Date(now - daysLimit * DAY);

    const validGametypes = await getValidGametypes();

    const result = await simpleQuery(query, [minDate]);

    const data = [];

    for(let i = 0; i < result.length; i++){

        if(validGametypes.indexOf(result[i].gametype_id) !== -1){
            data.push(result[i]);
        }
    }
    return data;
}

export async function getLatestMatchGametypeMapIds(){

    const query = `SELECT gametype_id,map_id FROM nstats_matches ORDER BY date DESC LIMIT 1`;
    const result = await simpleQuery(query);

    if(result.length === 0) return null;

    return {"gametypeId": result[0].gametype_id, "mapId": result[0].map_id};
}



export async function getActivtyHeatMapData(gametypeId, mapId, year, month){

    const {start, end, lastDayOfMonth} = getHeatmapDates(month, year);

    let where = ``;
    const vars = [];

    if(gametypeId != 0){
        where += ` AND gametype_id=?`;
        vars.push(gametypeId);
    }

    if(mapId !== 0){
        where += ` AND map_id=?`;
        vars.push(mapId);
    }

    const query = `SELECT date,playtime,players FROM nstats_matches WHERE date>=? AND date<?${where} ORDER BY date DESC`;
    const result = await simpleQuery(query, [start, end, ...vars]);

    const data = {};

    for(let i = 0; i <= lastDayOfMonth; i++ ){
        data[i] = {"matches": 0, "playtime": 0, "players": 0};
    }
    
    for(let i = 0; i < result.length; i++){

        const r = result[i];
        const currentDate = new Date(r.date);

        const index = currentDate.getDate();
        data[index].matches++;
        data[index].playtime += r.playtime;
        data[index].players += r.players;
    }

    return data;
}


export async function getAllDuplicateMatches(bSkipNames){

    if(bSkipNames === undefined) bSkipNames = false;

    const query = `SELECT 
    hash,
    COUNT(*) as total_matches,
    MAX(id) as latest_id,
    MAX(date) as latest_date
    FROM nstats_matches
    WHERE hash!=""
    GROUP BY hash HAVING total_matches>1 ORDER BY total_matches DESC`;

    const result = await simpleQuery(query);

    if(bSkipNames) return result;

    const matchIds = new Set();

    for(let i = 0; i < result.length; i++){

        const r = result[i];
        matchIds.add(r.latest_id);
    }

    const matchInfo = await getBasicMatchesInfo([...matchIds]);

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        const info = matchInfo?.[r.latest_id];

        r.server_name = info?.server_name ?? "Not Found";
        r.gametype_name = info?.gametype_name ?? "Not Found";
        r.map_name = info?.map_name ?? "Not Found";
    }

    const total = result.reduce((accumulator, match) =>{
        return accumulator + match.total_matches;
    }, 0);

    return {total, "matches": result};

}


async function getDuplicateNonLatestIds(hash, id){

    const query = `SELECT id FROM nstats_matches WHERE hash=? AND id !=?`;

    const result = await simpleQuery(query, [hash, id]);

    return result.map((r) =>{
        return r.id;
    });
}

/**
 * We only want to keep the latest_id and delete all older imports
 */
export async function deleteAllDuplicateMatches(){

    const data = await getAllDuplicateMatches(true);

    for(let i = 0; i < data.length; i++){

        const d = data[i];

        const toDelete = await getDuplicateNonLatestIds(d.hash, d.latest_id);

        for(let x = 0; x < toDelete.length; x++){

            await deleteMatch(toDelete[x]);
            console.log(`deleted matchId ${toDelete[x]}`);
        }
    }
}