import { simpleQuery } from "./database.mjs";


const DEFAULT_PAGE_SETTINGS = [
    {"category": "Matches" ,"type": `perPage`, "name": "Results Per Page", "value": 50},
    {"category": "Players" ,"type": `perPage`, "name": "Results Per Page", "value": 50},
    {"category": "Menu" ,"type": `string`, "name": "Discord URL", "value": ""},
    {"category": "Home" ,"type": `bool`, "name": "Display Welcome Message", "value": 1},
    {"category": "Home" ,"type": `bool`, "name": "Display Social Media", "value": 1},
    {"category": "Home" ,"type": `bool`, "name": "Display Recent Matches", "value": 1},
    {"category": "Home" ,"type": `bool`, "name": "Display Most Played Maps", "value": 1},
    {"category": "Home" ,"type": `bool`, "name": "Display Most Played Gametypes", "value": 1},
    {"category": "Home" ,"type": `bool`, "name": "Display Servers", "value": 1},
    {"category": "Home" ,"type": `integer`, "name": "Total Recent Matches", "value": 3},
    {"category": "Home" ,"type": `integer`, "name": "Total Most Played Maps", "value": 3},
    {"category": "Branding" ,"type": `string`, "name": "Site Name", "value": "Node UTStats Lite"},
    {"category": "Branding" ,"type": `string`, "name": "Description", "value": "Stats based website made for the UTStats-lite mutator."},
    {"category": "Social Media" ,"type": `string`, "name": "External Site", "value": ""},
    {"category": "Social Media" ,"type": `string`, "name": "Discord Link", "value": ""},
    {"category": "Social Media" ,"type": `string`, "name": "Youtube Link", "value": ""},
    {"category": "Social Media" ,"type": `string`, "name": "Twitch Link", "value": ""},
    {"category": "Welcome Message" ,"type": `string`, "name": "Welcome Title", "value": "Welcome to Node UTStats-lite"},
    {"category": "Welcome Message" ,"type": `longtext`, "name": "Welcome Message", "value": "Welcome to Node UTStats-lite, stats tracking website for our Unreal Tournament servers."},
    {"category": "Map" ,"type": `bool`, "name": "Display Basic Summary", "value": 1},
    {"category": "Map" ,"type": `bool`, "name": "Display Recent Matches", "value": 1},

    {"category": "Match" ,"type": `bool`, "name": "Display Basic Info", "value": 1},
    {"category": "Match" ,"type": `bool`, "name": "Display Screenshot", "value": 1},
    {"category": "Match" ,"type": `bool`, "name": "Display Frags", "value": 1},
    {"category": "Match" ,"type": `bool`, "name": "Display CTF", "value": 1},
    {"category": "Match" ,"type": `bool`, "name": "Display DOM", "value": 1},
    {"category": "Match" ,"type": `bool`, "name": "Display Weapons", "value": 1},
    {"category": "Match" ,"type": `bool`, "name": "Display Items", "value": 1},
    {"category": "Match" ,"type": `bool`, "name": "Display Special Events", "value": 1},
    {"category": "Match" ,"type": `bool`, "name": "Display Kills", "value": 1},
    {"category": "Match" ,"type": `bool`, "name": "Display Pings", "value": 1},
    {"category": "Match" ,"type": `bool`, "name": "Display JSON Links", "value": 1},

    {"category": "Player" ,"type": `bool`, "name": "Display Gametype Totals", "value": 1},
    {"category": "Player" ,"type": `bool`, "name": "Display CTF", "value": 1},
    {"category": "Player" ,"type": `bool`, "name": "Display Special Events", "value": 1},
    {"category": "Player" ,"type": `bool`, "name": "Display Weapons", "value": 1},
    {"category": "Player" ,"type": `bool`, "name": "Display Rankings", "value": 1},
    {"category": "Player" ,"type": `bool`, "name": "Display Items", "value": 1},
    {"category": "Player" ,"type": `bool`, "name": "Display Recent Matches", "value": 1},

    {"category": "Nav" ,"type": `bool`, "name": "Display Home", "value": 1},
    {"category": "Nav" ,"type": `bool`, "name": "Display Matches", "value": 1},
    {"category": "Nav" ,"type": `bool`, "name": "Display Players", "value": 1},
    {"category": "Nav" ,"type": `bool`, "name": "Display Rankings", "value": 1},
    {"category": "Nav" ,"type": `bool`, "name": "Display Records", "value": 1},
    {"category": "Nav" ,"type": `bool`, "name": "Display Maps", "value": 1},
    {"category": "Nav" ,"type": `bool`, "name": "Display Admin", "value": 1},
    {"category": "Nav" ,"type": `bool`, "name": "Display Login/Register", "value": 1},
];


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


export async function restoreDefaultSettings(){
    
    for(let i = 0; i < DEFAULT_PAGE_SETTINGS.length; i++){

        const s = DEFAULT_PAGE_SETTINGS[i];

        if(!await bSettingExist(s.category, s.name)){
            await insertSetting(s.category, s.type, s.name, s.value);
        }
    }
}

async function deletePageSettings(page){

    const query = `DELETE FROM nstats_site_settings WHERE category=?`;

    await simpleQuery(query, [page]);
}

export async function restorePageSettings(page){

    page = page.toLowerCase();

    const pending = [];

    await deletePageSettings(page);

    for(let i = 0; i < DEFAULT_PAGE_SETTINGS.length; i++){

        const d = DEFAULT_PAGE_SETTINGS[i];

        const currentPage = d.category.toLowerCase();

        if(currentPage !== page) continue;

        pending.push(d);
    }


    for(let i = 0; i < pending.length; i++){

        const p = pending[i];

        await insertSetting(p.category, p.type, p.name, p.value);
    }
}