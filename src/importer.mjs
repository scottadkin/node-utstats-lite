import { simpleQuery, sqlInsertOnDuplicateUpdate } from "./database.mjs";
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


export async function insertLogDownloadHistory(host, importerId, name, fileSize){

    const t = `nstats_logs_downloads`;

    const date = new Date(Date.now());

    
    const columns = ["file_name", "date", "importer_id", "ftp_ip", "file_size"];
    await sqlInsertOnDuplicateUpdate(t, columns, [[name, date, importerId, host, fileSize]], ["file_name"]);
    //await simpleQuery(query, [name, new Date(Date.now()), importerId, host, fileSize]);
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

    const query = `SELECT id FROM nstats_logs WHERE file_name=? LIMIT 1`;
    const result = await simpleQuery(query, [fileName]);

    if(result.length > 0) return true;

    return false;
}


export async function addPendingUpdates(matchId, seasonId, serverId, gametypeId, mapId, bCTF, bDom, bMH, bAS){

    const query = `INSERT INTO nstats_pending_updates VALUES(NULL,?,?,?,?,?,?,?,?,?)`;

    await simpleQuery(query, [
        matchId, seasonId, serverId, gametypeId, mapId, bCTF, bDom, bMH, bAS
    ]);
}


export async function getAllPendingUpdates(){

    const query = `SELECT DISTINCT COUNT(*) as total_matches,season_id,server_id,gametype_id,map_id,b_ctf,b_dom 
    FROM nstats_pending_updates GROUP BY season_id,server_id,gametype_id,map_id,b_ctf,b_dom`;
    const result = await simpleQuery(query);


    const seasons = new Set();
    //always want all time
    seasons.add(0);
    const ctfGametypes = new Set();
    const ctfMaps = new Set();
    const domGametypes = new Set();
    const domMaps = new Set();
    const maps = new Set();
    const gametypes = new Set();

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        seasons.add(r.season_id);
        maps.add(r.map_id);
        gametypes.add(r.gametype_id);

        if(r.b_ctf){
            ctfGametypes.add(r.gametype_id);
            ctfMaps.add(r.map_id);
        }

        if(r.b_dom){
            domGametypes.add(r.gametype_id);
            domMaps.add(r.map_id);
        }
    }


    return {
        "data": result,
        "maps": [...maps],
        "gametypes": [...gametypes],
        "ctfGametypes": [...ctfGametypes],
        "ctfMaps": [...ctfMaps],
        "domGametypes": [...domGametypes],
        "domMaps": [...domMaps],
        "seasons": [...seasons]
    }
}