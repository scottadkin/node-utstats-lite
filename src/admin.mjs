import { simpleQuery } from "./database.mjs";
import { mysqlSettings } from "../config.mjs";

export async function clearAllDataTables(){

    const tables = [
        "classic_weapon_match_stats",
        "ctf_caps",
        "ctf_cap_kills",
        "ctf_cap_suicides",
        "ctf_carry_times",
        "ctf_covers",
        "damage_match", 
        "dom_control_points",
        "gametypes",
        "importer_history",
        "kills",
        "logs",
        "logs_rejected",     
        "logs_downloads",     
        "maps",
        "map_rankings",
        "map_weapon_totals",
        "matches",
        "matches_dom",
        "match_ctf",
        "match_dom",
        "match_dom_team_score_history",
        "match_players",
        "match_weapon_stats",
        "players",
        "player_ctf_league",
        "player_map_minute_averages",
        "player_totals",
        "player_totals_ctf",
        "player_totals_damage",
        "player_totals_weapons",
        "rankings",
        "servers",
        "weapons" 
    ];


    for(let i = 0; i < tables.length; i++){

        const t = tables[i];

        const query = `TRUNCATE nstats_${t}`;

        await simpleQuery(query);
    }
    
}

export async function getAllDatabaseTableInfo(){

    const query = `SELECT table_name,table_rows,data_length,index_length 
    FROM information_schema.tables WHERE table_schema='${mysqlSettings.database}'`;

    return await simpleQuery(query);
    

    
}