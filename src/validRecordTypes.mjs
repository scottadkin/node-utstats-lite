export const VALID_RECORD_MODES = ["player-match", "player-lifetime", "player-epm", "player-avg"];

export const MODE_TITLES = {
    "player-lifetime": "Player Lifetime Records",
    "player-match": "Player Match Records",
    "player-epm": "Player Events Per Minute Records",
    "player-avg": "Player Match Average Records",
};

export const VALID_PLAYER_MATCH_TYPES = [
    {"display": "Score", "value": "max_score", "parse": ["ignore0"], "group": "General"},
    {"display": "Frags", "value": "max_frags", "parse": ["ignore0"], "group": "General"},
    {"display": "Kills", "value": "max_kills", "parse": ["ignore0"], "group": "General"},
    {"display": "Deaths", "value": "max_deaths", "parse": ["ignore0"], "group": "General"},
    {"display": "Suicides", "value": "max_suicides", "parse": ["ignore0"], "group": "General"},
    {"display": "Team Kills", "value": "max_team_kills", "parse": ["ignore0"], "group": "General"},
    {"display": "Playtime", "value": "max_playtime", "parse": ["playtime"], "className": "playtime", "group": "General"},
   // {"display": "TTL", "value": "ttl", "parse": ["playtime"], "className": "playtime", "group": "General"},
    {"display": "Headshots", "value": "max_headshots", "parse": ["ignore0"], "group": "General"},
    {"display": "Flag Taken", "value": "max_flag_taken", "parse": ["ignore0"], "group": "CTF"},
    {"display": "Flag Pickup", "value": "max_flag_pickup", "parse": ["ignore0"], "group": "CTF"},
    {"display": "Flag Drop", "value": "max_flag_drop", "parse": ["ignore0"], "group": "CTF"},
    {"display": "Flag Assist", "value": "max_flag_assist", "parse": ["ignore0"], "group": "CTF"},
    {"display": "Flag Cover", "value": "max_flag_cover", "parse": ["ignore0"], "group": "CTF"},
    {"display": "Flag Seal", "value": "max_flag_seal", "parse": ["ignore0"], "group": "CTF"},
    {"display": "Flag Capture", "value": "max_flag_cap", "parse": ["ignore0"], "group": "CTF"},
    {"display": "Flag Kill", "value": "max_flag_kill", "parse": ["ignore0"], "group": "CTF"},
    {"display": "Flag Return", "value": "max_flag_return", "parse": ["ignore0"], "group": "CTF"},
    {"display": "Flag Return Home Base", "value": "max_flag_return_base", "parse": ["ignore0"], "group": "CTF"},
    {"display": "Flag Return Mid", "value": "max_flag_return_mid", "parse": ["ignore0"], "group": "CTF"},
    {"display": "Flag Return Enemy Base", "value": "max_flag_return_enemy_base", "parse": ["ignore0"], "group": "CTF"},
    {"display": "Flag Return Save", "value": "max_flag_return_save", "parse": ["ignore0"], "group": "CTF"},
    {"display": "Best Spree", "value": "max_spree_best", "parse": ["ignore0"], "group": "Sprees"},
    {"display": "Killing Spree", "value": "max_spree_1", "parse": ["ignore0"], "group": "Sprees"},
    {"display": "Rampage", "value": "max_spree_2", "parse": ["ignore0"], "group": "Sprees"},
    {"display": "Dominating", "value": "max_spree_3", "parse": ["ignore0"], "group": "Sprees"},
    {"display": "Unstoppable", "value": "max_spree_4", "parse": ["ignore0"], "group": "Sprees"},
    {"display": "Godlike", "value": "max_spree_5", "parse": ["ignore0"], "group": "Sprees"},
    {"display": "Best Multi Kill", "value": "max_multi_best", "parse": ["ignore0"], "group": "Multi Kills"},
    {"display": "Double Kill", "value": "max_multi_1", "parse": ["ignore0"], "group": "Multi Kills"},
    {"display": "Multi Kill", "value": "max_multi_2", "parse": ["ignore0"], "group": "Multi Kills"},
    {"display": "Ultra Kill", "value": "max_multi_3", "parse": ["ignore0"], "group": "Multi Kills"},
    {"display": "Monster Kill", "value": "max_multi_4", "parse": ["ignore0"], "group": "Multi Kills"},
    {"display": "UDamage", "value": "max_item_amp", "parse": ["ignore0"], "group": "Items"},
    {"display": "Invisibility", "value": "max_item_invis", "parse": ["ignore0"], "group": "Items"},
    {"display": "Shield Belt", "value": "max_item_belt", "parse": ["ignore0"], "group": "Items"},
    {"display": "Super Health", "value": "max_item_shp", "parse": ["ignore0"], "group": "Items"},
    {"display": "Body Armor", "value": "max_item_body", "parse": ["ignore0"], "group": "Items"},
    {"display": "Thigh Pads", "value": "max_item_pads", "parse": ["ignore0"], "group": "Items"},
    {"display": "Jump Boots", "value": "max_item_boots", "parse": ["ignore0"], "group": "Items"},
    
];

export const VALID_PLAYER_LIFETIME_TYPES = [
    {"display": "Wins", "value": "wins", "parse": ["ignore0"], "group": "General"},
    {"display": "Draws", "value": "draws", "parse": ["ignore0"], "group": "General"},
    {"display": "Losses", "value": "losses", "parse": ["ignore0"], "group": "General"},
    {"display": "WinRate", "value": "winrate", "parse": [], "group": "General"},
    {"display": "Score", "value": "score", "parse": ["ignore0"], "group": "General"},
    {"display": "Frags", "value": "frags", "parse": ["ignore0"], "group": "General"},
    {"display": "Kills", "value": "kills", "parse": ["ignore0"], "group": "General"},
    {"display": "Deaths", "value": "deaths", "parse": ["ignore0"], "group": "General"},
    {"display": "Suicides", "value": "suicides", "parse": ["ignore0"], "group": "General"},
    {"display": "Team Kills", "value": "team_kills", "parse": ["ignore0"], "group": "General"},
    {"display": "Playtime", "value": "playtime", "parse": ["playtime"], "className": "playtime", "group": "General"},
    {"display": "Headshots", "value": "headshots", "parse": ["ignore0"], "group": "General"},
    {"display": "First Bloods", "value": "first_blood", "parse": ["ignore0"], "group": "General"},
    {"display": "Flag Taken", "value": "flag_taken", "group": "CTF"},
    {"display": "Flag Pickup", "value": "flag_pickup", "group": "CTF"},
    {"display": "Flag Drop", "value": "flag_drop", "group": "CTF"},
    {"display": "Flag Assist", "value": "flag_assist", "group": "CTF"},
    {"display": "Flag Cover", "value": "flag_cover", "group": "CTF"},
    {"display": "Flag Seal", "value": "flag_seal", "group": "CTF"},
    {"display": "Flag Capture", "value": "flag_cap", "group": "CTF"},
    {"display": "Flag Kill", "value": "flag_kill", "group": "CTF"},
    {"display": "Flag Return", "value": "flag_return", "group": "CTF"},
    {"display": "Flag Return Home Base", "value": "flag_return_base", "group": "CTF"},
    {"display": "Flag Return Mid", "value": "flag_return_mid", "group": "CTF"},
    {"display": "Flag Return Enemy Base", "value": "flag_return_enemy_base", "group": "CTF"},
    {"display": "Flag Return Close Save", "value": "flag_return_save", "group": "CTF"},
    {"display": "Best Single Spree", "value": "spree_best", "parse": ["ignore0"], "group": "Sprees"},
    {"display": "Killing Sprees", "value": "spree_1", "parse": ["ignore0"], "group": "Sprees"},
    {"display": "Rampages", "value": "spree_2", "parse": ["ignore0"], "group": "Sprees"},
    {"display": "Dominatings", "value": "spree_3", "parse": ["ignore0"], "group": "Sprees"},
    {"display": "Unstoppables", "value": "spree_4", "parse": ["ignore0"], "group": "Sprees"},
    {"display": "Godlikes", "value": "spree_5", "parse": ["ignore0"], "group": "Sprees"},
    {"display": "Best Single Multi Kill", "value": "multi_best", "parse": ["ignore0"], "group": "Multis"},
    {"display": "Double Kills", "value": "multi_1", "parse": ["ignore0"], "group": "Multis"},
    {"display": "Multi Kills", "value": "multi_2", "parse": ["ignore0"], "group": "Multis"},
    {"display": "Ultra Kills", "value": "multi_3", "parse": ["ignore0"], "group": "Multis"},
    {"display": "Monster Kills", "value": "multi_4", "parse": ["ignore0"], "group": "Multis"},
    {"display": "UDamage", "value": "item_amp", "parse": ["ignore0"], "group": "Items"},
    {"display": "Shield Belt", "value": "item_belt", "parse": ["ignore0"], "group": "Items"},
    {"display": "Jump Boots", "value": "item_boots", "parse": ["ignore0"], "group": "Items"},
    {"display": "Body Armour", "value": "item_body", "parse": ["ignore0"], "group": "Items"},
    {"display": "Thigh Pads", "value": "item_pads", "parse": ["ignore0"], "group": "Items"},
    {"display": "Invisibility", "value": "item_invis", "parse": ["ignore0"], "group": "Items"},
    {"display": "Super Health", "value": "item_shp", "parse": ["ignore0"], "group": "Items"},
];


export const VALID_PLAYER_EPM_TYPES = [
    {"display": "Score", "value": "epm_score", "group": "General"},
    {"display": "Frags", "value": "epm_frags", "group": "General"},
    {"display": "Kills", "value": "epm_kills", "group": "General"},
    {"display": "Deaths", "value": "epm_deaths", "group": "General"},
    {"display": "Suicides", "value": "epm_suicides", "group": "General"},
    {"display": "Team Kills", "value": "epm_team_kills", "group": "General"},
    {"display": "Headshots", "value": "epm_headshots", "group": "General"},
    {"display": "Flag Taken", "value": "epm_flag_taken", "group": "CTF"},
    {"display": "Flag Pickup", "value": "epm_flag_pickup", "group": "CTF"},
    {"display": "Flag Drop", "value": "epm_flag_drop", "group": "CTF"},
    {"display": "Flag Assist", "value": "epm_flag_assist", "group": "CTF"},
    {"display": "Flag Cover", "value": "epm_flag_cover", "group": "CTF"},
    {"display": "Flag Seal", "value": "epm_flag_seal", "group": "CTF"},
    {"display": "Flag Capture", "value": "epm_flag_cap", "group": "CTF"},
    {"display": "Flag Kill", "value": "epm_flag_kill", "group": "CTF"},
    {"display": "Flag Return", "value": "epm_flag_return", "group": "CTF"},
    {"display": "Flag Return Home Base", "value": "epm_flag_return_base", "group": "CTF"},
    {"display": "Flag Return Mid", "value": "epm_flag_return_mid", "group": "CTF"},
    {"display": "Flag Return Enemy Base", "value": "epm_flag_return_enemy_base", "group": "CTF"},
    {"display": "Flag Return Close Save", "value": "epm_flag_return_save", "group": "CTF"},
    {"display": "Killing Sprees", "value": "epm_spree_1", "group": "Sprees"},
    {"display": "Rampages", "value": "epm_spree_2", "group": "Sprees"},
    {"display": "Dominatings", "value": "epm_spree_3", "group": "Sprees"},
    {"display": "Unstoppables", "value": "epm_spree_4", "group": "Sprees"},
    {"display": "Godlikes", "value": "epm_spree_5", "group": "Sprees"},
    {"display": "Double Kills", "value": "epm_multi_1", "group": "Multis"},
    {"display": "Multi Kills", "value": "epm_multi_2", "group": "Multis"},
    {"display": "Ultra Kills", "value": "epm_multi_3", "group": "Multis"},
    {"display": "Monster Kills", "value": "epm_multi_4", "group": "Multis"},
    {"display": "UDamage", "value": "epm_item_amp", "group": "Items"},
    {"display": "Shield Belt", "value": "epm_item_belt", "group": "Items"},
    {"display": "Jump Boots", "value": "epm_item_boots", "group": "Items"},
    {"display": "Body Armour", "value": "epm_item_body", "group": "Items"},
    {"display": "Thigh Pads", "value": "epm_item_pads", "group": "Items"},
    {"display": "Invisibility", "value": "epm_item_invis", "group": "Items"},
    {"display": "Super Health", "value": "epm_item_shp", "group": "Items"},
];


export const VALID_PLAYER_MATCH_AVG_TYPES = [
    {"display": "Score", "value": "avg_score", "group": "General"},
    {"display": "Frags", "value": "avg_frags", "group": "General"},
    {"display": "Kills", "value": "avg_kills", "group": "General"},
    {"display": "Deaths", "value": "avg_deaths", "group": "General"},
    {"display": "Suicides", "value": "avg_suicides", "group": "General"},
    {"display": "Team Kills", "value": "avg_team_kills", "group": "General"},
    {"display": "Headshots", "value": "avg_headshots", "group": "General"},
    {"display": "Flag Taken", "value": "avg_flag_taken", "group": "CTF"},
    {"display": "Flag Pickup", "value": "avg_flag_pickup", "group": "CTF"},
    {"display": "Flag Drop", "value": "avg_flag_drop", "group": "CTF"},
    {"display": "Flag Assist", "value": "avg_flag_assist", "group": "CTF"},
    {"display": "Flag Cover", "value": "avg_flag_cover", "group": "CTF"},
    {"display": "Flag Seal", "value": "avg_flag_seal", "group": "CTF"},
    {"display": "Flag Capture", "value": "avg_flag_cap", "group": "CTF"},
    {"display": "Flag Kill", "value": "avg_flag_kill", "group": "CTF"},
    {"display": "Flag Return", "value": "avg_flag_return", "group": "CTF"},
    {"display": "Flag Return Home Base", "value": "avg_flag_return_base", "group": "CTF"},
    {"display": "Flag Return Mid", "value": "avg_flag_return_mid", "group": "CTF"},
    {"display": "Flag Return Enemy Base", "value": "avg_flag_return_enemy_base", "group": "CTF"},
    {"display": "Flag Return Close Save", "value": "avg_flag_return_save", "group": "CTF"},
    {"display": "Best Average Spree", "value": "avg_spree_best", "group": "Sprees"},
    {"display": "Killing Sprees", "value": "avg_spree_1", "group": "Sprees"},
    {"display": "Rampages", "value": "avg_spree_2", "group": "Sprees"},
    {"display": "Dominatings", "value": "avg_spree_3", "group": "Sprees"},
    {"display": "Unstoppables", "value": "avg_spree_4", "group": "Sprees"},
    {"display": "Godlikes", "value": "avg_spree_5", "group": "Sprees"},
    {"display": "Best Average Multi Kill", "value": "avg_multi_best", "group": "Multis"},
    {"display": "Double Kills", "value": "avg_multi_1", "group": "Multis"},
    {"display": "Multi Kills", "value": "avg_multi_2", "group": "Multis"},
    {"display": "Ultra Kills", "value": "avg_multi_3", "group": "Multis"},
    {"display": "Monster Kills", "value": "avg_multi_4", "group": "Multis"},
    {"display": "UDamage", "value": "avg_item_amp", "group": "Items"},
    {"display": "Shield Belt", "value": "avg_item_belt", "group": "Items"},
    {"display": "Jump Boots", "value": "avg_item_boots", "group": "Items"},
    {"display": "Body Armour", "value": "avg_item_body", "group": "Items"},
    {"display": "Thigh Pads", "value": "avg_item_pads", "group": "Items"},
    {"display": "Invisibility", "value": "avg_item_invis", "group": "Items"},
    {"display": "Super Health", "value": "avg_item_shp", "group": "Items"},
];


/**
 * return a valid record mode
 * @param {string} mode 
 * @returns string
 */
export function sanitizeRecordMode(mode){

    mode = mode.toLowerCase();

    if(VALID_RECORD_MODES.indexOf(mode) === -1){
        return "player-match";
    }

    return mode;
}
/**
 * 
 * @param {string} mode Record Mode 
 * @param {string} recordType e.g score
 * @returns {string} valid recordType for matching method, or score if none found.
 */
export function sanitizeRecordType(mode, recordType){


    mode = mode.toLowerCase();
    recordType = recordType.toLowerCase();

    if(bValidRecordType(mode, recordType)){
        return recordType;
    }

    if(mode === "player-match"){
        return "max_score";
    }else if(mode === "player-lifetime"){
        return "wins";
    }else if(mode === "player-epm"){
        return "epm_score";
    }else if(mode === "player-avg"){
        return "avg_score";
    }

    return "score";

}

/**
 * 
 * @param {string} mode 
 * @returns All available record types
 */
export function getRecordTypes(mode){

    mode = mode.toLowerCase();

    if(mode === "player-match"){

        return VALID_PLAYER_MATCH_TYPES;

    }else if(mode === "player-lifetime"){

        return VALID_PLAYER_LIFETIME_TYPES;

    }else if(mode === "player-epm"){
        return VALID_PLAYER_EPM_TYPES;
    }else if(mode === "player-avg"){
        return VALID_PLAYER_MATCH_AVG_TYPES;
    }

    throw new Error(`${mode} is not a valid record mode`);   
}

export function bValidRecordMode(mode){

    mode = mode.toLowerCase();

    if(VALID_RECORD_MODES.indexOf(mode) === -1) return false;

    return true;
}

export function bValidRecordType(mode, cat){

    mode = mode.toLowerCase();
    cat = cat.toLowerCase();

    const types = getRecordTypes(mode);

    for(let i = 0; i < types.length; i++){

        if(types[i].value === cat) return true;
    }

    return false;

}


export function getRecordTypeInfo(mode, targetType){

    mode = mode.toLowerCase();
    targetType = targetType.toLowerCase();

    if(VALID_RECORD_MODES.indexOf(mode) === -1) return null;

    let options = getRecordTypes(mode);

    for(let i = 0; i < options.length; i++){

        const o = options[i];

        if(targetType === o.value) return o;
    }

    return null;
}

export function getTypeDisplayName(mode, cat){

    mode = mode.toLowerCase();
    cat = cat.toLowerCase();

    let types = getRecordTypes(mode);

    for(let i = 0; i < types.length; i++){

        const t = types[i];

        if(t.value === cat) return t.display;
    }

    return null;
}

export function bValidPlayerMatchType(type){

    type = type.toLowerCase();

    for(let i = 0; i < VALID_PLAYER_MATCH_TYPES.length; i++){

        const v = VALID_PLAYER_MATCH_TYPES[i];

        if(v.value === type) return true;
    }

    return false;

}

export function bValidPlayerLifetimeType(type){

    type = type.toLowerCase();

    for(let i = 0; i < VALID_PLAYER_LIFETIME_TYPES.length; i++){

        const v = VALID_PLAYER_LIFETIME_TYPES[i];
        
        if(v.value === type) return true;
    }

    return false;

}