export const VALID_PLAYER_MATCH_TYPES = [
    {"display": "Score", "value": "score", "parse": ["ignore0"], "group": "General"},
    {"display": "Frags", "value": "frags", "parse": ["ignore0"], "group": "General"},
    {"display": "Kills", "value": "kills", "parse": ["ignore0"], "group": "General"},
    {"display": "Deaths", "value": "deaths", "parse": ["ignore0"], "group": "General"},
    {"display": "Suicides", "value": "suicides", "parse": ["ignore0"], "group": "General"},
    {"display": "Team Kills", "value": "team_kills", "parse": ["ignore0"], "group": "General"},
    {"display": "Playtime", "value": "time_on_server", "parse": ["playtime"], "className": "playtime", "group": "General"},
    {"display": "TTL", "value": "ttl", "parse": ["playtime"], "className": "playtime", "group": "General"},
    {"display": "Headshots", "value": "headshots", "parse": ["ignore0"], "group": "General"},
    {"display": "Best Spree", "value": "spree_best", "parse": ["ignore0"], "group": "Sprees"},
    {"display": "Killing Spree", "value": "spree_1", "parse": ["ignore0"], "group": "Sprees"},
    {"display": "Rampage", "value": "spree_2", "parse": ["ignore0"], "group": "Sprees"},
    {"display": "Dominating", "value": "spree_3", "parse": ["ignore0"], "group": "Sprees"},
    {"display": "Unstoppable", "value": "spree_4", "parse": ["ignore0"], "group": "Sprees"},
    {"display": "Godlike", "value": "spree_5", "parse": ["ignore0"], "group": "Sprees"},
    {"display": "Best Multi Kill", "value": "multi_best", "parse": ["ignore0"], "group": "Multi Kills"},
    {"display": "Double Kill", "value": "multi_1", "parse": ["ignore0"], "group": "Multi Kills"},
    {"display": "Multi Kill", "value": "multi_2", "parse": ["ignore0"], "group": "Multi Kills"},
    {"display": "Ultra Kill", "value": "multi_3", "parse": ["ignore0"], "group": "Multi Kills"},
    {"display": "Monster Kill", "value": "multi_4", "parse": ["ignore0"], "group": "Multi Kills"},
    {"display": "UDamage", "value": "item_amp", "parse": ["ignore0"], "group": "Items"},
    {"display": "Invisibility", "value": "item_invis", "parse": ["ignore0"], "group": "Items"},
    {"display": "Shield Belt", "value": "item_belt", "parse": ["ignore0"], "group": "Items"},
    {"display": "Super Health", "value": "item_shp", "parse": ["ignore0"], "group": "Items"},
    {"display": "Body Armor", "value": "item_body", "parse": ["ignore0"], "group": "Items"},
    {"display": "Thigh Pads", "value": "item_pads", "parse": ["ignore0"], "group": "Items"},
    {"display": "Jump Boots", "value": "item_boots", "parse": ["ignore0"], "group": "Items"},
    
];

export const VALID_PLAYER_LIFETIME_TYPES = [
    {"display": "Wins", "value": "wins", "parse": ["ignore0"], "group": "General"},
    {"display": "Draws", "value": "draws", "parse": ["ignore0"], "group": "General"},
    {"display": "Losses", "value": "losses", "parse": ["ignore0"], "group": "General"},
    {"display": "WinRate", "value": "winrate", "parse": [], "group": "General"},
    {"display": "Frags", "value": "frags", "parse": ["ignore0"], "group": "General"},
    {"display": "Kills", "value": "kills", "parse": ["ignore0"], "group": "General"},
    {"display": "Deaths", "value": "deaths", "parse": ["ignore0"], "group": "General"},
    {"display": "Suicides", "value": "suicides", "parse": ["ignore0"], "group": "General"},
    {"display": "Team Kills", "value": "team_kills", "parse": ["ignore0"], "group": "General"},
    {"display": "Playtime", "value": "playtime", "parse": ["playtime"], "className": "playtime", "group": "General"},
    {"display": "Headshots", "value": "headshots", "parse": ["ignore0"], "group": "General"},
    {"display": "First Bloods", "value": "first_blood", "parse": ["ignore0"], "group": "General"},
    {"display": "Best Spree", "value": "spree_best", "parse": ["ignore0"], "group": "Sprees"},
    {"display": "Godlikes", "value": "spree_5", "parse": ["ignore0"], "group": "Sprees"},
    {"display": "Best Multi Kill", "value": "multi_best", "parse": ["ignore0"], "group": "Multis"},
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

export function bValidRecordType(mode, cat){

    mode = mode.toLowerCase();
    cat = cat.toLowerCase();

    let types = null;

    if(mode === "match"){

        types = VALID_PLAYER_MATCH_TYPES.map((t) =>{
            return t.value;
        });

    }else if(mode === "lifetime"){

        types = VALID_PLAYER_LIFETIME_TYPES.map((t) =>{
            return t.value;
        });

    }else{
        throw new Error(`${mode} is not a valid record mode`);
    }

    return types.indexOf(cat) !== -1;
}


export function getTypeDisplayName(mode, cat){

    mode = mode.toLowerCase();
    cat = cat.toLowerCase();

    let types = null;

    if(mode === "match"){

        types = VALID_PLAYER_MATCH_TYPES;

    }else if(mode === "lifetime"){

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