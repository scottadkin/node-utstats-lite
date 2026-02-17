
import fs from "fs";
import Message from "./src/message.mjs";
import { mysqlSettings } from "./config.mjs";
import mysql from "mysql2/promise";
import {createRandomString} from "./src/generic.mjs";
import { simpleQuery } from "./src/database.mjs";
import { restoreDefaultSettings } from "./src/siteSettings.mjs";
import { restoreDefaultLayouts } from "./src/pageLayout.mjs";
import { setMatchMapGametypeIds } from "./src/players.mjs";
import { setAllPlayerMapAverages } from "./src/players.mjs";
import { setAllMapTotals } from "./src/weapons.mjs";
import { setMatchMapGametypeIds as damageSetMatchMapGametypeIds } from "./src/damage.mjs";
import { refreshAllTables } from "./src/ctfLeague.mjs";

let connection = mysql.createPool({
    "host": mysqlSettings.host,
    "user": mysqlSettings.user,
    "password": mysqlSettings.password
});


const queries = [
    `CREATE DATABASE IF NOT EXISTS ${mysqlSettings.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    `CREATE TABLE IF NOT EXISTS nstats_ftp (
        id int(11) NOT NULL AUTO_INCREMENT,
        name varchar(100) NOT NULL,
        host varchar(250) NOT NULL,
        port int(11) NOT NULL,
        user varchar(50) NOT NULL,
        password varchar(50) NOT NULL,
        target_folder varchar(250) NOT NULL,
        delete_after_import tinyint(1) NOT NULL,
        first datetime NOT NULL,
        last datetime NOT NULL,
        total_imports int(11) NOT NULL,
        total_logs_imported int(11) NOT NULL,
        ignore_bots int(1) NOT NULL,
        ignore_duplicates int(1) NOT NULL,
        min_players int(2) NOT NULL,
        min_playtime int(11) NOT NULL,
        sftp int(1) NOT NULL,
        enabled INT(1) NOT NULL,
        delete_tmp_files INT(1) NOT NULL,
        append_team_sizes INT(1) NOT NULL
      ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

        `CREATE TABLE IF NOT EXISTS nstats_logs_folder (
        id int(11) NOT NULL AUTO_INCREMENT,
        first datetime NOT NULL,
        last datetime NOT NULL,
        total_imports int(11) NOT NULL,
        total_logs_imported int(11) NOT NULL,
        ignore_bots int(1) NOT NULL,
        ignore_duplicates int(1) NOT NULL,
        min_players int(2) NOT NULL,
        min_playtime int(11) NOT NULL,
        append_team_sizes INT(1) NOT NULL
        ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,  

        `CREATE TABLE IF NOT EXISTS nstats_players (
            id int(11) NOT NULL AUTO_INCREMENT,
            name varchar(32) NOT NULL,
            country varchar(3) NOT NULL,
            hash varchar(32) NOT NULL
        ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        `CREATE TABLE IF NOT EXISTS nstats_matches (
            id int(11) NOT NULL AUTO_INCREMENT,
            server_id int(11) NOT NULL,
            gametype_id int(11) NOT NULL,
            map_id int(11) NOT NULL,
            hardcore int(1) NOT NULL,
            insta int(1) NOT NULL,
            date datetime NOT NULL,
            playtime float NOT NULL,
            match_start float NOT NULL,
            match_end float NOT NULL,
            players int(11) NOT NULL,
            total_teams int(1) NOT NULL,
            team_0_score int(11) NOT NULL,   
            team_1_score int(11) NOT NULL,   
            team_2_score int(11) NOT NULL,   
            team_3_score int(11) NOT NULL,   
            solo_winner int(11) NOT NULL,
            solo_winner_score int(11) NOT NULL,
            target_score int(11) NOT NULL,
            time_limit int(11) NOT NULL,
            mutators text NOT NULL,
            hash varchar(32) NOT NULL
        ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        `CREATE TABLE IF NOT EXISTS nstats_matches_dom (
            id int(11) NOT NULL AUTO_INCREMENT,
            match_id int(11) NOT NULL,
            real_total_score FLOAT NOT NULL,
            importer_total_score FLOAT NOT NULL,
            total_control_time FLOAT NOT NULL,
            total_score_time FLOAT NOT NULL,
            team_0_real_score FLOAT NOT NULL,
            team_1_real_score FLOAT NOT NULL,
            team_2_real_score FLOAT NOT NULL,
            team_3_real_score FLOAT NOT NULL,
            team_0_importer_score FLOAT NOT NULL,
            team_1_importer_score FLOAT NOT NULL,
            team_2_importer_score FLOAT NOT NULL,
            team_3_importer_score FLOAT NOT NULL,
            team_0_control_time FLOAT NOT NULL,
            team_1_control_time FLOAT NOT NULL,
            team_2_control_time FLOAT NOT NULL,
            team_3_control_time FLOAT NOT NULL,
            team_0_control_percent FLOAT NOT NULL,
            team_1_control_percent FLOAT NOT NULL,
            team_2_control_percent FLOAT NOT NULL,
            team_3_control_percent FLOAT NOT NULL,
            team_0_caps int NOT NULL,
            team_1_caps int NOT NULL,
            team_2_caps int NOT NULL,
            team_3_caps int NOT NULL,
            team_0_score_time float NOT NULL,
            team_1_score_time float NOT NULL,
            team_2_score_time float NOT NULL,
            team_3_score_time float NOT NULL,
            team_0_stolen_points float NOT NULL,
            team_1_stolen_points float NOT NULL,
            team_2_stolen_points float NOT NULL,
            team_3_stolen_points float NOT NULL,
            team_0_stolen_caps int NOT NULL,
            team_1_stolen_caps int NOT NULL,
            team_2_stolen_caps int NOT NULL,
            team_3_stolen_caps int NOT NULL
        ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
        `CREATE TABLE IF NOT EXISTS nstats_servers (
            id int(11) NOT NULL AUTO_INCREMENT,
            name varchar(255) NOT NULL,
            ip varchar(39) NOT NULL,
            port int(11) NOT NULL,
            matches INT(11) NOT NULL,
            playtime float NOT NULL,
            first_match datetime NOT NULL,
            last_match datetime NOT NULL
        ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        `CREATE TABLE IF NOT EXISTS nstats_gametypes (
            id int(11) NOT NULL AUTO_INCREMENT,
            name varchar(255) NOT NULL,
            matches INT(11) NOT NULL,
            playtime float NOT NULL,
            first_match datetime NOT NULL,
            last_match datetime NOT NULL
        ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        `CREATE TABLE IF NOT EXISTS nstats_maps (
            id int(11) NOT NULL AUTO_INCREMENT,
            name varchar(255) NOT NULL,
            matches int NOT NULL,
            playtime float NOT NULL,
            first_match datetime NOT NULL,
            last_match datetime NOT NULL
        ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        `CREATE TABLE IF NOT EXISTS nstats_match_players (     
            id int NOT NULL AUTO_INCREMENT,
            player_id int NOT NULL,
            spectator int(1) NOT NULL,
            ip varchar(39) COLLATE utf8mb4_unicode_ci NOT NULL,
            country varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL,
            hwid varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
            mac1 varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
            mac2 varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
            match_id int NOT NULL,
            map_id int NOT NULL,
            gametype_id int NOT NULL,
            match_date datetime NOT NULL,
            match_result varchar(1) NOT NULL,
            bot int(1) NOT NULL,
            ping_min int(11) NOT NULL,
            ping_avg int(11) NOT NULL,
            ping_max int(11) NOT NULL,
            team int(3) NOT NULL,
            score int NOT NULL,
            frags int NOT NULL,
            kills int NOT NULL,
            deaths int NOT NULL,
            suicides int NOT NULL,
            team_kills int NOT NULL,
            efficiency float NOT NULL,
            time_on_server float NOT NULL,
            ttl float NOT NULL,
            first_blood int(1) NOT NULL,
            spree_1 int NOT NULL,
            spree_2 int NOT NULL,
            spree_3 int NOT NULL,
            spree_4 int NOT NULL,
            spree_5 int NOT NULL,
            spree_best int NOT NULL,
            multi_1 int NOT NULL,
            multi_2 int NOT NULL,
            multi_3 int NOT NULL,
            multi_4 int NOT NULL,
            multi_best int NOT NULL,
            headshots int NOT NULL,
            item_amp int NOT NULL,
            item_belt int NOT NULL,
            item_boots int NOT NULL,
            item_body int NOT NULL,
            item_pads int NOT NULL,
            item_invis int NOT NULL,
            item_shp int NOT NULL
        ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        `CREATE TABLE IF NOT EXISTS nstats_match_weapon_stats (
            id int(11) NOT NULL AUTO_INCREMENT,
            match_id int(11) NOT NULL,
            map_id int(11) NOT NULL,
            gametype_id int(11) NOT NULL,
            player_id int(11) NOT NULL,
            weapon_id int(11) NOT NULL,
            kills int(11) NOT NULL,
            deaths int(11) NOT NULL,
            team_kills int(11) NOT NULL,
            suicides int(11) NOT NULL
        ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        `CREATE TABLE IF NOT EXISTS nstats_weapons (
            id int(11) NOT NULL AUTO_INCREMENT,
            name varchar(255) NOT NULL
        ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        `CREATE TABLE IF NOT EXISTS nstats_kills (
            id bigint NOT NULL AUTO_INCREMENT,
            match_id int(11) NOT NULL,
            timestamp float NOT NULL,
            kill_type int(11) NOT NULL,
            killer_id int(11) NOT NULL,
            killer_weapon int(11) NOT NULL,
            victim_id int(11) NOT NULL,
            victim_weapon int(11) NOT NULL
        ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        `CREATE TABLE IF NOT EXISTS nstats_match_ctf (
            id int NOT NULL AUTO_INCREMENT,
            match_id int NOT NULL,     
            map_id int NOT NULL,
            gametype_id int NOT NULL,
            player_id int NOT NULL,
            flag_taken int NOT NULL,
            flag_pickup int NOT NULL,
            flag_drop int NOT NULL,
            flag_assist int NOT NULL,
            flag_cover int NOT NULL,
            flag_seal int NOT NULL,
            flag_cap int NOT NULL,
            flag_kill int NOT NULL,
            flag_return int NOT NULL,
            flag_return_base int NOT NULL,
            flag_return_mid int NOT NULL,
            flag_return_enemy_base int NOT NULL,
            flag_return_save int NOT NULL,
            flag_carry_time FLOAT NOT NULL,
            flag_carry_time_min FLOAT NOT NULL,
            flag_carry_time_max FLOAT NOT NULL
        ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        `CREATE TABLE IF NOT EXISTS nstats_dom_control_points (
            id int NOT NULL AUTO_INCREMENT,
            name varchar(255) NOT NULL
        ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        `CREATE TABLE IF NOT EXISTS nstats_match_dom (
            id int NOT NULL AUTO_INCREMENT,
            match_id int NOT NULL,  
            map_id int NOT NULL,
            gametype_id int NOT NULL,
            player_id int NOT NULL,
            point_id int NOT NULL,
            total_caps int NOT NULL,
            total_control_time float NOT NULL,
            longest_control_time float NOT NULL,
            shortest_control_time float NOT NULL,
            control_percent float NOT NULL,
            control_point_score float NOT NULL,
            max_control_point_score float NOT NULL,
            total_score_time float NOT NULL,
            max_total_score_time float NOT NULL,
            stolen_points float NOT NULL,
            stolen_caps int NOT NULL
        ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        `CREATE TABLE IF NOT EXISTS nstats_player_totals (     
            id int NOT NULL AUTO_INCREMENT,
            player_id int NOT NULL,
            gametype_id int NOT NULL,
            map_id int NOT NULL,
            last_active datetime NOT NULL,
            playtime float NOT NULL,
            total_matches int NOT NULL,
            wins int NOT NULL,
            draws int NOT NULL,
            losses int NOT NULL,
            winrate float NOT NULL,
            score int NOT NULL,
            frags int NOT NULL,
            kills int NOT NULL,
            deaths int NOT NULL,
            suicides int NOT NULL,
            team_kills int NOT NULL,
            efficiency float NOT NULL,
            ttl float NOT NULL,
            first_blood int(1) NOT NULL,
            spree_1 int NOT NULL,
            spree_2 int NOT NULL,
            spree_3 int NOT NULL,
            spree_4 int NOT NULL,
            spree_5 int NOT NULL,
            spree_best int NOT NULL,
            multi_1 int NOT NULL,
            multi_2 int NOT NULL,
            multi_3 int NOT NULL,
            multi_4 int NOT NULL,
            multi_best int NOT NULL,
            headshots int NOT NULL,
            item_amp int NOT NULL,
            item_belt int NOT NULL,
            item_boots int NOT NULL,
            item_body int NOT NULL,
            item_pads int NOT NULL,
            item_invis int NOT NULL,
            item_shp int NOT NULL
        ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        `CREATE TABLE IF NOT EXISTS nstats_player_totals_weapons (
            id int(11) NOT NULL AUTO_INCREMENT,
            player_id int(11) NOT NULL,
            gametype_id int(11) NOT NULL,
            weapon_id int(11) NOT NULL,
            total_matches int(11) NOT NULL,
            kills int(11) NOT NULL,
            deaths int(11) NOT NULL,
            suicides int(11) NOT NULL,
            team_kills int(11) NOT NULL,
            eff float NOT NULL
        ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        `CREATE TABLE IF NOT EXISTS nstats_player_totals_ctf (
            id int NOT NULL AUTO_INCREMENT,
            player_id int NOT NULL,
            gametype_id int NOT NULL,
            map_id int NOT NULL,
            total_matches int NOT NULL,
            flag_taken int NOT NULL,
            max_flag_taken int NOT NULL,
            flag_pickup int NOT NULL,
            max_flag_pickup int NOT NULL,
            flag_drop int NOT NULL,
            max_flag_drop int NOT NULL,
            flag_assist int NOT NULL,
            max_flag_assist int NOT NULL,
            flag_cover int NOT NULL,
            max_flag_cover int NOT NULL,
            flag_seal int NOT NULL,
            max_flag_seal int NOT NULL,
            flag_cap int NOT NULL,
            max_flag_cap int NOT NULL,
            flag_kill int NOT NULL,
            max_flag_kill int NOT NULL,
            flag_return int NOT NULL,
            max_flag_return int NOT NULL,
            flag_return_base int NOT NULL,
            max_flag_return_base int NOT NULL,
            flag_return_mid int NOT NULL,
            max_flag_return_mid int NOT NULL,
            flag_return_enemy_base int NOT NULL,
            max_flag_return_enemy_base int NOT NULL,
            flag_return_save int NOT NULL,
            max_flag_return_save int NOT NULL
        ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        `CREATE TABLE IF NOT EXISTS nstats_users (
            id int NOT NULL AUTO_INCREMENT,
            name varchar(100) NOT NULL,
            password varchar(64) NOT NULL,
            activated tinyint NOT NULL
        ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        `CREATE TABLE IF NOT EXISTS nstats_sessions (
        session_id varchar(128) COLLATE utf8mb4_bin NOT NULL,
        expires int(11) unsigned NOT NULL,
        user_id int(11) unsigned DEFAULT 0,
        data mediumtext COLLATE utf8mb4_bin,
        PRIMARY KEY (session_id)
        ) ENGINE=InnoDB`,
       /* `CREATE TABLE IF NOT EXISTS nstats_sessions (
            id int NOT NULL AUTO_INCREMENT,
            session_id varchar(128) NOT NULL,
            user_id int NOT NULL,
            expires datetime NOT NULL,
            data mediumtext NOT NULL
        ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,*/

        `CREATE TABLE IF NOT EXISTS nstats_logs (
            id int NOT NULL AUTO_INCREMENT,
            file_name varchar(255) NOT NULL,
            date datetime NOT NULL,
            importer_id int NOT NULL,
            match_id int NOT NULL
        ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        `CREATE TABLE IF NOT EXISTS nstats_logs_rejected (
            id int NOT NULL AUTO_INCREMENT,
            file_name varchar(255) NOT NULL,
            date datetime NOT NULL,
            importer_id int NOT NULL,
            reason varchar(255) NOT NULL
        ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        `CREATE TABLE IF NOT EXISTS nstats_logs_history (
            id int NOT NULL AUTO_INCREMENT,
            importer_id int NOT NULL,
            date datetime NOT NULL,
            logs_found int NOT NULL,
            imported int NOT NULL,
            failed int NOT NULL
        ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        `CREATE TABLE IF NOT EXISTS nstats_site_settings (
            id int NOT NULL AUTO_INCREMENT,
            category varchar(255) NOT NULL,
            setting_type varchar(255) NOT NULL,
            setting_name varchar(255) NOT NULL,
            setting_value text NOT NULL
        ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,


        `CREATE TABLE IF NOT EXISTS nstats_importer_history (
            id int NOT NULL AUTO_INCREMENT,
            importer_id int NOT NULL,
            date datetime NOT NULL,
            logs_found int NOT NULL,
            imported int NOT NULL,
            failed int NOT NULL,
            total_time float NOT NULL
            ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        `CREATE TABLE IF NOT EXISTS nstats_rankings (
            id int NOT NULL AUTO_INCREMENT,
            player_id int NOT NULL,
            gametype_id int NOT NULL,
            matches int NOT NULL,
            playtime float NOT NULL,
            score float NOT NULL,
            last_active datetime NOT NULL
            ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        `CREATE TABLE IF NOT EXISTS nstats_ranking_settings (
            id int NOT NULL AUTO_INCREMENT,
            category varchar(255) NOT NULL,
            name varchar(255) NOT NULL,
            display_name varchar(255) NOT NULL,
            points float NOT NULL
        ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        `CREATE TABLE IF NOT EXISTS nstats_page_layout (
            id int NOT NULL AUTO_INCREMENT,
            page varchar(255) NOT NULL,
            item varchar(255) NOT NULL,
            page_order int NOT NULL
        ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        `CREATE TABLE IF NOT EXISTS nstats_damage_match (
            id int NOT NULL AUTO_INCREMENT,
            player_id int NOT NULL,
            match_id int NOT NULL,
            map_id int NOT NULL,
            gametype_id int NOT NULL,
            damage_delt int NOT NULL,
            damage_taken int NOT NULL,
            self_damage int NOT NULL,
            team_damage_delt int NOT NULL,
            team_damage_taken int NOT NULL,
            fall_damage int NOT NULL,
            drown_damage int NOT NULL,
            cannon_damage int NOT NULL,
            PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        `CREATE TABLE IF NOT EXISTS nstats_player_totals_damage (
        id int NOT NULL AUTO_INCREMENT,
        player_id int NOT NULL,
        gametype_id int NOT NULL,
        total_matches int NOT NULL,
        playtime FLOAT NOT NULL,
        damage_delt int NOT NULL,
        damage_taken int NOT NULL,
        self_damage int NOT NULL,
        team_damage_delt int NOT NULL,
        team_damage_taken int NOT NULL,
        fall_damage int NOT NULL,
        drown_damage int NOT NULL,
        cannon_damage int NOT NULL,
        PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,


        `CREATE TABLE IF NOT EXISTS nstats_ctf_caps (
        id int NOT NULL AUTO_INCREMENT,
        match_id int NOT NULL,
        map_id int NOT NULL,
        gametype_id int NOT NULL,
        cap_type tinyint NOT NULL,
        flag_team tinyint NOT NULL,
        capping_team tinyint NOT NULL,
        taken_timestamp float NOT NULL,
        taken_player int NOT NULL,
        cap_timestamp float NOT NULL,
        cap_player int NOT NULL,
        cap_time float NOT NULL,
        carry_time float NOT NULL,
        drop_time float NOT NULL,
        total_drops int NOT NULL,
        total_covers int NOT NULL,
        unique_carriers int NOT NULL,
        red_kills int NOT NULL,
        blue_kills int NOT NULL,
        green_kills int NOT NULL,
        yellow_kills int NOT NULL,
        red_suicides int NOT NULL,
        blue_suicides int NOT NULL,
        green_suicides int NOT NULL,
        yellow_suicides int NOT NULL,
        PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,


    `CREATE TABLE IF NOT EXISTS nstats_ctf_covers (
    id int NOT NULL AUTO_INCREMENT,
    match_id int NOT NULL,
    cap_id int NOT NULL,
    timestamp float NOT NULL,
    player_id int NOT NULL,
    PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    
    `CREATE TABLE IF NOT EXISTS nstats_ctf_carry_times (
        id int NOT NULL AUTO_INCREMENT,
        match_id int NOT NULL,
        map_id int NOT NULL,
        gametype_id int NOT NULL,
        cap_id int NOT NULL,
        player_id int NOT NULL,
        start_timestamp float NOT NULL,
        end_timestamp float NOT NULL,
        carry_time float NOT NULL,
        PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,


        `CREATE TABLE IF NOT EXISTS nstats_ctf_cap_kills (
        id int NOT NULL AUTO_INCREMENT,
        match_id int NOT NULL,
        cap_id int NOT NULL,
        timestamp float NOT NULL,
        killer_id int NOT NULL,
        killer_team int NOT NULL,
        PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

        `CREATE TABLE IF NOT EXISTS nstats_ctf_cap_suicides (
        id int NOT NULL AUTO_INCREMENT,
        match_id int NOT NULL,
        cap_id int NOT NULL,
        timestamp float NOT NULL,
        player_id int NOT NULL,
        player_team int NOT NULL,
        PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,


        `CREATE TABLE IF NOT EXISTS nstats_player_map_minute_averages (
        id int NOT NULL AUTO_INCREMENT,
        player_id int NOT NULL,
        map_id int NOT NULL,
        gametype_id int NOT NULL,
        total_playtime float NOT NULL,
        total_matches float NOT NULL,
        score float NOT NULL,
        frags float NOT NULL,
        kills float NOT NULL,
        deaths float NOT NULL,
        suicides float NOT NULL,
        team_kills float NOT NULL,
        headshots float NOT NULL,
        item_amp float NOT NULL,
        item_belt float NOT NULL,
        item_boots float NOT NULL,
        item_body float NOT NULL,
        item_pads float NOT NULL,
        item_invis float NOT NULL,
        item_shp float NOT NULL,
        flag_taken float NOT NULL,
        flag_pickup float NOT NULL,
        flag_drop float NOT NULL,
        flag_assist float NOT NULL,
        flag_cover float NOT NULL,
        flag_seal float NOT NULL,
        flag_cap float NOT NULL,
        flag_kills float NOT NULL,
        flag_return float NOT NULL,
        flag_return_base float NOT NULL,
        flag_return_mid float NOT NULL,
        flag_return_enemy_base float NOT NULL,
        flag_return_save float NOT NULL,
        dom_caps float NOT NULL,
        PRIMARY KEY(id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,


        `CREATE TABLE IF NOT EXISTS nstats_map_weapon_totals (
            id int(11) NOT NULL AUTO_INCREMENT,
            map_id int(11) NOT NULL,
            total_matches int(11) NOT NULL,
            total_playtime FLOAT NOT NULL,
            weapon_id int(11) NOT NULL,
            kills int(11) NOT NULL,
            deaths int(11) NOT NULL,
            suicides int(11) NOT NULL,
            team_kills int(11) NOT NULL,
            kills_per_min FLOAT NOT NULL,
            deaths_per_min FLOAT NOT NULL,
            team_kills_per_min FLOAT NOT NULL,
            suicides_per_min FLOAT NOT NULL
        ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        `CREATE TABLE IF NOT EXISTS nstats_map_rankings (
            id int NOT NULL AUTO_INCREMENT,
            player_id int NOT NULL,
            map_id int NOT NULL,
            matches int NOT NULL,
            playtime float NOT NULL,
            score float NOT NULL,
            last_active datetime NOT NULL
            ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,


        `CREATE TABLE IF NOT EXISTS nstats_classic_weapon_match_stats (
            id int NOT NULL AUTO_INCREMENT,
            match_id int NOT NULL,
            gametype_id int NOT NULL,
            map_id int NOT NULL,
            player_id int NOT NULL,
            weapon_id int NOT NULL,
            kills int NOT NULL,
            deaths int NOT NULL,
            shots int NOT NULL,
            hits int NOT NULL,
            accuracy float NOT NULL,
            damage int NOT NULL
            ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

        `CREATE TABLE IF NOT EXISTS nstats_player_ctf_league (
        id int NOT NULL AUTO_INCREMENT,
        player_id int NOT NULL,
        gametype_id int NOT NULL,
        map_id int NOT NULL,
        first_match datetime NOT NULL,
        last_match datetime NOT NULL,
        playtime float NOT NULL,
        total_matches int NOT NULL,
        wins int NOT NULL,
        draws int NOT NULL,
        losses int NOT NULL,
        winrate float NOT NULL,
        cap_for int NOT NULL,
        cap_against int NOT NULL,
        cap_offset int NOT NULL,
        points int NOT NULL
        ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

        `CREATE TABLE IF NOT EXISTS nstats_ctf_league_settings (
        id INT NOT NULL AUTO_INCREMENT,
        category varchar(255) NOT NULL,
        name varchar(255) NOT NULL,
        type varchar(255) NOT NULL,
        value varchar(255) NOT NULL,
        PRIMARY KEY(id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

       `CREATE TABLE IF NOT EXISTS nstats_user_login_attempts (
        id INT NOT NULL AUTO_INCREMENT,
        date DATETIME NOT NULL,
        target_username varchar(100),
        ip varchar(39) NOT NULL,
        PRIMARY KEY(id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

];


async function bLogsSettingsExist(){

    const query = `SELECT COUNT(*) as total_rows FROM nstats_logs_folder`;
    const result = await simpleQuery(query);

    if(result[0].total_rows > 0) return true;

    return false;
}


async function insertSiteSettings(){

    await restoreDefaultSettings();
}


async function bRankingSettingExist(category, name){

    const query = `SELECT COUNT(*) as total_rows FROM nstats_ranking_settings WHERE category=? AND name=?`;
    const result = await simpleQuery(query, [category, name]);

    return result[0].total_rows > 0;
}


async function insertRankingSetting(data){

    const query = `INSERT INTO nstats_ranking_settings VALUES(NULL,?,?,?,?)`;

    await simpleQuery(query,[
        data.category,
        data.name,
        data.displayName,
        data.points
    ]);
}


async function insertRankingSettings(){

    const settings = [
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


    for(let i = 0; i < settings.length; i++){

        const s = settings[i];

        if(!await bRankingSettingExist(s.category, s.name)){
            await insertRankingSetting(s);
        }
    }
}


async function bColumnExist(table, column){

    const query = `SHOW COLUMNS FROM ${table}`;

    const result = await simpleQuery(query);

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        if(r["Field"] === column) return true;
    }

    return false;
}


async function addColumn(table, name, type){

    try{

        if(await bColumnExist(table, name)) return;

        const query = `ALTER TABLE ${table} ADD COLUMN ${name} ${type}`;

        await simpleQuery(query);

        new Message(`Added column ${name} to TABLE ${table}`,"pass");

    }catch(err){
        new Message(err.message, "error");
    }
}

async function addPageLayouts(){

    await restoreDefaultLayouts();
}

async function bCTFSettingExist(name, category){

    const query = `SELECT COUNT(*) as total_rows FROM nstats_ctf_league_settings WHERE name=? AND category=?`;

    const result = await simpleQuery(query, [name, category]);

    return result[0].total_rows > 0;
}


async function updateDominationTables(){

    await addColumn("nstats_match_dom", "total_control_time", "float NOT NULL");
    await addColumn("nstats_match_dom", "longest_control_time", "float NOT NULL");
    await addColumn("nstats_match_dom", "shortest_control_time", "float NOT NULL");
    await addColumn("nstats_match_dom", "control_percent", "float NOT NULL");
    await addColumn("nstats_match_dom", "control_point_score", "float NOT NULL");
    await addColumn("nstats_match_dom", "max_control_point_score", "float NOT NULL");
    await addColumn("nstats_match_dom", "total_score_time", "float NOT NULL");
    await addColumn("nstats_match_dom", "max_total_score_time", "float NOT NULL");
    await addColumn("nstats_match_dom", "stolen_points", "float NOT NULL");
    await addColumn("nstats_match_dom", "stolen_caps", "int NOT NULL");
}

async function insertCTFLeagueSettings(){

    const query = `INSERT INTO nstats_ctf_league_settings VALUES(NULL,?,?,?,?)`;

    const dummyDate = new Date(0);

    const settings = [
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

    for(let i = 0; i < settings.length; i++){

        const s = settings[i];

        if(!await bCTFSettingExist(s.name, s.category)){
            
            await simpleQuery(query, [s.category, s.name, s.type, s.value]);
        }
    }
}

(async () =>{
 
    try{
        
        for(let i = 0; i < queries.length; i++){
         
            await connection.query(queries[i]);

            if(i === 0){

                connection.end();

                connection = mysql.createPool({
                    "host": mysqlSettings.host,
                    "user": mysqlSettings.user,
                    "password": mysqlSettings.password,
                    "database": mysqlSettings.database
                });
            }

            new Message(`Performed query ${i+1} of ${queries.length}`,"pass");
        
        }

        connection.end();

        if(!await bLogsSettingsExist()){
            await simpleQuery(`INSERT INTO nstats_logs_folder VALUES(NULL, "1999-11-30 00:00:00","1999-11-30 00:00:00",0,0,0,0,0,0,0)`);
        }

        await insertSiteSettings();

        await insertRankingSettings();

        await insertCTFLeagueSettings();


        await updateDominationTables();

        if(!fs.existsSync("./salt.mjs")){

            new Message(`Creating password salt`,"note");

            const seed = createRandomString(10000);
            const fileContents = `export const salt = \`${seed}\`;`;

            fs.writeFileSync("./salt.mjs", fileContents);
        }

        if(!fs.existsSync("./secret.mjs")){

            new Message(`Creating session secret`, "note");
            const seed2 = createRandomString(2048);
            const fileContents2 = `export const SESSION_SECRET = \`${seed2}\`;`;
            fs.writeFileSync("./secret.mjs", fileContents2);
        }


        await addPageLayouts();

        new Message("Setting match map & gametype ids.", "note");
        await setMatchMapGametypeIds();

        new Message("Calculating Player Map Averages", "note");
        await setAllPlayerMapAverages();

        new Message("Calculating Map Totals", "note");
        await setAllMapTotals();

        await damageSetMatchMapGametypeIds();

        new Message(`Refreshing player ctf league Map tables.`,"note");
        await refreshAllTables(true, "maps");
        new Message(`Refreshing player ctf league Gametype tables.`,"note");
        await refreshAllTables(true, "gametypes");
        process.exit();

    }catch(err){
        console.trace(err);
    }
})();

