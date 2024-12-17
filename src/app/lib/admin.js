import { simpleQuery } from "./database.mjs";

export async function clearAllDataTables(){

    const tables = [
        "dom_control_points",
        "gametypes",
        "importer_history",
        "kills",
        "logs",
        "logs_rejected",
        "maps",
        "matches",
        "match_ctf",
        "match_dom",
        "match_players",
        "match_weapon_stats",
        "players",
        "player_totals",
        "player_totals_ctf",
        "player_totals_weapons",
        "rankings",
        "servers",
        "weapons",
        "damage_match",
        "player_totals_damage",
        "ctf_caps",
        "ctf_cap_kills",
        "ctf_cap_suicides",
        "ctf_carry_times",
        "ctf_covers",
        "player_map_minute_averages"
    ];


    for(let i = 0; i < tables.length; i++){

        const t = tables[i];

        const query = `TRUNCATE nstats_${t}`;

        await simpleQuery(query);
    }
}