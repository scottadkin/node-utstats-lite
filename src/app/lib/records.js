import { simpleQuery } from "./database.mjs";
import { getBasicPlayerInfo } from "./players.mjs";
import { getBasicMatchesInfo } from "./matches.mjs";


const VALID_PLAYER_TYPES = [
    "score", "frags", "kills", "deaths", "suicides", "spree_best", "multi_best"
];

function bValidPlayerType(type){

    type = type.toLowerCase();

    return VALID_PLAYER_TYPES.indexOf(type) !== -1;
}

export async function getPlayersMatchRecords(type, page, perPage){

    page = parseInt(page);
    perPage = parseInt(perPage);

    if(page !== page) page = 1;
    page--;
    if(page < 0) page = 0;

    if(perPage !== perPage) perPage = 25;
    if(perPage < 1 || perPage > 100) perPage = 25;

    if(!bValidPlayerType(type)) throw new Error(`Not a valid Player Record type!`);

    let start = page * perPage;
    
    const query = `SELECT player_id,country,match_id,match_date,${type} as record_type,time_on_server FROM nstats_match_players ORDER BY record_type DESC LIMIT ?, ?`;

    return await simpleQuery(query, [start, perPage]);
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
            "Score": scores,
            "Best Spree": sprees,
            "Best Multi Kill": multis,
            "Kill": kills,
            "Death": deaths,
            "Suicide": suicides
        }, 
        "playerData": players, 
        "matchData": matchesInfo};
  
}