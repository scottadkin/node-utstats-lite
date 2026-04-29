import { simpleQuery } from "./database.mjs";
import Message from "./message.mjs";

new Message(`Node UTStats Lite - SQLite Installer Started`,"note");

const queries = [
    `CREATE TABLE IF NOT EXISTS nstats_sessions(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        created TEXT NOT NULL,
        expires TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        user_ip TEXT NOT NULL,
        session_data TEXT DEFAULT '{}'
    ) STRICT`,
     `CREATE UNIQUE INDEX IF NOT EXISTS ns_s_idx ON nstats_sessions(session_id)`,
  	`CREATE TABLE IF NOT EXISTS nstats_ftp (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        host TEXT NOT NULL,
        port INTEGER NOT NULL,
        user TEXT NOT NULL,
        password TEXT NOT NULL,
        target_folder TEXT NOT NULL,
        delete_after_import INTEGER NOT NULL,
        first TEXT NOT NULL,
        last TEXT NOT NULL,
        total_imports INTEGER NOT NULL,
        total_logs_imported INTEGER NOT NULL,
        ignore_bots INTEGER NOT NULL,
        ignore_duplicates INTEGER NOT NULL,
        min_players INTEGER NOT NULL,
        min_playtime INTEGER NOT NULL,
        sftp INTEGER NOT NULL,
        enabled INTEGER NOT NULL,
        delete_tmp_files INTEGER NOT NULL,
        append_team_sizes INTEGER NOT NULL
      ) STRICT`,

        `CREATE TABLE IF NOT EXISTS nstats_logs_folder (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first TEXT NOT NULL,
        last TEXT NOT NULL,
        total_imports INTEGER NOT NULL,
        total_logs_imported INTEGER NOT NULL,
        ignore_bots INTEGER NOT NULL,
        ignore_duplicates INTEGER NOT NULL,
        min_players INTEGER NOT NULL,
        min_playtime INTEGER NOT NULL,
        append_team_sizes INTEGER NOT NULL
        ) STRICT`,  

        `CREATE TABLE IF NOT EXISTS nstats_players (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT COLLATE NOCASE ,
            country TEXT NOT NULL,
            hash TEXT COLLATE NOCASE NOT NULL
        ) STRICT`,

		`CREATE INDEX IF NOT EXISTS np_name_idx ON nstats_players(name)`,
		`CREATE INDEX IF NOT EXISTS np_hash_idx ON nstats_players(hash)`,

        `CREATE TABLE IF NOT EXISTS nstats_matches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            server_id INTEGER NOT NULL,
            gametype_id INTEGER NOT NULL,
            map_id INTEGER NOT NULL,
            hardcore INTEGER NOT NULL,
            tournament_mode INTEGER DEFAULT 0,
            gamespeed INTEGER DEFAULT 100,
            gamespeed_real INTEGER DEFAULT 100,
            insta INTEGER NOT NULL,
            date TEXT NOT NULL,
            playtime REAL NOT NULL,
            match_start REAL NOT NULL,
            match_end REAL NOT NULL,
            players INTEGER NOT NULL,
            total_teams INTEGER NOT NULL,
            team_0_score INTEGER NOT NULL,   
            team_1_score INTEGER NOT NULL,   
            team_2_score INTEGER NOT NULL,   
            team_3_score INTEGER NOT NULL,   
            solo_winner INTEGER NOT NULL,
            solo_winner_score INTEGER NOT NULL,
            target_score INTEGER NOT NULL,
            time_limit INTEGER NOT NULL,
            mutators TEXT NOT NULL,
            hash TEXT NOT NULL
        ) STRICT`,

        `CREATE TABLE IF NOT EXISTS nstats_matches_dom (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            match_id INTEGER NOT NULL,
            real_total_score REAL NOT NULL,
            importer_total_score REAL NOT NULL,
            total_control_time REAL NOT NULL,
            total_score_time REAL NOT NULL,
            team_0_real_score REAL NOT NULL,
            team_1_real_score REAL NOT NULL,
            team_2_real_score REAL NOT NULL,
            team_3_real_score REAL NOT NULL,
            team_0_importer_score REAL NOT NULL,
            team_1_importer_score REAL NOT NULL,
            team_2_importer_score REAL NOT NULL,
            team_3_importer_score REAL NOT NULL,
            team_0_control_time REAL NOT NULL,
            team_1_control_time REAL NOT NULL,
            team_2_control_time REAL NOT NULL,
            team_3_control_time REAL NOT NULL,
            team_0_control_percent REAL NOT NULL,
            team_1_control_percent REAL NOT NULL,
            team_2_control_percent REAL NOT NULL,
            team_3_control_percent REAL NOT NULL,
            team_0_caps INTEGER NOT NULL,
            team_1_caps INTEGER NOT NULL,
            team_2_caps INTEGER NOT NULL,
            team_3_caps INTEGER NOT NULL,
            team_0_score_time REAL NOT NULL,
            team_1_score_time REAL NOT NULL,
            team_2_score_time REAL NOT NULL,
            team_3_score_time REAL NOT NULL,
            team_0_stolen_points REAL NOT NULL,
            team_1_stolen_points REAL NOT NULL,
            team_2_stolen_points REAL NOT NULL,
            team_3_stolen_points REAL NOT NULL,
            team_0_stolen_caps INTEGER NOT NULL,
            team_1_stolen_caps INTEGER NOT NULL,
            team_2_stolen_caps INTEGER NOT NULL,
            team_3_stolen_caps INTEGER NOT NULL
        ) STRICT`,
		`CREATE INDEX IF NOT EXISTS match_idx ON nstats_matches_dom(match_id)`,

        `CREATE TABLE IF NOT EXISTS nstats_servers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT COLLATE NOCASE ,
            ip TEXT NOT NULL,
            port INTEGER NOT NULL,
            matches INTEGER NOT NULL,
            playtime REAL NOT NULL,
            first_match TEXT NOT NULL,
            last_match TEXT NOT NULL
        ) STRICT`,

        `CREATE TABLE IF NOT EXISTS nstats_gametypes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT COLLATE NOCASE ,
            matches INTEGER NOT NULL,
            playtime REAL NOT NULL,
            first_match TEXT NOT NULL,
            last_match TEXT NOT NULL
        ) STRICT`,

        `CREATE TABLE IF NOT EXISTS nstats_maps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT COLLATE NOCASE ,
            matches INTEGER NOT NULL,
            playtime REAL NOT NULL,
            first_match TEXT NOT NULL,
            last_match TEXT NOT NULL
        ) STRICT`,

        `CREATE TABLE IF NOT EXISTS nstats_match_players (     
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id INTEGER NOT NULL,
            spectator INTEGER NOT NULL,
            ip TEXT NOT NULL,
            country TEXT NOT NULL,
            hwid TEXT NOT NULL,
            mac1 TEXT NOT NULL,
            mac2 TEXT NOT NULL,
            match_id INTEGER NOT NULL,
            map_id INTEGER NOT NULL,
            gametype_id INTEGER NOT NULL,
            match_date TEXT NOT NULL,
            match_result TEXT NOT NULL,
            bot INTEGER NOT NULL,
            ping_min INTEGER NOT NULL,
            ping_avg INTEGER NOT NULL,
            ping_max INTEGER NOT NULL,
            team INTEGER NOT NULL,
            score INTEGER NOT NULL,
            frags INTEGER NOT NULL,
            kills INTEGER NOT NULL,
            deaths INTEGER NOT NULL,
            suicides INTEGER NOT NULL,
            team_kills INTEGER NOT NULL,
            efficiency REAL NOT NULL,
            time_on_server REAL NOT NULL,
            ttl REAL NOT NULL,
            first_blood INTEGER NOT NULL,
            spree_1 INTEGER NOT NULL,
            spree_2 INTEGER NOT NULL,
            spree_3 INTEGER NOT NULL,
            spree_4 INTEGER NOT NULL,
            spree_5 INTEGER NOT NULL,
            spree_best INTEGER NOT NULL,
            multi_1 INTEGER NOT NULL,
            multi_2 INTEGER NOT NULL,
            multi_3 INTEGER NOT NULL,
            multi_4 INTEGER NOT NULL,
            multi_best INTEGER NOT NULL,
            headshots INTEGER NOT NULL,
            item_amp INTEGER NOT NULL,
            item_belt INTEGER NOT NULL,
            item_boots INTEGER NOT NULL,
            item_body INTEGER NOT NULL,
            item_pads INTEGER NOT NULL,
            item_invis INTEGER NOT NULL,
            item_shp INTEGER NOT NULL
        ) STRICT`,

		`CREATE INDEX IF NOT EXISTS nmp_match_idx ON nstats_match_players(match_id)`,
		`CREATE INDEX IF NOT EXISTS nmp_player_idx ON nstats_match_players(player_id)`,

        `CREATE TABLE IF NOT EXISTS nstats_match_weapon_stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            match_id INTEGER NOT NULL,
            map_id INTEGER NOT NULL,
            gametype_id INTEGER NOT NULL,
            player_id INTEGER NOT NULL,
            weapon_id INTEGER NOT NULL,
            kills INTEGER NOT NULL,
            deaths INTEGER NOT NULL,
            team_kills INTEGER NOT NULL,
            suicides INTEGER NOT NULL
        ) STRICT`,

		`CREATE INDEX IF NOT EXISTS nmws_match_idx ON nstats_match_weapon_stats(match_id)`,

        `CREATE TABLE IF NOT EXISTS nstats_weapons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT COLLATE NOCASE NOT NULL
        ) STRICT`,

        `CREATE TABLE IF NOT EXISTS nstats_kills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            match_id INTEGER NOT NULL,
            timestamp REAL NOT NULL,
            kill_type INTEGER NOT NULL,
            killer_id INTEGER NOT NULL,
            killer_weapon INTEGER NOT NULL,
            victim_id INTEGER NOT NULL,
            victim_weapon INTEGER NOT NULL
        ) STRICT`,
		 `CREATE INDEX IF NOT EXISTS nk_match_idx ON nstats_kills(match_id)`,

        `CREATE TABLE IF NOT EXISTS nstats_match_ctf (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            match_id INTEGER NOT NULL,     
            map_id INTEGER NOT NULL,
            gametype_id INTEGER NOT NULL,
            player_id INTEGER NOT NULL,
            flag_taken INTEGER NOT NULL,
            flag_pickup INTEGER NOT NULL,
            flag_drop INTEGER NOT NULL,
            flag_assist INTEGER NOT NULL,
            flag_cover INTEGER NOT NULL,
            flag_seal INTEGER NOT NULL,
            flag_cap INTEGER NOT NULL,
            flag_kill INTEGER NOT NULL,
            flag_return INTEGER NOT NULL,
            flag_return_base INTEGER NOT NULL,
            flag_return_mid INTEGER NOT NULL,
            flag_return_enemy_base INTEGER NOT NULL,
            flag_return_save INTEGER NOT NULL,
            flag_carry_time REAL NOT NULL,
            flag_carry_time_min REAL NOT NULL,
            flag_carry_time_max REAL NOT NULL
        ) STRICT`,

		`CREATE INDEX IF NOT EXISTS nmc_match_idx ON nstats_match_ctf(match_id)`,

        `CREATE TABLE IF NOT EXISTS nstats_dom_control_points (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT COLLATE NOCASE NOT NULL
        ) STRICT`,

        `CREATE TABLE IF NOT EXISTS nstats_match_dom (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            match_id INTEGER NOT NULL,  
            map_id INTEGER NOT NULL,
            gametype_id INTEGER NOT NULL,
            player_id INTEGER NOT NULL,
            point_id INTEGER NOT NULL,
            total_caps INTEGER NOT NULL,
            total_control_time REAL NOT NULL,
            longest_control_time REAL NOT NULL,
            shortest_control_time REAL NOT NULL,
            control_percent REAL NOT NULL,
            control_point_score REAL NOT NULL,
            max_control_point_score REAL NOT NULL,
            total_score_time REAL NOT NULL,
            max_total_score_time REAL NOT NULL,
            stolen_points REAL NOT NULL,
            stolen_caps INTEGER NOT NULL
        ) STRICT`,
		 `CREATE INDEX IF NOT EXISTS nmd_match_idx ON nstats_match_dom(match_id)`,

        `CREATE TABLE IF NOT EXISTS nstats_player_totals (     
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id INTEGER NOT NULL,
            gametype_id INTEGER NOT NULL,
            map_id INTEGER NOT NULL,
            last_active TEXT NOT NULL,
            playtime REAL NOT NULL,
            total_matches INTEGER NOT NULL,
            wins INTEGER NOT NULL,
            draws INTEGER NOT NULL,
            losses INTEGER NOT NULL,
            winrate REAL NOT NULL,
            score INTEGER NOT NULL,
            frags INTEGER NOT NULL,
            kills INTEGER NOT NULL,
            deaths INTEGER NOT NULL,
            suicides INTEGER NOT NULL,
            team_kills INTEGER NOT NULL,
            efficiency REAL NOT NULL,
            ttl REAL NOT NULL,
            first_blood INTEGER NOT NULL,
            spree_1 INTEGER NOT NULL,
            spree_2 INTEGER NOT NULL,
            spree_3 INTEGER NOT NULL,
            spree_4 INTEGER NOT NULL,
            spree_5 INTEGER NOT NULL,
            spree_best INTEGER NOT NULL,
            multi_1 INTEGER NOT NULL,
            multi_2 INTEGER NOT NULL,
            multi_3 INTEGER NOT NULL,
            multi_4 INTEGER NOT NULL,
            multi_best INTEGER NOT NULL,
            headshots INTEGER NOT NULL,
            item_amp INTEGER NOT NULL,
            item_belt INTEGER NOT NULL,
            item_boots INTEGER NOT NULL,
            item_body INTEGER NOT NULL,
            item_pads INTEGER NOT NULL,
            item_invis INTEGER NOT NULL,
            item_shp INTEGER NOT NULL
        ) STRICT`,

		`CREATE UNIQUE INDEX IF NOT EXISTS npt_pgm_idx ON nstats_player_totals(player_id,gametype_id,map_id)`,

        `CREATE TABLE IF NOT EXISTS nstats_player_totals_weapons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id INTEGER NOT NULL,
            gametype_id INTEGER NOT NULL,
            weapon_id INTEGER NOT NULL,
            total_matches INTEGER NOT NULL,
            kills INTEGER NOT NULL,
            deaths INTEGER NOT NULL,
            suicides INTEGER NOT NULL,
            team_kills INTEGER NOT NULL,
            eff REAL NOT NULL
        ) STRICT`,
		 `CREATE UNIQUE INDEX IF NOT EXISTS pgw_idx ON nstats_player_totals_weapons(player_id, gametype_id, weapon_id)`,

        `CREATE TABLE IF NOT EXISTS nstats_player_totals_ctf (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id INTEGER NOT NULL,
            gametype_id INTEGER NOT NULL,
            map_id INTEGER NOT NULL,
            total_matches INTEGER NOT NULL,
            flag_taken INTEGER NOT NULL,
            max_flag_taken INTEGER NOT NULL,
            flag_pickup INTEGER NOT NULL,
            max_flag_pickup INTEGER NOT NULL,
            flag_drop INTEGER NOT NULL,
            max_flag_drop INTEGER NOT NULL,
            flag_assist INTEGER NOT NULL,
            max_flag_assist INTEGER NOT NULL,
            flag_cover INTEGER NOT NULL,
            max_flag_cover INTEGER NOT NULL,
            flag_seal INTEGER NOT NULL,
            max_flag_seal INTEGER NOT NULL,
            flag_cap INTEGER NOT NULL,
            max_flag_cap INTEGER NOT NULL,
            flag_kill INTEGER NOT NULL,
            max_flag_kill INTEGER NOT NULL,
            flag_return INTEGER NOT NULL,
            max_flag_return INTEGER NOT NULL,
            flag_return_base INTEGER NOT NULL,
            max_flag_return_base INTEGER NOT NULL,
            flag_return_mid INTEGER NOT NULL,
            max_flag_return_mid INTEGER NOT NULL,
            flag_return_enemy_base INTEGER NOT NULL,
            max_flag_return_enemy_base INTEGER NOT NULL,
            flag_return_save INTEGER NOT NULL,
            max_flag_return_save INTEGER NOT NULL
        ) STRICT`,

		`CREATE UNIQUE INDEX IF NOT EXISTS nptc_pgm_idx ON nstats_player_totals_ctf(player_id, gametype_id, map_id)`,

        `CREATE TABLE IF NOT EXISTS nstats_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT COLLATE NOCASE ,
            password TEXT COLLATE NOCASE ,
            activated INTEGER NOT NULL
        ) STRICT`,

        /*`CREATE TABLE IF NOT EXISTS nstats_sessions (
        session_id TEXT COLLATE utf8mb4_bin ,
        expires INTEGER unsigned ,
        user_id INTEGER unsigned DEFAULT 0,
        data mediumtext COLLATE utf8mb4_bin,
        PRIMARY KEY (session_id)
        ) ENGINE=InnoDB`,*/

        `CREATE TABLE IF NOT EXISTS nstats_logs_downloads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_name TEXT COLLATE NOCASE ,
            date TEXT NOT NULL,
            importer_id INTEGER NOT NULL,
            ftp_ip TEXT NOT NULL,
            file_size INTEGER NOT NULL
        ) STRICT`,

		`CREATE UNIQUE INDEX IF NOT EXISTS nld_name_idx ON nstats_logs_downloads(file_name)`,

        `CREATE TABLE IF NOT EXISTS nstats_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_name TEXT COLLATE NOCASE ,
            date TEXT NOT NULL,
            match_id INTEGER NOT NULL
        ) STRICT`,

        `CREATE TABLE IF NOT EXISTS nstats_logs_rejected (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_name TEXT COLLATE NOCASE,
            date TEXT NOT NULL,
            reason TEXT NOT NULL
        ) STRICT`,

        `CREATE TABLE IF NOT EXISTS nstats_site_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT COLLATE NOCASE,
            setting_type TEXT COLLATE NOCASE,
            setting_name TEXT COLLATE NOCASE,
            setting_value text NOT NULL
        ) STRICT`,


        `CREATE TABLE IF NOT EXISTS nstats_importer_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            importer_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            logs_found INTEGER NOT NULL,
            imported INTEGER NOT NULL,
            failed INTEGER NOT NULL,
            total_time REAL NOT NULL
            ) STRICT`,

        `CREATE TABLE IF NOT EXISTS nstats_rankings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id INTEGER NOT NULL,
            gametype_id INTEGER NOT NULL,
            matches INTEGER NOT NULL,
            playtime REAL NOT NULL,
            score REAL NOT NULL,
            last_active TEXT NOT NULL
            ) STRICT`,
			 `CREATE UNIQUE INDEX IF NOT EXISTS pg_idx ON nstats_rankings(player_id,gametype_id)`,

        `CREATE TABLE IF NOT EXISTS nstats_ranking_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            name TEXT COLLATE NOCASE ,
            display_name TEXT COLLATE NOCASE ,
            points REAL NOT NULL
        ) STRICT`,

        `CREATE TABLE IF NOT EXISTS nstats_page_layout (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            page TEXT NOT NULL,
            item TEXT NOT NULL,
            page_order INTEGER NOT NULL
        ) STRICT`,

        `CREATE TABLE IF NOT EXISTS nstats_damage_match (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id INTEGER NOT NULL,
            match_id INTEGER NOT NULL,
            map_id INTEGER NOT NULL,
            gametype_id INTEGER NOT NULL,
            damage_delt INTEGER NOT NULL,
            damage_taken INTEGER NOT NULL,
            self_damage INTEGER NOT NULL,
            team_damage_delt INTEGER NOT NULL,
            team_damage_taken INTEGER NOT NULL,
            fall_damage INTEGER NOT NULL,
            drown_damage INTEGER NOT NULL,
            cannon_damage INTEGER NOT NULL
            ) STRICT`,

		`CREATE INDEX IF NOT EXISTS ndm_match_idx ON nstats_damage_match(match_id)`,

        `CREATE TABLE IF NOT EXISTS nstats_player_totals_damage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id INTEGER NOT NULL,
        gametype_id INTEGER NOT NULL,
        total_matches INTEGER NOT NULL,
        playtime REAL NOT NULL,
        damage_delt INTEGER NOT NULL,
        damage_taken INTEGER NOT NULL,
        self_damage INTEGER NOT NULL,
        team_damage_delt INTEGER NOT NULL,
        team_damage_taken INTEGER NOT NULL,
        fall_damage INTEGER NOT NULL,
        drown_damage INTEGER NOT NULL,
        cannon_damage INTEGER NOT NULL
        ) STRICT`,


        `CREATE TABLE IF NOT EXISTS nstats_ctf_caps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_id INTEGER NOT NULL,
        map_id INTEGER NOT NULL,
        gametype_id INTEGER NOT NULL,
        cap_type INTEGER NOT NULL,
        flag_team INTEGER NOT NULL,
        capping_team INTEGER NOT NULL,
        taken_timestamp REAL NOT NULL,
        taken_player INTEGER NOT NULL,
        cap_timestamp REAL NOT NULL,
        cap_player INTEGER NOT NULL,
        cap_time REAL NOT NULL,
        carry_time REAL NOT NULL,
        drop_time REAL NOT NULL,
        total_drops INTEGER NOT NULL,
        total_covers INTEGER NOT NULL,
        unique_carriers INTEGER NOT NULL,
        red_kills INTEGER NOT NULL,
        blue_kills INTEGER NOT NULL,
        green_kills INTEGER NOT NULL,
        yellow_kills INTEGER NOT NULL,
        red_suicides INTEGER NOT NULL,
        blue_suicides INTEGER NOT NULL,
        green_suicides INTEGER NOT NULL,
        yellow_suicides INTEGER NOT NULL
        ) STRICT`,
		`CREATE INDEX IF NOT EXISTS nccaps_match_idx ON nstats_ctf_caps(match_id)`,


    `CREATE TABLE IF NOT EXISTS nstats_ctf_covers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER NOT NULL,
    cap_id INTEGER NOT NULL,
    timestamp REAL NOT NULL,
    player_id INTEGER NOT NULL
    ) STRICT`,
	 `CREATE INDEX IF NOT EXISTS nccovers_match_idx ON nstats_ctf_covers(match_id)`,

    
    `CREATE TABLE IF NOT EXISTS nstats_ctf_carry_times (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_id INTEGER NOT NULL,
        map_id INTEGER NOT NULL,
        gametype_id INTEGER NOT NULL,
        cap_id INTEGER NOT NULL,
        player_id INTEGER NOT NULL,
        start_timestamp REAL NOT NULL,
        end_timestamp REAL NOT NULL,
        carry_time REAL NOT NULL
        ) STRICT`,
		`CREATE INDEX IF NOT EXISTS ncct_match_idx ON nstats_ctf_carry_times(match_id)`,


        `CREATE TABLE IF NOT EXISTS nstats_ctf_cap_kills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_id INTEGER NOT NULL,
        cap_id INTEGER NOT NULL,
        timestamp REAL NOT NULL,
        killer_id INTEGER NOT NULL,
        killer_team INTEGER NOT NULL
        ) STRICT`,
		 `CREATE INDEX IF NOT EXISTS ncck_match_idx ON nstats_ctf_cap_kills(match_id)`,

        `CREATE TABLE IF NOT EXISTS nstats_ctf_cap_suicides (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_id INTEGER NOT NULL,
        cap_id INTEGER NOT NULL,
        timestamp REAL NOT NULL,
        player_id INTEGER NOT NULL,
        player_team INTEGER NOT NULL
        ) STRICT`,
		 
		 `CREATE INDEX IF NOT EXISTS nccs_match_idx ON nstats_ctf_cap_suicides(match_id)`,


        `CREATE TABLE IF NOT EXISTS nstats_player_map_minute_averages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id INTEGER NOT NULL,
        map_id INTEGER NOT NULL,
        gametype_id INTEGER NOT NULL,
        total_playtime REAL NOT NULL,
        total_matches REAL NOT NULL,
        score REAL NOT NULL,
        frags REAL NOT NULL,
        kills REAL NOT NULL,
        deaths REAL NOT NULL,
        suicides REAL NOT NULL,
        team_kills REAL NOT NULL,
        headshots REAL NOT NULL,
        item_amp REAL NOT NULL,
        item_belt REAL NOT NULL,
        item_boots REAL NOT NULL,
        item_body REAL NOT NULL,
        item_pads REAL NOT NULL,
        item_invis REAL NOT NULL,
        item_shp REAL NOT NULL,
        flag_taken REAL NOT NULL,
        flag_pickup REAL NOT NULL,
        flag_drop REAL NOT NULL,
        flag_assist REAL NOT NULL,
        flag_cover REAL NOT NULL,
        flag_seal REAL NOT NULL,
        flag_cap REAL NOT NULL,
        flag_kills REAL NOT NULL,
        flag_return REAL NOT NULL,
        flag_return_base REAL NOT NULL,
        flag_return_mid REAL NOT NULL,
        flag_return_enemy_base REAL NOT NULL,
        flag_return_save REAL NOT NULL,
        dom_caps REAL NOT NULL
        ) STRICT`,

		`CREATE UNIQUE INDEX IF NOT EXISTS pmg_idx ON nstats_player_map_minute_averages(player_id,map_id,gametype_id)`,


        `CREATE TABLE IF NOT EXISTS nstats_map_weapon_totals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            map_id INTEGER NOT NULL,
            total_matches INTEGER NOT NULL,
            total_playtime REAL NOT NULL,
            weapon_id INTEGER NOT NULL,
            kills INTEGER NOT NULL,
            deaths INTEGER NOT NULL,
            suicides INTEGER NOT NULL,
            team_kills INTEGER NOT NULL,
            kills_per_min REAL NOT NULL,
            deaths_per_min REAL NOT NULL,
            team_kills_per_min REAL NOT NULL,
            suicides_per_min REAL NOT NULL
        ) STRICT`,
		 `CREATE UNIQUE INDEX IF NOT EXISTS mw_idx ON nstats_map_weapon_totals(map_id,weapon_id)`,

        `CREATE TABLE IF NOT EXISTS nstats_map_rankings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id INTEGER NOT NULL,
            map_id INTEGER NOT NULL,
            matches INTEGER NOT NULL,
            playtime REAL NOT NULL,
            score REAL NOT NULL,
            last_active TEXT NOT NULL
            ) STRICT`,
		`CREATE UNIQUE INDEX IF NOT EXISTS pm_idx ON nstats_map_rankings(player_id, map_id)`,


        `CREATE TABLE IF NOT EXISTS nstats_classic_weapon_match_stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            match_id INTEGER NOT NULL,
            gametype_id INTEGER NOT NULL,
            map_id INTEGER NOT NULL,
            player_id INTEGER NOT NULL,
            weapon_id INTEGER NOT NULL,
            kills INTEGER NOT NULL,
            deaths INTEGER NOT NULL,
            shots INTEGER NOT NULL,
            hits INTEGER NOT NULL,
            accuracy REAL NOT NULL,
            damage INTEGER NOT NULL
            ) STRICT`,
			 `CREATE INDEX IF NOT EXISTS ncwms_match_idx ON nstats_classic_weapon_match_stats(match_id)`,

        `CREATE TABLE IF NOT EXISTS nstats_player_ctf_league (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id INTEGER NOT NULL,
        gametype_id INTEGER NOT NULL,
        map_id INTEGER NOT NULL,
        first_match TEXT NOT NULL,
        last_match TEXT NOT NULL,
        playtime REAL NOT NULL,
        total_matches INTEGER NOT NULL,
        wins INTEGER NOT NULL,
        draws INTEGER NOT NULL,
        losses INTEGER NOT NULL,
        winrate REAL NOT NULL,
        cap_for INTEGER NOT NULL,
        cap_against INTEGER NOT NULL,
        cap_offset INTEGER NOT NULL,
        points INTEGER NOT NULL
        ) STRICT`,
		 `CREATE INDEX IF NOT EXISTS npcl_mgp_idx ON nstats_player_ctf_league(map_id, gametype_id, player_id)`,
		 `CREATE UNIQUE INDEX IF NOT EXISTS npcl_pgm_idx ON nstats_player_ctf_league(player_id,gametype_id,map_id)`,

        `CREATE TABLE IF NOT EXISTS nstats_ctf_league_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT COLLATE NOCASE ,
        name TEXT COLLATE NOCASE ,
        type TEXT COLLATE NOCASE ,
        value TEXT NOT NULL
        ) STRICT`,

       `CREATE TABLE IF NOT EXISTS nstats_user_login_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        target_username TEXT COLLATE NOCASE,
        ip TEXT NOT NULL
        ) STRICT`,

        `CREATE TABLE IF NOT EXISTS nstats_match_dom_team_score_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_id INTEGER NOT NULL,
        timestamp REAL NOT NULL,
        real_total_score REAL NOT NULL,
        real_team_0_score REAL NOT NULL,
        real_team_1_score REAL NOT NULL,
        real_team_2_score REAL NOT NULL,
        real_team_3_score REAL NOT NULL,
        importer_total_score REAL NOT NULL,
        importer_team_0_score REAL NOT NULL,
        importer_team_1_score REAL NOT NULL,
        importer_team_2_score REAL NOT NULL,
        importer_team_3_score REAL NOT NULL
        ) STRICT`,
		 `CREATE INDEX IF NOT EXISTS nmdtsh_match_idx ON nstats_match_dom_team_score_history(match_id)`,

        `CREATE TABLE IF NOT EXISTS nstats_json_api(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT COLLATE NOCASE ,
        setting_name TEXT COLLATE NOCASE ,
        setting_type TEXT COLLATE NOCASE ,
        setting_value TEXT NOT NULL
        ) STRICT`,

];

export default async function sqliteInstall(){

    for(let i = 0; i < queries.length; i++){

        new Message(`Attempting Query ${i + 1} out of ${queries.length}`,"note");
        simpleQuery(queries[i]);
        new Message(`Query passed`,"pass");
    }
}
