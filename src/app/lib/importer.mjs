import { simpleQuery } from "./database.mjs";
import { sanitizePagePerPage } from "./generic.mjs";


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

    const [cleanPage, cleanPerPage, start] = sanitizePagePerPage(page, perPage);

    const query = `SELECT * FROM nstats_importer_history ORDER BY date DESC LIMIT ?, ?`;

    const result = await simpleQuery(query, [start, cleanPerPage]);

    const totals = await getTotalImportHistoryCount();

    return {"data": result, "totals": totals};
}


async function getRejectedLogsCount(){

    const query = `SELECT COUNT(*) as total_rows FROM nstats_logs_rejected`;

    const result = await simpleQuery(query);

    return result[0].total_rows;
}

export async function getRejectedHistory(page, perPage){

    const [cleanPage, cleanPerPage, start] = sanitizePagePerPage(page, perPage);

    const query = `SELECT * FROM nstats_logs_rejected ORDER BY date DESC LIMIT ?, ?`;

    const result = await simpleQuery(query, [start, cleanPerPage]);

    const totals = await getRejectedLogsCount();

    return {"data": result, "totals": totals};
}

async function getLogsCount(){

    const query = `SELECT COUNT(*) as total_rows FROM nstats_logs`;

    const result = await simpleQuery(query);

    return result[0].total_rows;
}

export async function getLogImportHistory(page, perPage){

    const [cleanPage, cleanPerPage, start] = sanitizePagePerPage(page, perPage);

    const query = `SELECT * FROM nstats_logs ORDER BY date DESC LIMIT ?, ?`;

    const result = await simpleQuery(query, [start, cleanPerPage]);

    const totals = await getLogsCount();

    return {"data": result, "totals": totals}
}

export async function bLogAlreadyImported(fileName){

    fileName = fileName.toLowerCase();

    const query = `SELECT COUNT(*) as total_logs FROM nstats_logs WHERE file_name=?`;
    const result = await simpleQuery(query, [fileName]);

    if(result[0].total_logs > 0) return true;

    return false;
}
