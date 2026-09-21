import { simpleQuery } from "./database.mjs";

export async function getSeasonByMatchDate(matchDate){

    const query = `SELECT * FROM nstats_season_databases WHERE end_date >=? AND start_date <=? ORDER BY id ASC`;

    const result = await simpleQuery(query, [matchDate, matchDate]);

    if(result.length === 0) return null;
    return result[0];
}