import { simpleQuery } from "./database.mjs";


export async function getImporterNames(){

    const query = `SELECT id,name,host,port FROM nstats_ftp`;

    const result = await simpleQuery(query);

    const data = {
        "-1": {"id": -1, "name": "Logs Folder", "host": "", "port": ""}
    };

    for(let i = 0; i < result.length; i++){

        const r = result[i];
        data[r.id] = r;
    }

    return data;
}

async function getTotalImportHistoryCount(){

    const query = `SELECT COUNT(*) as total_rows FROM nstats_importer_history`;

    const result = await simpleQuery(query);

    return result[0].total_rows;
}

export async function getHistory(page, perPage){

    if(page !== page || perPage !== perPage) throw new Error(`Page and perPage must be valid integers`);
    page--;
    if(page < 0) page = 0;
    if(perPage < 5 || perPage > 100) perPage = 50;
    let start = page * perPage;

    if(start < 0) start = 0;


    const query = `SELECT * FROM nstats_importer_history ORDER BY date DESC LIMIT ?, ?`;

    const result = await simpleQuery(query, [start, perPage]);

    const totals = await getTotalImportHistoryCount();

    return {"data": result, "totals": totals};
}