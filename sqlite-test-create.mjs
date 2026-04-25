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
      ) `,

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
        ) `,  

        `CREATE TABLE IF NOT EXISTS nstats_players (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT ,
            country TEXT ,
            hash TEXT
        ) `,

		`CREATE INDEX np_name_idx ON nstats_players(name)`,
		`CREATE INDEX np_hash_idx ON nstats_players(hash)`,

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
        ) `,

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
        ) `,
		`CREATE INDEX match_idx ON nstats_matches_dom(match_id)`,

        `CREATE TABLE IF NOT EXISTS nstats_servers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT ,
            ip TEXT ,
            port INTEGER ,
            matches INTEGER ,
            playtime REAL ,
            first_match TEXT ,
            last_match TEXT 
        ) `,

        `CREATE TABLE IF NOT EXISTS nstats_gametypes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT ,
            matches INTEGER ,
            playtime REAL ,
            first_match TEXT ,
            last_match TEXT 
        ) `,

        `CREATE TABLE IF NOT EXISTS nstats_maps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT ,
            matches INTEGER,
            playtime REAL ,
            first_match TEXT ,
            last_match TEXT 
        ) `,

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
        ) `,

		`CREATE INDEX nmp_match_idx ON nstats_match_players(match_id)`,
		`CREATE INDEX nmp_player_idx ON nstats_match_players(player_id)`,

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
        ) `,

		`CREATE INDEX nmws_match_idx ON nstats_match_weapon_stats(match_id)`,

        `CREATE TABLE IF NOT EXISTS nstats_weapons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT 
        ) `,

        `CREATE TABLE IF NOT EXISTS nstats_kills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            match_id INTEGER ,
            timestamp REAL ,
            kill_type INTEGER ,
            killer_id INTEGER ,
            killer_weapon INTEGER ,
            victim_id INTEGER ,
            victim_weapon INTEGER
        ) `,
		 `CREATE INDEX nk_match_idx ON nstats_kills(match_id)`,

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
        ) `,

		`CREATE INDEX nmc_match_idx ON nstats_match_ctf(match_id)`,

        `CREATE TABLE IF NOT EXISTS nstats_dom_control_points (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT 
        ) `,

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
        ) `,
		 `CREATE INDEX nmd_match_idx ON nstats_match_dom(match_id)`,

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
        ) `,

		`CREATE UNIQUE INDEX npt_pgm_idx ON nstats_player_totals(player_id,gametype_id,map_id)`,

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
        ) `,
		 `CREATE UNIQUE INDEX pgw_idx ON nstats_player_totals_weapons(player_id, gametype_id, weapon_id)`,

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
        ) `,

		`CREATE UNIQUE INDEX nptc_pgm_idx ON nstats_player_totals_ctf(player_id, gametype_id, map_id)`,

        `CREATE TABLE IF NOT EXISTS nstats_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT ,
            password TEXT ,
            activated INTEGER 
        ) `,

        /*`CREATE TABLE IF NOT EXISTS nstats_sessions (
        session_id TEXT COLLATE utf8mb4_bin ,
        expires INTEGER unsigned ,
        user_id INTEGER unsigned DEFAULT 0,
        data mediumtext COLLATE utf8mb4_bin,
        PRIMARY KEY (session_id)
        ) ENGINE=InnoDB`,*/

        `CREATE TABLE IF NOT EXISTS nstats_logs_downloads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_name TEXT ,
            date TEXT ,
            importer_id INTEGER,
            ftp_ip TEXT ,
            file_size INTEGER
        ) `,

		`CREATE UNIQUE INDEX nld_name_idx ON nstats_logs_downloads(file_name)`,

        `CREATE TABLE IF NOT EXISTS nstats_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_name TEXT ,
            date TEXT ,
            match_id INTEGER 
        ) `,

        `CREATE TABLE IF NOT EXISTS nstats_logs_rejected (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_name TEXT ,
            date TEXT ,
            reason TEXT 
        ) `,

        `CREATE TABLE IF NOT EXISTS nstats_site_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT ,
            setting_type TEXT ,
            setting_name TEXT ,
            setting_value text 
        ) `,


        `CREATE TABLE IF NOT EXISTS nstats_importer_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            importer_id INTEGER,
            date TEXT ,
            logs_found INTEGER,
            imported INTEGER,
            failed INTEGER,
            total_time REAL 
            ) `,

        `CREATE TABLE IF NOT EXISTS nstats_rankings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id INTEGER,
            gametype_id INTEGER,
            matches INTEGER,
            playtime REAL ,
            score REAL ,
            last_active TEXT 
            ) `,
			 `CREATE UNIQUE INDEX pg_idx ON nstats_rankings(player_id,gametype_id)`,

        `CREATE TABLE IF NOT EXISTS nstats_ranking_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT ,
            name TEXT ,
            display_name TEXT ,
            points REAL 
        ) `,

        `CREATE TABLE IF NOT EXISTS nstats_page_layout (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            page TEXT ,
            item TEXT ,
            page_order INTEGER 
        ) `,

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
            ) `,

		`CREATE INDEX ndm_match_idx ON nstats_damage_match(match_id)`,

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
        ) `,


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
        ) `,
		`CREATE INDEX nccaps_match_idx ON nstats_ctf_caps(match_id)`,


    `CREATE TABLE IF NOT EXISTS nstats_ctf_covers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER,
    cap_id INTEGER,
    timestamp REAL ,
    player_id INTEGER
    ) `,
	 `CREATE INDEX nccovers_match_idx ON nstats_ctf_covers(match_id)`,

    
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
        ) `,
		`CREATE INDEX ncct_match_idx ON nstats_ctf_carry_times(match_id)`,


        `CREATE TABLE IF NOT EXISTS nstats_ctf_cap_kills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_id INTEGER,
        cap_id INTEGER,
        timestamp REAL ,
        killer_id INTEGER,
        killer_team INTEGER
        ) `,
		 `CREATE INDEX ncck_match_idx ON nstats_ctf_cap_kills(match_id)`,

        `CREATE TABLE IF NOT EXISTS nstats_ctf_cap_suicides (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_id INTEGER,
        cap_id INTEGER,
        timestamp REAL ,
        player_id INTEGER,
        player_team INTEGER
        ) `,
		 
		 `CREATE INDEX nccs_match_idx ON nstats_ctf_cap_suicides(match_id)`,


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
        ) `,

		`CREATE UNIQUE INDEX pmg_idx ON nstats_player_map_minute_averages(player_id,map_id,gametype_id)`,


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
        ) `,
		 `CREATE UNIQUE INDEX mw_idx ON nstats_map_weapon_totals(map_id,weapon_id)`,

        `CREATE TABLE IF NOT EXISTS nstats_map_rankings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id INTEGER,
            map_id INTEGER,
            matches INTEGER,
            playtime REAL ,
            score REAL ,
            last_active TEXT
            ) `,
		`CREATE UNIQUE INDEX pm_idx ON nstats_map_rankings(player_id, map_id)`,


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
            ) `,
			 `CREATE INDEX ncwms_match_idx ON nstats_classic_weapon_match_stats(match_id)`,

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
        ) `,
		 `CREATE INDEX npcl_mgp_idx ON nstats_player_ctf_league(map_id, gametype_id, player_id)`,
		 `CREATE UNIQUE INDEX npcl_pgm_idx ON nstats_player_ctf_league(player_id,gametype_id,map_id)`,

        `CREATE TABLE IF NOT EXISTS nstats_ctf_league_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT ,
        name TEXT ,
        type TEXT ,
        value TEXT
        ) `,

       `CREATE TABLE IF NOT EXISTS nstats_user_login_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT ,
        target_username TEXT,
        ip TEXT
        ) `,

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
        ) `,
		 `CREATE INDEX nmdtsh_match_idx ON nstats_match_dom_team_score_history(match_id)`,

        `CREATE TABLE IF NOT EXISTS nstats_json_api(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT ,
        setting_name TEXT ,
        setting_type TEXT ,
        setting_value TEXT
        ) `,

];