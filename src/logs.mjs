import { simpleQuery } from "./database.mjs";

export async function getRejectedLogsInfo(){

    const query = `SELECT * FROM nstats_logs_rejected ORDER BY id DESC`;

    return await simpleQuery(query);
}