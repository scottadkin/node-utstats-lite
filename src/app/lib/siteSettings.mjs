import { simpleQuery } from "./database.mjs";



export async function getAllSettings(){

    const query = `SELECT * FROM nstats_site_settings`;

    return await simpleQuery(query);
}