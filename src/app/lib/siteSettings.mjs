import { simpleQuery } from "./database.mjs";



export async function getAllSettings(){

    const query = `SELECT * FROM nstats_site_settings`;

    return await simpleQuery(query);
}


async function updateSetting(id, value){

    const query = `UPDATE nstats_site_settings SET setting_value=? WHERE id=?`;

    return await simpleQuery(query, [value, id]);
}

export async function updateSettings(changes){

    if(changes.length === 0) return;

    const messages = [];

    for(let i = 0; i < changes.length; i++){

        const c = changes[i];

        try{
            
            const result = await updateSetting(c.id, c.setting_value);

            if(result.affectedRows > 0){
                messages.push({"type": "pass", "message": `Updated ${c.category} -> ${c.setting_type} successfully".`, "id": c.id});
            }else{
                messages.push({"type": "error", "message": `Failed to update ${c.category} -> ${c.setting_type}, no rows affected.`, "id": c.id});
            }

        }catch(err){
            messages.push({"type": "error", "message": `Failed to update ${c.category} -> ${c.setting_type}, ${err.toString()}`, "id": c.id});
        }
    }
    
    return messages;
}


export async function bSettingExist(category, name){

    const query = `SELECT COUNT(*) as total_rows FROM nstats_site_settings WHERE category=? AND setting_name=?`;

    const result = await simpleQuery(query, [category, name]);

    return result[0].total_rows > 0;
}


export async function insertSetting(category, type, name, value){

    const query = `INSERT INTO nstats_site_settings VALUES(NULL,?,?,?,?)`;

    await simpleQuery(query, [category, type, name, value]);
}


export async function getCategorySettings(category){

    const query = `SELECT setting_name,setting_value FROM nstats_site_settings WHERE category=?`;

    const result = await simpleQuery(query, [category]);

    const data = {};


    for(let i = 0; i < result.length; i++){

        const r = result[i];

        data[r.setting_name] = r.setting_value;
    }

    return data;
}