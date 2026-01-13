import { simpleQuery } from "./database.mjs";
import { getBasicPlayerInfo } from "./players.mjs";
import { getBasicMatchesInfo } from "./matches.mjs";
import { sanitizePagePerPage } from "./generic.mjs";
import { VALID_PLAYER_MATCH_TYPES, VALID_PLAYER_LIFETIME_TYPES } from "./validRecordTypes.mjs";

function bValidPlayerMatchType(type){

    type = type.toLowerCase();

    for(let i = 0; i < VALID_PLAYER_MATCH_TYPES.length; i++){

        const v = VALID_PLAYER_MATCH_TYPES[i];

        if(v.value === type) return true;
    }

    return false;

}

function bValidPlayerLifetimeType(type){

    type = type.toLowerCase();

    for(let i = 0; i < VALID_PLAYER_LIFETIME_TYPES.length; i++){

        const v = VALID_PLAYER_LIFETIME_TYPES[i];
        
        if(v.value === type) return true;
    }

    return false;

}


export async function getTotalMatchRecords(gametype){

    const query = `SELECT COUNT(*) as total_rows FROM nstats_match_players WHERE time_on_server>0 ${(gametype !== -1) ? "AND gametype_id=?" : ""}`;
    const vars = [];
    if(gametype !== -1) vars.push(gametype);

    const result = await simpleQuery(query, vars);

    if(result.length > 0) return result[0].total_rows;

    return 0;
}

export async function getTotalLifetimeRecords(gametype){

    if(gametype === -1) gametype  = 0;

    const query = `SELECT COUNT(*) as total_rows FROM nstats_player_totals WHERE playtime>0 AND gametype_id=?`;

    const vars = [gametype];

   

    const result = await simpleQuery(query, vars);

    if(result.length > 0) return result[0].total_rows;

    return 0;
}

/**
 * 
 * @param {*} type 
 * @param {*} page 
 * @param {*} perPage 
 * @param {*} bOnlyRecords set to false if you want player,map,gametype,server details
 * @returns 
 */
export async function getPlayersMatchRecords(type, gametype, page, perPage, bOnlyRecords){

    if(bOnlyRecords === undefined) bOnlyRecords = true;

    const [cleanPage, cleanPerPage, cleanStart] = sanitizePagePerPage(page, perPage);

    if(!bValidPlayerMatchType(type)) throw new Error(`Not a valid Player Record type!`);
    
    const query = `SELECT nstats_match_players.player_id,
    nstats_match_players.country,
    nstats_match_players.match_id,
    nstats_match_players.match_date,
    nstats_match_players.${type} as record_type,
    nstats_match_players.time_on_server,
    nstats_players.name as player_name,
    nstats_players.country as player_country 
    FROM nstats_match_players 
    LEFT JOIN nstats_players ON nstats_players.id = nstats_match_players.player_id
    WHERE nstats_match_players.time_on_server>0
     ${(gametype != -1) ? "AND nstats_match_players.gametype_id=?" : ""}
     ORDER BY record_type DESC LIMIT ?, ?`;

    const vars = [cleanStart, cleanPerPage];

    if(gametype != -1){
        vars.unshift(gametype);
    }
    const result = await simpleQuery(query, vars);

    if(bOnlyRecords) return result;

   // const playerIds = new Set();
    const matchIds = new Set();

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        matchIds.add(r.match_id);
    }

    const matchesInfo = await getBasicMatchesInfo([...matchIds]);

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        if(matchesInfo[r.match_id] === undefined){

            r.server_name = "Not Found";
            r.gametype_name = "Not Found";
            r.map_name = "Not Found";
            continue;
        }

        r.server_name = matchesInfo[r.match_id].serverName;
        r.gametype_name = matchesInfo[r.match_id].gametypeName;
        r.map_name = matchesInfo[r.match_id].mapName;


    }

    return result;
}


export async function getDefaultMatchLists(){

    const perPage = 5;

    const scores = await getPlayersMatchRecords("score", 1, perPage);
    const kills = await getPlayersMatchRecords("kills", 1, perPage);
    const multis = await getPlayersMatchRecords("multi_best", 1, perPage);
    const sprees = await getPlayersMatchRecords("spree_best", 1, perPage);
    const deaths = await getPlayersMatchRecords("deaths", 1, perPage);
    const suicides = await getPlayersMatchRecords("suicides", 1, perPage);

    const allData = [...scores, ...kills, ...sprees, ...deaths, ...suicides, ...multis];

    const playerIds = new Set();
    const matchIds = new Set();

    for(let i = 0; i < allData.length; i++){

        const a = allData[i];

        playerIds.add(a.player_id);
        matchIds.add(a.match_id);
    }

    const players = await getBasicPlayerInfo([...playerIds]);
    const matchesInfo = await getBasicMatchesInfo([...matchIds]);

    return {
        "records": {
            "Highest Score": scores,
            "Most Kills": kills,
            "Most Deaths": deaths,
            "Most Suicides": suicides,
            "Best Spree": sprees,
            "Best Multi Kill": multis,
        }, 
        "playerData": players, 
        "matchData": matchesInfo
    };
}


/**
 * 
 * @param {*} type 
 * @param {*} page 
 * @param {*} perPage 
 * @param {*} bOnlyRecords set to false if you want player,map,gametype,server details
 * @returns 
 */

export async function getPlayersLifetimeRecords(type, gametype, page, perPage, bOnlyRecords){

    //0 is combined totals
    if(gametype == -1) gametype = 0;

    if(bOnlyRecords === undefined) bOnlyRecords = true;

    if(!bValidPlayerLifetimeType(type)) throw new Error("Not a valid player lifetime type");

    const [cleanPage, cleanPerPage, cleanStart] = sanitizePagePerPage(page, perPage);

    let where = ``;
    const vars = [cleanStart, cleanPerPage];

    if(gametype != 0){
        vars.unshift(gametype);
        where = `WHERE nstats_player_totals.gametype_id=? AND nstats_player_totals.playtime>0 AND nstats_player_totals.map_id=0`;
    }else{
        where = `WHERE nstats_player_totals.gametype_id=0 AND nstats_player_totals.playtime>0 AND nstats_player_totals.map_id=0`;
    }

    const query = `SELECT nstats_player_totals.player_id,
    nstats_player_totals.last_active,
    nstats_player_totals.playtime,
    nstats_player_totals.total_matches,
    nstats_player_totals.gametype_id,
    nstats_player_totals.${type} as record_value,
    nstats_players.name as player_name,
    nstats_players.country as player_country 
    FROM nstats_player_totals 
    LEFT JOIN nstats_players ON nstats_players.id = nstats_player_totals.player_id
    ${where} 
    ORDER BY record_value DESC LIMIT ?, ?`;

    const result = await simpleQuery(query, vars);

    //if(bOnlyRecords) return result;

    //const playerIds = [...new Set(result.map((r) =>{
      //  return r.player_id;
    //}))];

    //const playerData = await getBasicPlayerInfo(playerIds);
    return result;
}

export async function getTotalPossibleLifetimeMatches(gametypeId){

    gametypeId = parseInt(gametypeId);
    if(gametypeId !== gametypeId) gametypeId = 0;

    const query = `SELECT COUNT(*) as total_rows FROM nstats_player_totals WHERE playtime>0 AND gametype_id=? AND map_id=0`;

    if(gametypeId === -1) gametypeId = 0;

    const result = await simpleQuery(query, [gametypeId]);

    return result[0].total_rows;
}

export async function getTotalPossibleSingleMatchResults(gametypeId){

    const query = `SELECT COUNT(*) as total_rows FROM nstats_match_players WHERE time_on_server>0`; 
    const vars = [];

    gametypeId = parseInt(gametypeId);
    if(gametypeId !== gametypeId) gametypeId = 0;
    if(gametypeId === -1) gametypeId = 0;

    let where = ``;

    if(gametypeId !== 0){
        vars.push(gametypeId);
        where = ` AND gametype_id=?`;
    }

    const result = await simpleQuery(`${query}${where}`, vars);

    return result[0].total_rows;   
}

export async function getDefaultLifetimeLists(){

    const wins = await getPlayersLifetimeRecords("wins", 0, 1, 5);
    const kills = await getPlayersLifetimeRecords("kills", 0, 1, 5);
    const deaths = await getPlayersLifetimeRecords("deaths", 0, 1, 5);
    const sprees = await getPlayersLifetimeRecords("spree_5", 0, 1, 5);
    const multis = await getPlayersLifetimeRecords("multi_4", 0, 1, 5);

    const allData = [...wins, ...kills, ...deaths, ...sprees, ...multis];

    const playerIds = [...new Set(allData.map((d) =>{
        return d.player_id;
    }))]

    const playerData = await getBasicPlayerInfo(playerIds);

    return {
        "records": {
            "Total Wins": wins,
            "Total Kills": kills,
            "Total Deaths": deaths,
            "Total Godlikes": sprees,
            "Total Monster Kills": multis
        },
        "playerData": playerData
    };
}