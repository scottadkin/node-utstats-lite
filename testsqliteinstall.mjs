import { simpleQuery } from "./src/database.mjs";
import { restoreDefaultSettings } from "./src/siteSettings.mjs";
import { addPageLayouts } from "./install.mjs";




//process.exit();

const queries = [
  	`CREATE TABLE IF NOT EXISTS nstats_ftp (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT ,
        host TEXT ,
        port INTEGER ,
        user TEXT ,
        password TEXT ,
        target_folder TEXT ,
        delete_after_import INTEGER ,
        first TEXT ,
        last TEXT ,
        total_imports INTEGER ,
        total_logs_imported INTEGER ,
        ignore_bots INTEGER ,
        ignore_duplicates INTEGER ,
        min_players INTEGER ,
        min_playtime INTEGER ,
        sftp INTEGER ,
        enabled INTEGER ,
        delete_tmp_files INTEGER ,
        append_team_sizes INTEGER 
      ) STRICT`,

        `CREATE TABLE IF NOT EXISTS nstats_logs_folder (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first TEXT ,
        last TEXT ,
        total_imports INTEGER ,
        total_logs_imported INTEGER ,
        ignore_bots INTEGER ,
        ignore_duplicates INTEGER ,
        min_players INTEGER ,
        min_playtime INTEGER ,
        append_team_sizes INTEGER 
        ) STRICT`,  

        `CREATE TABLE IF NOT EXISTS nstats_players (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT COLLATE NOCASE ,
            country TEXT ,
            hash TEXT COLLATE NOCASE
        ) STRICT`,

		`CREATE INDEX IF NOT EXISTS np_name_idx ON nstats_players(name)`,
		`CREATE INDEX IF NOT EXISTS np_hash_idx ON nstats_players(hash)`,

        `CREATE TABLE IF NOT EXISTS nstats_matches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            server_id INTEGER ,
            gametype_id INTEGER ,
            map_id INTEGER ,
            hardcore INTEGER ,
            tournament_mode INTEGER DEFAULT 0,
            gamespeed INTEGER DEFAULT 100,
            gamespeed_real INTEGER DEFAULT 100,
            insta INTEGER ,
            date TEXT ,
            playtime REAL ,
            match_start REAL ,
            match_end REAL ,
            players INTEGER ,
            total_teams INTEGER ,
            team_0_score INTEGER ,   
            team_1_score INTEGER ,   
            team_2_score INTEGER ,   
            team_3_score INTEGER ,   
            solo_winner INTEGER ,
            solo_winner_score INTEGER ,
            target_score INTEGER ,
            time_limit INTEGER ,
            mutators text ,
            hash TEXT 
        ) STRICT`,

        `CREATE TABLE IF NOT EXISTS nstats_matches_dom (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            match_id INTEGER ,
            real_total_score REAL ,
            importer_total_score REAL ,
            total_control_time REAL ,
            total_score_time REAL ,
            team_0_real_score REAL ,
            team_1_real_score REAL ,
            team_2_real_score REAL ,
            team_3_real_score REAL ,
            team_0_importer_score REAL ,
            team_1_importer_score REAL ,
            team_2_importer_score REAL ,
            team_3_importer_score REAL ,
            team_0_control_time REAL ,
            team_1_control_time REAL ,
            team_2_control_time REAL ,
            team_3_control_time REAL ,
            team_0_control_percent REAL ,
            team_1_control_percent REAL ,
            team_2_control_percent REAL ,
            team_3_control_percent REAL ,
            team_0_caps INTEGER,
            team_1_caps INTEGER,
            team_2_caps INTEGER,
            team_3_caps INTEGER,
            team_0_score_time REAL ,
            team_1_score_time REAL ,
            team_2_score_time REAL ,
            team_3_score_time REAL ,
            team_0_stolen_points REAL ,
            team_1_stolen_points REAL ,
            team_2_stolen_points REAL ,
            team_3_stolen_points REAL ,
            team_0_stolen_caps INTEGER,
            team_1_stolen_caps INTEGER,
            team_2_stolen_caps INTEGER,
            team_3_stolen_caps INTEGER
        ) STRICT`,
		`CREATE INDEX IF NOT EXISTS match_idx ON nstats_matches_dom(match_id)`,

        `CREATE TABLE IF NOT EXISTS nstats_servers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT COLLATE NOCASE ,
            ip TEXT ,
            port INTEGER ,
            matches INTEGER ,
            playtime REAL ,
            first_match TEXT ,
            last_match TEXT 
        ) STRICT`,

        `CREATE TABLE IF NOT EXISTS nstats_gametypes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT COLLATE NOCASE ,
            matches INTEGER ,
            playtime REAL ,
            first_match TEXT ,
            last_match TEXT 
        ) STRICT`,

        `CREATE TABLE IF NOT EXISTS nstats_maps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT COLLATE NOCASE ,
            matches INTEGER,
            playtime REAL ,
            first_match TEXT ,
            last_match TEXT 
        ) STRICT`,

        `CREATE TABLE IF NOT EXISTS nstats_match_players (     
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id INTEGER,
            spectator INTEGER ,
            ip TEXT  ,
            country TEXT  ,
            hwid TEXT  ,
            mac1 TEXT  ,
            mac2 TEXT  ,
            match_id INTEGER,
            map_id INTEGER,
            gametype_id INTEGER,
            match_date TEXT ,
            match_result TEXT ,
            bot INTEGER ,
            ping_min INTEGER ,
            ping_avg INTEGER ,
            ping_max INTEGER ,
            team INTEGER ,
            score INTEGER,
            frags INTEGER,
            kills INTEGER,
            deaths INTEGER,
            suicides INTEGER,
            team_kills INTEGER,
            efficiency REAL ,
            time_on_server REAL ,
            ttl REAL ,
            first_blood INTEGER ,
            spree_1 INTEGER,
            spree_2 INTEGER,
            spree_3 INTEGER,
            spree_4 INTEGER,
            spree_5 INTEGER,
            spree_best INTEGER,
            multi_1 INTEGER,
            multi_2 INTEGER,
            multi_3 INTEGER,
            multi_4 INTEGER,
            multi_best INTEGER,
            headshots INTEGER,
            item_amp INTEGER,
            item_belt INTEGER,
            item_boots INTEGER,
            item_body INTEGER,
            item_pads INTEGER,
            item_invis INTEGER,
            item_shp INTEGER
        ) STRICT`,

		`CREATE INDEX IF NOT EXISTS nmp_match_idx ON nstats_match_players(match_id)`,
		`CREATE INDEX IF NOT EXISTS nmp_player_idx ON nstats_match_players(player_id)`,

        `CREATE TABLE IF NOT EXISTS nstats_match_weapon_stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            match_id INTEGER ,
            map_id INTEGER ,
            gametype_id INTEGER ,
            player_id INTEGER ,
            weapon_id INTEGER ,
            kills INTEGER ,
            deaths INTEGER ,
            team_kills INTEGER ,
            suicides INTEGER
        ) STRICT`,

		`CREATE INDEX IF NOT EXISTS nmws_match_idx ON nstats_match_weapon_stats(match_id)`,

        `CREATE TABLE IF NOT EXISTS nstats_weapons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT COLLATE NOCASE 
        ) STRICT`,

        `CREATE TABLE IF NOT EXISTS nstats_kills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            match_id INTEGER ,
            timestamp REAL ,
            kill_type INTEGER ,
            killer_id INTEGER ,
            killer_weapon INTEGER ,
            victim_id INTEGER ,
            victim_weapon INTEGER
        ) STRICT`,
		 `CREATE INDEX IF NOT EXISTS nk_match_idx ON nstats_kills(match_id)`,

        `CREATE TABLE IF NOT EXISTS nstats_match_ctf (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            match_id INTEGER,     
            map_id INTEGER,
            gametype_id INTEGER,
            player_id INTEGER,
            flag_taken INTEGER,
            flag_pickup INTEGER,
            flag_drop INTEGER,
            flag_assist INTEGER,
            flag_cover INTEGER,
            flag_seal INTEGER,
            flag_cap INTEGER,
            flag_kill INTEGER,
            flag_return INTEGER,
            flag_return_base INTEGER,
            flag_return_mid INTEGER,
            flag_return_enemy_base INTEGER,
            flag_return_save INTEGER,
            flag_carry_time REAL ,
            flag_carry_time_min REAL ,
            flag_carry_time_max REAL 
        ) STRICT`,

		`CREATE INDEX IF NOT EXISTS nmc_match_idx ON nstats_match_ctf(match_id)`,

        `CREATE TABLE IF NOT EXISTS nstats_dom_control_points (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT COLLATE NOCASE 
        ) STRICT`,

        `CREATE TABLE IF NOT EXISTS nstats_match_dom (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            match_id INTEGER,  
            map_id INTEGER,
            gametype_id INTEGER,
            player_id INTEGER,
            point_id INTEGER,
            total_caps INTEGER,
            total_control_time REAL ,
            longest_control_time REAL ,
            shortest_control_time REAL ,
            control_percent REAL ,
            control_point_score REAL ,
            max_control_point_score REAL ,
            total_score_time REAL ,
            max_total_score_time REAL ,
            stolen_points REAL ,
            stolen_caps INTEGER
        ) STRICT`,
		 `CREATE INDEX IF NOT EXISTS nmd_match_idx ON nstats_match_dom(match_id)`,

        `CREATE TABLE IF NOT EXISTS nstats_player_totals (     
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id INTEGER,
            gametype_id INTEGER,
            map_id INTEGER,
            last_active TEXT ,
            playtime REAL ,
            total_matches INTEGER,
            wins INTEGER,
            draws INTEGER,
            losses INTEGER,
            winrate REAL ,
            score INTEGER,
            frags INTEGER,
            kills INTEGER,
            deaths INTEGER,
            suicides INTEGER,
            team_kills INTEGER,
            efficiency REAL ,
            ttl REAL ,
            first_blood INTEGER ,
            spree_1 INTEGER,
            spree_2 INTEGER,
            spree_3 INTEGER,
            spree_4 INTEGER,
            spree_5 INTEGER,
            spree_best INTEGER,
            multi_1 INTEGER,
            multi_2 INTEGER,
            multi_3 INTEGER,
            multi_4 INTEGER,
            multi_best INTEGER,
            headshots INTEGER,
            item_amp INTEGER,
            item_belt INTEGER,
            item_boots INTEGER,
            item_body INTEGER,
            item_pads INTEGER,
            item_invis INTEGER,
            item_shp INTEGER
        ) STRICT`,

		`CREATE UNIQUE INDEX IF NOT EXISTS npt_pgm_idx ON nstats_player_totals(player_id,gametype_id,map_id)`,

        `CREATE TABLE IF NOT EXISTS nstats_player_totals_weapons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id INTEGER ,
            gametype_id INTEGER ,
            weapon_id INTEGER ,
            total_matches INTEGER ,
            kills INTEGER ,
            deaths INTEGER ,
            suicides INTEGER ,
            team_kills INTEGER ,
            eff REAL
        ) STRICT`,
		 `CREATE UNIQUE INDEX IF NOT EXISTS pgw_idx ON nstats_player_totals_weapons(player_id, gametype_id, weapon_id)`,

        `CREATE TABLE IF NOT EXISTS nstats_player_totals_ctf (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id INTEGER,
            gametype_id INTEGER,
            map_id INTEGER,
            total_matches INTEGER,
            flag_taken INTEGER,
            max_flag_taken INTEGER,
            flag_pickup INTEGER,
            max_flag_pickup INTEGER,
            flag_drop INTEGER,
            max_flag_drop INTEGER,
            flag_assist INTEGER,
            max_flag_assist INTEGER,
            flag_cover INTEGER,
            max_flag_cover INTEGER,
            flag_seal INTEGER,
            max_flag_seal INTEGER,
            flag_cap INTEGER,
            max_flag_cap INTEGER,
            flag_kill INTEGER,
            max_flag_kill INTEGER,
            flag_return INTEGER,
            max_flag_return INTEGER,
            flag_return_base INTEGER,
            max_flag_return_base INTEGER,
            flag_return_mid INTEGER,
            max_flag_return_mid INTEGER,
            flag_return_enemy_base INTEGER,
            max_flag_return_enemy_base INTEGER,
            flag_return_save INTEGER,
            max_flag_return_save INTEGER
        ) STRICT`,

		`CREATE UNIQUE INDEX IF NOT EXISTS nptc_pgm_idx ON nstats_player_totals_ctf(player_id, gametype_id, map_id)`,

        `CREATE TABLE IF NOT EXISTS nstats_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT COLLATE NOCASE ,
            password TEXT COLLATE NOCASE ,
            activated INTEGER 
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
            date TEXT ,
            importer_id INTEGER,
            ftp_ip TEXT ,
            file_size INTEGER
        ) STRICT`,

		`CREATE UNIQUE INDEX IF NOT EXISTS nld_name_idx ON nstats_logs_downloads(file_name)`,

        `CREATE TABLE IF NOT EXISTS nstats_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_name TEXT COLLATE NOCASE ,
            date TEXT ,
            match_id INTEGER 
        ) STRICT`,

        `CREATE TABLE IF NOT EXISTS nstats_logs_rejected (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_name TEXT COLLATE NOCASE,
            date TEXT ,
            reason TEXT 
        ) STRICT`,

        `CREATE TABLE IF NOT EXISTS nstats_site_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT COLLATE NOCASE,
            setting_type TEXT COLLATE NOCASE,
            setting_name TEXT COLLATE NOCASE,
            setting_value text 
        ) STRICT`,


        `CREATE TABLE IF NOT EXISTS nstats_importer_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            importer_id INTEGER,
            date TEXT ,
            logs_found INTEGER,
            imported INTEGER,
            failed INTEGER,
            total_time REAL 
            ) STRICT`,

        `CREATE TABLE IF NOT EXISTS nstats_rankings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id INTEGER,
            gametype_id INTEGER,
            matches INTEGER,
            playtime REAL ,
            score REAL ,
            last_active TEXT 
            ) STRICT`,
			 `CREATE UNIQUE INDEX IF NOT EXISTS pg_idx ON nstats_rankings(player_id,gametype_id)`,

        `CREATE TABLE IF NOT EXISTS nstats_ranking_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT ,
            name TEXT COLLATE NOCASE ,
            display_name TEXT COLLATE NOCASE ,
            points REAL 
        ) STRICT`,

        `CREATE TABLE IF NOT EXISTS nstats_page_layout (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            page TEXT ,
            item TEXT ,
            page_order INTEGER 
        ) STRICT`,

        `CREATE TABLE IF NOT EXISTS nstats_damage_match (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id INTEGER,
            match_id INTEGER,
            map_id INTEGER,
            gametype_id INTEGER,
            damage_delt INTEGER,
            damage_taken INTEGER,
            self_damage INTEGER,
            team_damage_delt INTEGER,
            team_damage_taken INTEGER,
            fall_damage INTEGER,
            drown_damage INTEGER,
            cannon_damage INTEGER
            ) STRICT`,

		`CREATE INDEX IF NOT EXISTS ndm_match_idx ON nstats_damage_match(match_id)`,

        `CREATE TABLE IF NOT EXISTS nstats_player_totals_damage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id INTEGER,
        gametype_id INTEGER,
        total_matches INTEGER,
        playtime REAL ,
        damage_delt INTEGER,
        damage_taken INTEGER,
        self_damage INTEGER,
        team_damage_delt INTEGER,
        team_damage_taken INTEGER,
        fall_damage INTEGER,
        drown_damage INTEGER,
        cannon_damage INTEGER
        ) STRICT`,


        `CREATE TABLE IF NOT EXISTS nstats_ctf_caps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_id INTEGER,
        map_id INTEGER,
        gametype_id INTEGER,
        cap_type INTEGER,
        flag_team INTEGER,
        capping_team INTEGER,
        taken_timestamp REAL ,
        taken_player INTEGER,
        cap_timestamp REAL ,
        cap_player INTEGER,
        cap_time REAL ,
        carry_time REAL ,
        drop_time REAL ,
        total_drops INTEGER,
        total_covers INTEGER,
        unique_carriers INTEGER,
        red_kills INTEGER,
        blue_kills INTEGER,
        green_kills INTEGER,
        yellow_kills INTEGER,
        red_suicides INTEGER,
        blue_suicides INTEGER,
        green_suicides INTEGER,
        yellow_suicides INTEGER
        ) STRICT`,
		`CREATE INDEX IF NOT EXISTS nccaps_match_idx ON nstats_ctf_caps(match_id)`,


    `CREATE TABLE IF NOT EXISTS nstats_ctf_covers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER,
    cap_id INTEGER,
    timestamp REAL ,
    player_id INTEGER
    ) STRICT`,
	 `CREATE INDEX IF NOT EXISTS nccovers_match_idx ON nstats_ctf_covers(match_id)`,

    
    `CREATE TABLE IF NOT EXISTS nstats_ctf_carry_times (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_id INTEGER,
        map_id INTEGER,
        gametype_id INTEGER,
        cap_id INTEGER,
        player_id INTEGER,
        start_timestamp REAL ,
        end_timestamp REAL ,
        carry_time REAL 
        ) STRICT`,
		`CREATE INDEX IF NOT EXISTS ncct_match_idx ON nstats_ctf_carry_times(match_id)`,


        `CREATE TABLE IF NOT EXISTS nstats_ctf_cap_kills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_id INTEGER,
        cap_id INTEGER,
        timestamp REAL ,
        killer_id INTEGER,
        killer_team INTEGER
        ) STRICT`,
		 `CREATE INDEX IF NOT EXISTS ncck_match_idx ON nstats_ctf_cap_kills(match_id)`,

        `CREATE TABLE IF NOT EXISTS nstats_ctf_cap_suicides (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_id INTEGER,
        cap_id INTEGER,
        timestamp REAL ,
        player_id INTEGER,
        player_team INTEGER
        ) STRICT`,
		 
		 `CREATE INDEX IF NOT EXISTS nccs_match_idx ON nstats_ctf_cap_suicides(match_id)`,


        `CREATE TABLE IF NOT EXISTS nstats_player_map_minute_averages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id INTEGER,
        map_id INTEGER,
        gametype_id INTEGER,
        total_playtime REAL ,
        total_matches REAL ,
        score REAL ,
        frags REAL ,
        kills REAL ,
        deaths REAL ,
        suicides REAL ,
        team_kills REAL ,
        headshots REAL ,
        item_amp REAL ,
        item_belt REAL ,
        item_boots REAL ,
        item_body REAL ,
        item_pads REAL ,
        item_invis REAL ,
        item_shp REAL ,
        flag_taken REAL ,
        flag_pickup REAL ,
        flag_drop REAL ,
        flag_assist REAL ,
        flag_cover REAL ,
        flag_seal REAL ,
        flag_cap REAL ,
        flag_kills REAL ,
        flag_return REAL ,
        flag_return_base REAL ,
        flag_return_mid REAL ,
        flag_return_enemy_base REAL ,
        flag_return_save REAL ,
        dom_caps REAL
        ) STRICT`,

		`CREATE UNIQUE INDEX IF NOT EXISTS pmg_idx ON nstats_player_map_minute_averages(player_id,map_id,gametype_id)`,


        `CREATE TABLE IF NOT EXISTS nstats_map_weapon_totals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            map_id INTEGER ,
            total_matches INTEGER ,
            total_playtime REAL ,
            weapon_id INTEGER ,
            kills INTEGER ,
            deaths INTEGER ,
            suicides INTEGER ,
            team_kills INTEGER ,
            kills_per_min REAL ,
            deaths_per_min REAL ,
            team_kills_per_min REAL ,
            suicides_per_min REAL 
        ) STRICT`,
		 `CREATE UNIQUE INDEX IF NOT EXISTS mw_idx ON nstats_map_weapon_totals(map_id,weapon_id)`,

        `CREATE TABLE IF NOT EXISTS nstats_map_rankings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id INTEGER,
            map_id INTEGER,
            matches INTEGER,
            playtime REAL ,
            score REAL ,
            last_active TEXT
            ) STRICT`,
		`CREATE UNIQUE INDEX IF NOT EXISTS pm_idx ON nstats_map_rankings(player_id, map_id)`,


        `CREATE TABLE IF NOT EXISTS nstats_classic_weapon_match_stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            match_id INTEGER,
            gametype_id INTEGER,
            map_id INTEGER,
            player_id INTEGER,
            weapon_id INTEGER,
            kills INTEGER,
            deaths INTEGER,
            shots INTEGER,
            hits INTEGER,
            accuracy REAL ,
            damage INTEGER
            ) STRICT`,
			 `CREATE INDEX IF NOT EXISTS ncwms_match_idx ON nstats_classic_weapon_match_stats(match_id)`,

        `CREATE TABLE IF NOT EXISTS nstats_player_ctf_league (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id INTEGER,
        gametype_id INTEGER,
        map_id INTEGER,
        first_match TEXT ,
        last_match TEXT ,
        playtime REAL ,
        total_matches INTEGER,
        wins INTEGER,
        draws INTEGER,
        losses INTEGER,
        winrate REAL ,
        cap_for INTEGER,
        cap_against INTEGER,
        cap_offset INTEGER,
        points INTEGER
        ) STRICT`,
		 `CREATE INDEX IF NOT EXISTS npcl_mgp_idx ON nstats_player_ctf_league(map_id, gametype_id, player_id)`,
		 `CREATE UNIQUE INDEX IF NOT EXISTS npcl_pgm_idx ON nstats_player_ctf_league(player_id,gametype_id,map_id)`,

        `CREATE TABLE IF NOT EXISTS nstats_ctf_league_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT COLLATE NOCASE ,
        name TEXT COLLATE NOCASE ,
        type TEXT COLLATE NOCASE ,
        value TEXT
        ) STRICT`,

       `CREATE TABLE IF NOT EXISTS nstats_user_login_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT ,
        target_username TEXT COLLATE NOCASE,
        ip TEXT
        ) STRICT`,

        `CREATE TABLE IF NOT EXISTS nstats_match_dom_team_score_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_id INTEGER,
        timestamp REAL ,
        real_total_score REAL ,
        real_team_0_score REAL ,
        real_team_1_score REAL ,
        real_team_2_score REAL ,
        real_team_3_score REAL ,
        importer_total_score REAL ,
        importer_team_0_score REAL ,
        importer_team_1_score REAL ,
        importer_team_2_score REAL ,
        importer_team_3_score REAL 
        ) STRICT`,
		 `CREATE INDEX IF NOT EXISTS nmdtsh_match_idx ON nstats_match_dom_team_score_history(match_id)`,

        `CREATE TABLE IF NOT EXISTS nstats_json_api(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT COLLATE NOCASE ,
        setting_name TEXT COLLATE NOCASE ,
        setting_type TEXT COLLATE NOCASE ,
        setting_value TEXT
        ) STRICT`,

];

for(let i = 0; i < queries.length; i++){

	console.log(i);
	console.log(queries[i]);
	simpleQuery(queries[i]);
}



const rankingSettings = [
        // penalty is score * points
        {"category": "penalty", "name": "under_30", "displayName": "Under 30 Minutes Playtime Penalty", "points": 0.10},
        {"category": "penalty", "name": "under_60", "displayName": "Under 60 Minutes Playtime Penalty", "points": 0.15},
        {"category": "penalty", "name": "under_90", "displayName": "Under 90 Minutes Playtime Penalty", "points": 0.20},
        {"category": "penalty", "name": "under_120", "displayName": "Under 2 Hours Playtime Penalty", "points": 0.25},
        {"category": "penalty", "name": "under_180", "displayName": "Under 3 Hours Playtime Penalty", "points": 0.40},
        {"category": "penalty", "name": "under_240", "displayName": "Under 4 Hours Playtime Penalty", "points": 0.50},
        {"category": "penalty", "name": "under_300", "displayName": "Under 5 Hours Playtime Penalty", "points": 0.66},
        {"category": "penalty", "name": "under_600", "displayName": "Under 10 Hours Playtime Penalty", "points": 0.75},
        {"category": "penalty", "name": "min_matches", "displayName": "Minimum Matches Played", "points": 20},
        {"category": "penalty", "name": "map_min_matches", "displayName": "Minimum Matches Played(Map Rankings)", "points": 5},

        {"category": "general", "name": "kills", "displayName": "Kill", "points": 300},
        {"category": "general", "name": "deaths", "displayName": "Death", "points": -150},
        {"category": "general", "name": "suicides", "displayName": "Suicide", "points": -150},
        {"category": "general", "name": "team_kills", "displayName": "Team Kill", "points": -1200},
        {"category": "general", "name": "spree_1", "displayName": "Killing Spree", "points": 600},
        {"category": "general", "name": "spree_2", "displayName": "Rampage", "points": 600},
        {"category": "general", "name": "spree_3", "displayName": "Dominating", "points": 900},
        {"category": "general", "name": "spree_4", "displayName": "Unstoppable", "points": 1200},
        {"category": "general", "name": "spree_5", "displayName": "Godlike", "points": 1800},
        {"category": "general", "name": "multi_1", "displayName": "Double Kill", "points": 600},
        {"category": "general", "name": "multi_2", "displayName": "Multi Kill", "points": 600},
        {"category": "general", "name": "multi_3", "displayName": "Ultra Kill", "points": 600},
        {"category": "general", "name": "multi_4", "displayName": "Monster Kill", "points": 1200},

        {"category": "ctf", "name": "flag_taken", "displayName": "Flag Taken", "points": 600},
        {"category": "ctf", "name": "flag_pickup", "displayName": "Flag Pickup", "points": 600},
        {"category": "ctf", "name": "flag_drop", "displayName": "Flag Dropped", "points": 0},
        {"category": "ctf", "name": "flag_assist", "displayName": "Flag Assist", "points": 3000},
        {"category": "ctf", "name": "flag_cover", "displayName": "Flag Cover", "points": 1800},
        {"category": "ctf", "name": "flag_seal", "displayName": "Flag Seal", "points": 1200},
        {"category": "ctf", "name": "flag_cap", "displayName": "Flag Capture", "points": 6000},
        {"category": "ctf", "name": "flag_kill", "displayName": "Flag Kill", "points": 1200},
        {"category": "ctf", "name": "flag_return", "displayName": "Flag Return", "points": 600},
        {"category": "ctf", "name": "flag_return_base", "displayName": "Flag Return Base", "points": 50},
        {"category": "ctf", "name": "flag_return_mid", "displayName": "Flag Return Mid", "points": 100},
        {"category": "ctf", "name": "flag_return_enemy_base", "displayName": "Flag Return Enemy Base", "points": 200},
        {"category": "ctf", "name": "flag_return_save", "displayName": "Flag Return Save", "points": 250},
    ];

for(let i = 0; i < rankingSettings.length; i++){
	const {category, name, displayName, points} = rankingSettings[i];

	simpleQuery(`INSERT INTO nstats_ranking_settings VALUES(NULL,?,?,?,?)`, [category, name, displayName, points]);
}



    const dummyDate = new Date(0);

    const leagueSettings = [
        {"category": "combined", "name": "Maximum Matches Per Player", "type": "integer", "value": 20},
        {"category": "combined", "name": "Maximum Match Age In Days", "type": "integer", "value": 180},
        {"category": "combined", "name": "Enable League", "type": "bool", "value": "true"},
        {"category": "combined", "name": "Update Whole League End Of Import", "type": "bool", "value": "true"},
        {"category": "combined", "name": "Last Whole League Refresh", "type": "datetime", "value": dummyDate.toISOString()},

        {"category": "maps", "name": "Maximum Matches Per Player", "type": "integer", "value": 20},
        {"category": "maps", "name": "Maximum Match Age In Days", "type": "integer", "value": 180},
        {"category": "maps", "name": "Enable League", "type": "bool", "value": "true"},
        {"category": "maps", "name": "Update Whole League End Of Import", "type": "bool", "value": "true"},
        {"category": "maps", "name": "Last Whole League Refresh", "type": "datetime", "value": dummyDate.toISOString()},
        {"category": "gametypes", "name": "Maximum Matches Per Player", "type": "integer", "value": 20},
        {"category": "gametypes", "name": "Maximum Match Age In Days", "type": "integer", "value": 180},
        {"category": "gametypes", "name": "Enable League", "type": "bool", "value": "true"},
        {"category": "gametypes", "name": "Update Whole League End Of Import", "type": "bool", "value": "true"},
        {"category": "gametypes", "name": "Last Whole League Refresh", "type": "datetime", "value": dummyDate.toISOString()},
    ];

	for(let i = 0; i < leagueSettings.length; i++){
		const {category, name, type, value} = leagueSettings[i];

		simpleQuery(`INSERT INTO nstats_ctf_league_settings VALUES(NULL,?,?,?,?)`, [category, name, type, value]);

	}

simpleQuery(`INSERT INTO nstats_logs_folder VALUES(NULL, '1999-11-30 00:00:00','1999-11-30 00:00:00',0,0,0,0,0,0,0)`);

await restoreDefaultSettings();
await addPageLayouts();

/*import { Jimp } from "jimp";
import {readFile, writeFile} from "fs/promises";

const test = await readFile("./public/images/maps/default.jpg");

const image = await Jimp.fromBuffer(test);

const resized = await image
  .resize({ w: 512 })
  .getBuffer('image/jpeg', { quality: 12 });

  console.log(resized);

await writeFile("./justwork.jpg", resized);*/