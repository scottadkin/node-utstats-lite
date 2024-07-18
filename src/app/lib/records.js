import { simpleQuery } from "./database.mjs";
import { getBasicPlayerInfo } from "./players.mjs";
import { getBasicMatchesInfo } from "./matches.mjs";
import { sanitizePagePerPage } from "./generic.mjs";


const VALID_PLAYER_MATCH_TYPES = [
    "score", "frags", "kills", "deaths", "suicides", "spree_best", "multi_best"
];

const VALID_PLAYER_LIFETIME_TYPES = [
    "wins", "score", "frags", "kills", "deaths", "suicides", "spree_5", "multi_4"
];

function bValidPlayerMatchType(type){

    type = type.toLowerCase();

    return VALID_PLAYER_MATCH_TYPES.indexOf(type) !== -1;
}

function bValidPlayerLifetimeType(type){

    type = type.toLowerCase();

    return VALID_PLAYER_LIFETIME_TYPES.indexOf(type) !== -1;
}

export async function getPlayersMatchRecords(type, page, perPage){


    const [cleanPage, cleanPerPage, cleanStart] = sanitizePagePerPage(page, perPage);

    if(!bValidPlayerMatchType(type)) throw new Error(`Not a valid Player Record type!`);

    const query = `SELECT player_id,country,match_id,match_date,${type} as record_type,time_on_server FROM nstats_match_players ORDER BY record_type DESC LIMIT ?, ?`;

    return await simpleQuery(query, [cleanStart, cleanPerPage]);
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


export async function getPlayersLifetimeRecords(type, gametype, page, perPage){

    if(!bValidPlayerLifetimeType(type)) throw new Error("Not a valid player lifetime type");

    const [cleanPage, cleanPerPage, cleanStart] = sanitizePagePerPage(page, perPage);

    const query = `SELECT player_id,last_active,playtime,total_matches,${type} as record_value 
    FROM nstats_player_totals WHERE gametype_id=? ORDER BY record_value DESC LIMIT ?, ?`;

    return await simpleQuery(query, [gametype, cleanStart, cleanPerPage]);
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