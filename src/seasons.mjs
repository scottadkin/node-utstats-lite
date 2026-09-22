import { simpleQuery } from "./database.mjs";

export async function getSeasonByMatchDate(matchDate){

    const query = `SELECT * FROM nstats_seasons WHERE end_date >=? AND start_date <=? ORDER BY id ASC`;

    const result = await simpleQuery(query, [matchDate, matchDate]);

    if(result.length === 0) return null;

    return result[0];
}


export async function getAllSeasons(){

    const query = `SELECT * FROM nstats_seasons ORDER BY end_date DESC, start_date DESC`;

    const result = await simpleQuery(query);

    return result;
}



/*export async function getSeasonByMatchDate(matchDate){

    const query = `SELECT * FROM nstats_season_databases WHERE end_date >=? AND start_date <=? ORDER BY id ASC`;

    const result = await simpleQuery(query, [matchDate, matchDate]);

    if(result.length === 0) return null;
    return result[0];
}


export async function getAllSeasons(){

    const query = `SELECT * FROM nstats_season_databases ORDER BY end_date DESC, start_date DESC`

    return await simpleQuery(query);
}

export async function getSeasonByFileName(name){

    const query = `SELECT * FROM nstats_season_databases WHERE file_name=?`;

    const result = await simpleQuery(query, [name]);

    if(result.length > 0) return result[0];

    return null;
}*/