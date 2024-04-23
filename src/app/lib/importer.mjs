import { simpleQuery } from "./database.mjs";


export async function getHistory(page, perPage){


    if(page !== page || perPage !== perPage) throw new Error(`Page and perPage must be valid integers`);
    page--;
    if(page < 0) page = 0;
    if(perPage < 5 || perPage > 100) perPage = 50;
    let start = page * perPage;

    if(start < 0) start = 0;

    const query = `SELECT * FROM nstats_importer_history ORDER BY date DESC LIMIT ?, ?`;

    return await simpleQuery(query, [start, perPage]);
}