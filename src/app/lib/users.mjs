import { simpleQuery } from "./database.mjs";

export async function getAllUsers(){

    const query = `SELECT id,name,activated FROM nstats_users`;

    return await simpleQuery(query);
}


export async function adminUpdateUser(id, bActive){

    const query = `UPDATE nstats_users SET activated=? WHERE id=?`;

    await simpleQuery(query, [bActive, id]);
}