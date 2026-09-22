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


async function getSeasonConflicts(startDate, endDate){


    const query = `SELECT * FROM nstats_seasons WHERE start_date>=? AND end_date<=?`;

    return await simpleQuery(query, [startDate, endDate]);
}


async function bSeasonNameExists(name){

    const query = `SELECT COUNT(*) as total_rows FROM nstats_seasons WHERE name=?`;

    const result = await simpleQuery(query, [name]);

    return result[0].total_rows !== 0;
}

export async function createSeason(name, startDate, endDate){

    if(name === "") throw new Error("Season name can't be an empty string.");
    
    const test = await getSeasonConflicts(startDate, endDate);

    console.log(test);

    const bNameAlreadyInUse = await bSeasonNameExists(name);

    if(bNameAlreadyInUse) throw new Error(`There is already a season called ${name}`);

    const query = `INSERT INTO nstats_seasons VALUES(NULL,?,?,?)`;

    await simpleQuery(query, [name, startDate, endDate]);

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