import { simpleQuery } from "./database.mjs";
import Message from "./message.mjs";


async function bServerExist(name){

    const query = `SELECT COUNT(*) as total_servers FROM nstats_servers WHERE name=?`;

    const result = await simpleQuery(query, [name]);

    if(result[0].total_servers > 0) return true;

    return false;
}


async function createServer(name, ip, port){

    const query = `INSERT INTO nstats_servers VALUES(NULL,?,?,?)`;

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