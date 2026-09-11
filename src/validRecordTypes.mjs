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


export const VALID_RECORD_MODES = ["player-match", "player-lifetime"];

export const MODE_TITLES = {
    "player-lifetime": "Player Lifetime Records",
    "player-match": "Player Match Records"
};

export function bValidRecordType(mode, cat){

    mode = mode.toLowerCase();
    cat = cat.toLowerCase();

    let types = null;

    if(mode === "player-match"){

        types = VALID_PLAYER_MATCH_TYPES.map((t) =>{
            return t.value;
        });

    }else if(mode === "player-lifetime"){

        types = VALID_PLAYER_LIFETIME_TYPES.map((t) =>{
            return t.value;
        });

    }else{
        throw new Error(`${mode} is not a valid record mode`);
    }

    return types.indexOf(cat) !== -1;
}


export function getRecordTypeInfo(mode, targetType){

    mode = mode.toLowerCase();
    targetType = targetType.toLowerCase();

    if(VALID_RECORD_MODES.indexOf(mode) === -1) return null;

    let options = [];

    if(mode === "player-match"){
        options = VALID_PLAYER_MATCH_TYPES;
    }else if(mode === "player-lifetime"){
        options = VALID_PLAYER_LIFETIME_TYPES;
    }

    for(let i = 0; i < options.length; i++){

        const o = options[i];

        if(targetType === o.value) return o;
    }

    return null;
}

export function getTypeDisplayName(mode, cat){

    mode = mode.toLowerCase();
    cat = cat.toLowerCase();

    let types = null;

    if(mode === "player-match"){

        types = VALID_PLAYER_MATCH_TYPES;

    }else if(mode === "player-lifetime"){

        types = VALID_PLAYER_LIFETIME_TYPES;

    }else{
        throw new Error(`${mode} is not a valid record mode`);
    }

    for(let i = 0; i < types.length; i++){

        const t = types[i];

        if(t.value === cat) return t.display;
    }

    return null;
}