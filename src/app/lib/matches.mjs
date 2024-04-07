import {simpleQuery} from "./database.mjs";
import {getMapNames} from "./map.mjs";
import { getGametypeNames } from "./gametypes.mjs";
import { getServerNames } from "./servers.mjs";


export async function createMatch(serverId, gametypeId, mapId, bHardcore, bInsta, date, playtime, players, totalTeams, team0Scores, team1Scores, 
    team2Scores, team3Score, soloWinner, soloWinnerScore){

    const query = `INSERT INTO nstats_matches VALUES(NULL,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

    const vars = [serverId, gametypeId, mapId, bHardcore, bInsta, date, playtime, players, totalTeams, team0Scores, team1Scores, team2Scores, team3Score, soloWinner, soloWinnerScore];

    const result = await simpleQuery(query, vars);

    if(result.insertId !== undefined) return result.insertId;

    return null;
}


/**
 * Get the names for all serverIds, gametypeIds, mapIds that are in the supplied matches
 */
async function setMatchTypeNames(matches){

    const serverIds = new Set();
    const gametypeIds = new Set();
    const mapIds = new Set();


    for(let i = 0; i < matches.length; i++){

        const m = matches[i];

        serverIds.add(m.server_id);
        gametypeIds.add(m.gametype_id);
        mapIds.add(m.map_id);
    }

    const mapNames = await getMapNames([...mapIds]);
    const gametypeNames = await getGametypeNames([...gametypeIds]);
    const serverNames = await getServerNames([...serverIds]);

    return {
        mapNames,
        gametypeNames,
        serverNames
    }

}

export async function getRecentMatches(page, perPage){

    const DEFAULT_PER_PAGE = 25;

    if(perPage === undefined){
        perPage = DEFAULT_PER_PAGE;
    }else{
        perPage = parseInt(perPage);
        if(perPage !== perPage) perPage = DEFAULT_PER_PAGE;
    }

    page = parseInt(page);

    if(page !== page){
        page = 1;
    }

    page = 0;

    let start = page * perPage;
    if(start < 0) start = 0;

    const query = `SELECT * FROM nstats_matches ORDER BY date DESC LIMIT ?, ?`;

    const result = await simpleQuery(query, [start, perPage]);


    const {mapNames, gametypeNames, serverNames} = await setMatchTypeNames(result);

    console.log(mapNames, gametypeNames, serverNames);

}