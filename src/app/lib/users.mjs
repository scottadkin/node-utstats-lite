import { simpleQuery } from "./database.mjs";

export async function getAllUsers(){

    const query = `SELECT id,name,activated FROM nstats_users`;

    return await simpleQuery(query);
}


async function destoryUserSessions(userId){

    const query = `DELETE FROM nstats_sessions WHERE user=?`;

    await simpleQuery(query, [userId]);
}

export async function adminUpdateUser(id, bActive){

    const query = `UPDATE nstats_users SET activated=? WHERE id=?`;

    await simpleQuery(query, [bActive, id]);
    //logout all user sessions
    await destoryUserSessions(id);
}

