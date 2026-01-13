export const VALID_PLAYER_MATCH_TYPES = [
    {"display": "Score", "value": "score", "parse": ["ignore0"]},
    {"display": "Frags", "value": "frags", "parse": ["ignore0"]},
    {"display": "Kills", "value": "kills", "parse": ["ignore0"]},
    {"display": "Deaths", "value": "deaths", "parse": ["ignore0"]},
    {"display": "Suicides", "value": "suicides", "parse": ["ignore0"]},
    {"display": "Team Kills", "value": "team_kills", "parse": ["ignore0"]},
    {"display": "Playtime", "value": "time_on_server", "parse": ["playtime"], "className": "playtime"},
    {"display": "TTL", "value": "ttl", "parse": ["playtime"], "className": "playtime"},
    {"display": "Best Spree", "value": "spree_best", "parse": ["ignore0"]},
    {"display": "Best Multi Kill", "value": "multi_best", "parse": ["ignore0"]},
    {"display": "Headshots", "value": "headshots", "parse": ["ignore0"]},
];

export const VALID_PLAYER_LIFETIME_TYPES = [
    {"display": "Wins", "value": "wins", "parse": ["ignore0"]},
    {"display": "Draws", "value": "draws", "parse": ["ignore0"]},
    {"display": "Losses", "value": "losses", "parse": ["ignore0"]},
    {"display": "WinRate", "value": "winrate", "parse": []},
    {"display": "Frags", "value": "frags", "parse": ["ignore0"]},
    {"display": "Kills", "value": "kills", "parse": ["ignore0"]},
    {"display": "Deaths", "value": "deaths", "parse": ["ignore0"]},
    {"display": "Suicides", "value": "suicides", "parse": ["ignore0"]},
    {"display": "Team Kills", "value": "team_kills", "parse": ["ignore0"]},
    {"display": "Playtime", "value": "playtime", "parse": ["playtime"], "className": "playtime"},
    {"display": "Headshots", "value": "headshots", "parse": ["ignore0"]},
    {"display": "First Bloods", "value": "first_blood", "parse": ["ignore0"]},
    {"display": "Godlikes", "value": "spree_5", "parse": ["ignore0"]},
    {"display": "Monster Kills", "value": "multi_4", "parse": ["ignore0"]},
    {"display": "UDamage Pickups", "value": "item_amp", "parse": ["ignore0"]},
    {"display": "Shield Belt Pickups", "value": "item_belt", "parse": ["ignore0"]},
    {"display": "Jump Boots Pickups", "value": "item_boots", "parse": ["ignore0"]},
    {"display": "Body Armour Pickups", "value": "item_body", "parse": ["ignore0"]},
    {"display": "Thigh Pads Pickups", "value": "item_pads", "parse": ["ignore0"]},
    {"display": "Invisibility Pickups", "value": "item_invis", "parse": ["ignore0"]},
    {"display": "Super Health Pickups", "value": "item_shp", "parse": ["ignore0"]},
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