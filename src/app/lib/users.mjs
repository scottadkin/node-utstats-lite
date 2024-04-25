import { simpleQuery } from "./database.mjs";

export async function getAllUsers(){

    const query = `SELECT id,name,activated FROM nstats_users`;

    return await simpleQuery(query);
}