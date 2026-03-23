import { simpleQuery } from "./database.mjs";

/**
 * 
 * @param {*} data JSON 
 * @param {*} key key to add
 * @param {*} bLast if not bLast add key as an empty JSON object if key doesn't exist
 * @param {*} value only gets set if bLast is true
 * @returns 
 */
function JSONSetSubKey(data, key, bLast, value){

    if(bLast){
        data[key] = value;
        return;
    }

    if(data[key] === undefined) data[key] = {};
}

/**
 * 
 * @param {*} data JSON
 * @returns replaces all mysql column name keys with the JSONAPI ones
 */
export function toJSONAPIKeyNames(data, overrideDefaults){

    const toChange = {
        "player_id": "id",
        "flag_pickup": "flagPickup",
        "flag_drop": "flagDrop",
        "flag_assist": "flagAssist",
        "flag_cover": "flagCover",
        "flag_seal": "flagSeal",
        "flag_taken": "flagTaken",
        "flag_kill": "flagKill",
        "flag_cap": "flagCapture",
        "flag_return": "flagReturn",
        "times_held": "flagTotalTimesHeld",
        "flag_return_base": ["returnTypes", "base"],
        "flag_return_mid": ["returnTypes", "mid"],
        "flag_return_enemy_base": ["returnTypes", "enemyBase"],
        "flag_return_save": ["returnTypes", "closeSave"],
        "flag_carry_time": ["flagCarryTime", "total"],
        "flag_carry_time_min": ["flagCarryTime", "min"],
        "flag_carry_time_max": ["flagCarryTime", "max"],
        "flag_carry_time_avg": ["flagCarryTime", "average"],
        "flag_team": "flagTeam",
        "taken_player_id": "takenPlayerId",
        "cap_player_id": "capPlayerId",
        "capping_team": "capTeam",
        "cap_type": "capType",
        "taken_timestamp": "takenTimestamp",
        "taken_player": "takenPlayer",
        "cap_timestamp": "cappedTimestamp",
        "cap_player": "capPlayer",
        "cap_time": "capTime",
        "carry_time": "carryTime",
        "drop_time": "droppedTime",
        "total_drops": "drops",
        "total_covers": "covers",
        "unique_carriers": "uniqueCarriers",
        "start_timestamp": "startTimestamp",
        "end_timestamp": "endTimestamp",
        "red_kills": ["kills", "red"],
        "blue_kills": ["kills", "blue"],
        "green_kills": ["kills", "green"],
        "yellow_kills": ["kills", "yellow"],
        "red_suicides": ["suicides", "red"],
        "blue_suicides": ["suicides", "blue"],
        "green_suicides": ["suicides", "green"],
        "yellow_suicides": ["suicides", "yellow"],
    };

    if(overrideDefaults !== undefined){

        for(const [key, value] of Object.entries(overrideDefaults)){

            toChange[key] = value;
        }
    }


    for(const key of Object.keys(data)){

        
        if(toChange[key] === undefined) continue;

        const value = data[key];
        let newKey;

        if(!Array.isArray(toChange[key])){

            newKey = toChange[key];
            data[newKey] = value;
            delete data[key];
            continue;
        }

        const totalElements = toChange[key].length;

        newKey = toChange[key][0]
        
        let subData = data;

        for(let i = 0; i < totalElements; i++){

            const subKey = toChange[key][i];
            JSONSetSubKey(subData, subKey, i === totalElements -1, value);
            subData = subData[subKey]

        }

        delete data[key];
    
    }

    return data;
}


export async function loadAllJSONSettings(){

    const query = `SELECT * FROM nstats_json_api ORDER BY category ASC, setting_name ASC`;

    return await simpleQuery(query);

    const settings = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        if(settings[r.category] === undefined) settings[r.category] = [];

        settings[r.category].push(r);
    }

    return settings;
}


export async function saveJSONAPIChanges(changes){

    if(changes.length === 0) return;

    const query = `UPDATE nstats_json_api SET setting_value=? WHERE id=?`;

    const queries = [];

    for(let i = 0; i < changes.length; i++){

        const {id, value} = changes[i];
        queries.push(await simpleQuery(query, [value, id]));     
    }

    try{

        await Promise.all(queries);
        return {"message": "passed"};

    }catch(err){
        console.trace(err);
        return {"error": "err.toString()"};
    }
}

export async function bJSONApiEnabled(category){

    const query = `SELECT setting_value FROM nstats_json_api WHERE setting_name="Enable JSON API" AND category=?`;

    const result = await simpleQuery(query, [category]);

    if(result.length === 0){
        throw new Error(`You are missing a setting for the JSON api, JSON api is disabled until that setting is restored.`);
    }

    return result[0].setting_value === "1";
}