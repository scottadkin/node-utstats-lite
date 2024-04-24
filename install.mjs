
import fs from "fs";
import Message from "./src/app/lib/message.mjs";
import { mysqlSettings } from "./config.mjs";
import mysql from "mysql2/promise";
import {createRandomString} from "./src/app/lib/generic.mjs";
import { simpleQuery } from "./src/app/lib/database.mjs";

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
        enabled INT(1) NOT NULL
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
        min_playtime int(11) NOT NULL
        ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,  

        `CREATE TABLE IF NOT EXISTS nstats_players (
            id int(11) NOT NULL AUTO_INCREMENT,
            name varchar(32) NOT NULL,
            country varchar(3) NOT NULL,
            matches int NOT NULL,
            score int NOT NULL,
            frags int NOT NULL,
            kills int NOT NULL,
            deaths int NOT NULL,
            suicides int NOT NULL,
            eff float NOT NULL,
            ttl int NOT NULL,
            playtime float NOT NULL,
            last_active DATETIME NOT NULL
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
            players int(11) NOT NULL,
            total_teams int(1) NOT NULL,
            team_0_score int(11) NOT NULL,   
            team_1_score int(11) NOT NULL,   
            team_2_score int(11) NOT NULL,   
            team_3_score int(11) NOT NULL,   
            solo_winner int(11) NOT NULL,
            solo_winner_score int(11) NOT NULL
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
            name varchar(255) NOT NULL
        ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        `CREATE TABLE IF NOT EXISTS nstats_match_players (     
            id int NOT NULL,
            player_id int NOT NULL,
            spectator int(1) NOT NULL,
            ip varchar(39) COLLATE utf8mb4_unicode_ci NOT NULL,
            country varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL,
            hwid varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
            mac1 varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
            mac2 varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
            match_id int NOT NULL,
            match_date datetime NOT NULL,
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
            player_id int(11) NOT NULL,
            weapon_id int(11) NOT NULL,
            kills int(11) NOT NULL,
            deaths int(11) NOT NULL,
            team_kills int(11) NOT NULL
        ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        `CREATE TABLE IF NOT EXISTS nstats_weapons (
            id int(11) NOT NULL AUTO_INCREMENT,
            name varchar(255) NOT NULL
        ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        `CREATE TABLE IF NOT EXISTS nstats_kills (
            id int(11) NOT NULL AUTO_INCREMENT,
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
            flag_return_save int NOT NULL
        ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        `CREATE TABLE IF NOT EXISTS nstats_dom_control_points (
            id int NOT NULL AUTO_INCREMENT,
            name varchar(255) NOT NULL
        ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        `CREATE TABLE IF NOT EXISTS nstats_match_dom (
            id int NOT NULL AUTO_INCREMENT,
            match_id int NOT NULL,
            player_id int NOT NULL,
            point_id int NOT NULL,
            total_caps int NOT NULL
        ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        `CREATE TABLE IF NOT EXISTS nstats_player_totals (     
            id int NOT NULL AUTO_INCREMENT,
            player_id int NOT NULL,
            gametype_id int NOT NULL,
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
            team_kills int(11) NOT NULL,
            eff float NOT NULL
        ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        `CREATE TABLE IF NOT EXISTS nstats_player_totals_ctf (
            id int NOT NULL AUTO_INCREMENT,
            player_id int NOT NULL,
            gametype_id int NOT NULL,
            total_matches int NOT NULL,
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
            flag_return_save int NOT NULL
        ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        `CREATE TABLE IF NOT EXISTS nstats_users (
            id int NOT NULL AUTO_INCREMENT,
            name varchar(100) NOT NULL,
            password varchar(64) NOT NULL,
            activated tinyint NOT NULL
        ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        `CREATE TABLE IF NOT EXISTS nstats_sessions (
            id int NOT NULL AUTO_INCREMENT,
            user int NOT NULL,
            hash varchar(64) NOT NULL,
            ip varchar(50) NOT NULL
        ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

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


];


async function bLogsSettingsExist(){

    const query = `SELECT COUNT(*) as total_rows FROM nstats_logs_folder`;
    const result = await simpleQuery(query);

    if(result[0].total_rows > 0) return true;

    return false;
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
            await simpleQuery(`INSERT INTO nstats_logs_folder VALUES(NULL, "1999-11-30 00:00:00","1999-11-30 00:00:00",0,0,0,0,0,0)`);
        }


        if(!fs.existsSync("./salt.mjs")){

            new Message(`Creating password salt`,"note");

            const seed = createRandomString(10000);
            const fileContents = `export const salt = \`${seed}\`;`;

            fs.writeFileSync("./salt.mjs", fileContents);
        }

        
        process.exit();

    }catch(err){
        console.trace(err);
    }
})();

