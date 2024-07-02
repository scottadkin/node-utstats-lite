import { simpleQuery } from "./database.mjs";
import Message from "./message.mjs";


async function bServerExist(name){

    const query = `SELECT COUNT(*) as total_servers FROM nstats_servers WHERE name=?`;

    const result = await simpleQuery(query, [name]);

    if(result[0].total_servers > 0) return true;

    return false;
}


async function createServer(name, ip, port){

    const query = `INSERT INTO nstats_servers VALUES(NULL,?,?,?,0,0,"1999-11-30 00:00:00","1999-11-30 00:00:00")`;

    const result = await simpleQuery(query, [name, ip, port]);

    return result.insertId;
}

async function getServerId(name){

    const query = `SELECT id FROM nstats_servers WHERE name=?`;

    const result = await simpleQuery(query, [name]);

    if(result.length === 0) return null;

    return result[0].id;
}

export async function updateServer(name, ip, port){

    let serverId = -1;

    if(!await bServerExist(name)){

        new Message(`Server does not exist`,"note");
        serverId = await createServer(name, ip, port);

    }else{

        serverId = await getServerId(name);
    }

    if(serverId === null) throw new Error("Failed to get server id");

    return serverId;
}


export async function getServerNames(ids){

    if(ids.length === 0) return {};

    const query = `SELECT id,name FROM nstats_servers WHERE id IN(?)`;

    const result = await simpleQuery(query, [ids]);

    const data = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];
        data[r.id] = r.name;

    }

    return data;
}


async function createServerTotals(serverId){

    const query = `SELECT COUNT(*) as total_matches, MIN(date) as first_match, MAX(date) as last_match, SUM(playtime) as playtime
    FROM nstats_matches WHERE server_id=?`;

    const result = await simpleQuery(query, [serverId]);

    if(result.length === 0) return null;

    return result[0];
}


async function updateTotals(id, totals){

    const query = `UPDATE nstats_servers SET matches=?,playtime=?,first_match=?,last_match=? WHERE id=?`;

    return await simpleQuery(query, [totals.total_matches, totals.playtime, totals.first_match, totals.last_match, id]);
}

export async function updateServerTotals(serverId){

    const totals = await createServerTotals(serverId);

    if(totals === null){
        new Message(`Failed to createServerTotals (servers.updateServerTotals)`,"warning");
        return;
    }

    await updateTotals(serverId, totals);
}


export async function getBasicList(){

    const query = `SELECT * FROM nstats_servers ORDER by NAME ASC`;

    return await simpleQuery(query);
}


export async function getAllNames(){

    const query = `SELECT id,name FROM nstats_servers`;

    const result = await simpleQuery(query);

    const data = {
        "0": "Any"
    };

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        data[r.id] = r.name;
    }

    return data;
}