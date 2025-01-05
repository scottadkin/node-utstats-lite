import { simpleQuery } from "./database.mjs";
import Message from "./message.mjs";



async function bGametypeExist(name){

    const query = `SELECT COUNT(*) as total_gametypes FROM nstats_gametypes WHERE name=?`;

    const result = await simpleQuery(query, [name]);

    if(result[0].total_gametypes > 0) return true;

    return false;
}

async function createGametype(name){

    const query = `INSERT INTO nstats_gametypes VALUES(NULL,?,0,0,"1999-11-30 00:00:00","1999-11-30 00:00:00")`;

    const result = await simpleQuery(query, [name]);

    return result.insertId;
}

async function getGametypeId(name){

    const query = `SELECT id FROM nstats_gametypes WHERE name=?`;

    const result = await simpleQuery(query, [name]);

    if(result.length > 0) return result[0].id;

    return null;
}

export async function updateGametype(name){

    let gametypeId = await getGametypeId(name);

    if(gametypeId === null){
        gametypeId = await createGametype(name);
    }
    if(gametypeId === null) throw new Error(`There was a problem getting the gametype id`);

    return gametypeId;
    
}


export async function getGametypeNames(ids){

    if(ids.length === 0) return [];

    const query = `SELECT id,name FROM nstats_gametypes WHERE id IN(?)`;

    const result = await simpleQuery(query, [ids]);

    const data = {
        "0": "All"
    };

    for(let i = 0; i < result.length; i++){

        const r = result[i];
        data[r.id] = r.name;

    }

    return data;
}

async function createTotals(gametypeId){

    const query = `SELECT COUNT(*) as total_matches, MIN(date) as first_match, MAX(date) as last_match, SUM(playtime) as playtime
    FROM nstats_matches WHERE gametype_id=?`;

    const result = await simpleQuery(query, [gametypeId]);

    if(result.length === 0) return null;

    return result[0];
}

async function updateTotals(id, totals){

    const query = `UPDATE nstats_gametypes SET matches=?,playtime=?,first_match=?,last_match=? WHERE id=?`;

    if(totals.first_match === null || totals.last_match === null || totals.playtime === null){
        new Message(`Can't update gametype totals, frist_match,last_match, or playtime are null`,"warning");
        return;
    }

    return await simpleQuery(query, [totals.total_matches, totals.playtime, totals.first_match, totals.last_match, id]);
}

export async function updateBasicTotals(gametypeId){

    const totals = await createTotals(gametypeId);

    if(totals === null){
        new Message(`Failed to create totals (gametypes.updateBasicTotals)`,"warning");
        return;
    }

    await updateTotals(gametypeId, totals);
}


export async function getAll(){

    const query = `SELECT * FROM nstats_gametypes ORDER BY name ASC`;

    return await simpleQuery(query);
}


export async function getAllNames(bReturnArray){

    if(bReturnArray === undefined) bReturnArray = false;

    const result = await simpleQuery(`SELECT id,name FROM nstats_gametypes ORDER BY name ASC`);

    if(bReturnArray) return result;

    const data = {
        "0": "Any"
    };

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        data[r.id] = r.name;
    }

    return data;
}


export async function getAllIds(){

    const query = `SELECT id FROM nstats_gametypes`;

    const result = await simpleQuery(query);

    return result.map((r) =>{
        return r.id;
    });
}


export async function deleteAllPlayerTotals(){

    const query = `DELETE FROM nstats_player_totals`;

    await simpleQuery(query);
}


export async function getLastPlayedGametype(){

    const query = `SELECT gametype_id FROM nstats_matches ORDER BY date DESC LIMIT 1`;

    const result = await simpleQuery(query);

    if(result.length > 0) return result[0].gametype_id;

    return null;
}

