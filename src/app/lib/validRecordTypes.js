export const VALID_PLAYER_MATCH_TYPES = [
    {"display": "Score", "value": "score"},
    {"display": "Frags", "value": "frags"},
    {"display": "Kills", "value": "kills"},
    {"display": "Deaths", "value": "deaths"},
    {"display": "Suicides", "value": "suicides"},
    {"display": "Team Kills", "value": "team_kills"},
    {"display": "Playtime", "value": "time_on_server"},
    {"display": "TTL", "value": "ttl"},
    {"display": "Best Spree", "value": "spree_best"},
    {"display": "Best Multi Kill", "value": "multi_best"},
    {"display": "Headshots", "value": "headshots"},
];

export const VALID_PLAYER_LIFETIME_TYPES = [
    {"display": "Wins", "value": "wins"},
    {"display": "Draws", "value": "draws"},
    {"display": "Losses", "value": "losses"},
    {"display": "WinRate", "value": "winrate"},
    {"display": "Frags", "value": "frags"},
    {"display": "Kills", "value": "kills"},
    {"display": "Deaths", "value": "deaths"},
    {"display": "Suicides", "value": "suicides"},
    {"display": "Team Kills", "value": "team_kills"},
    {"display": "Playtime", "value": "playtime"},
    {"display": "Headshots", "value": "headshots"},
    {"display": "First Bloods", "value": "first_blood"},
    {"display": "Godlikes", "value": "spree_5"},
    {"display": "Monster Kills", "value": "multi_4"},
    {"display": "UDamage Pickups", "value": "item_amp"},
    {"display": "Shield Belt Pickups", "value": "item_belt"},
    {"display": "Jump Boots Pickups", "value": "item_boots"},
    {"display": "Body Armour Pickups", "value": "item_body"},
    {"display": "Thigh Pads Pickups", "value": "item_pads"},
    {"display": "Invisibility Pickups", "value": "item_invis"},
    {"display": "Super Health Pickups", "value": "item_shp"},
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