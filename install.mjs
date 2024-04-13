
import fs from "fs";
import Message from "./src/app/lib/message.mjs";
import { mysqlSettings } from "./config.mjs";
import mysql from "mysql2/promise";
import {createRandomString} from "./src/app/lib/generic.mjs";

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
        first int(11) NOT NULL,
        last int(11) NOT NULL,
        total_imports int(11) NOT NULL,
        delete_tmp_files int(1) NOT NULL,
        total_logs_imported int(11) NOT NULL,
        ignore_bots int(1) NOT NULL,
        ignore_duplicates int(1) NOT NULL,
        min_players int(2) NOT NULL,
        min_playtime int(11) NOT NULL,
        sftp int(1) NOT NULL,
        import_ace INT(1) NOT NULL,
        delete_ace_logs int(1) NOT NULL,
        delete_ace_screenshots int(1) NOT NULL,
        total_ace_kick_logs INT(1) NOT NULL,
        total_ace_join_logs INT(1) NOT NULL,
        total_ace_screenshots INT(1) NOT NULL,
        enabled INT(1) NOT NULL,
        use_ace_player_hwid INT(1) NOT NULL
      ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

        `CREATE TABLE IF NOT EXISTS nstats_logs_folder (
        id int(11) NOT NULL AUTO_INCREMENT,
        name varchar(100) NOT NULL,
        first int(11) NOT NULL,
        last int(11) NOT NULL,
        total_imports int(11) NOT NULL,
        total_logs_imported int(11) NOT NULL,
        ignore_bots int(1) NOT NULL,
        ignore_duplicates int(1) NOT NULL,
        min_players int(2) NOT NULL,
        min_playtime int(11) NOT NULL,
        import_ace INT(1) NOT NULL,
        total_ace_kick_logs INT(1) NOT NULL,
        total_ace_join_logs INT(1) NOT NULL,
        total_ace_screenshots INT(1) NOT NULL,
        use_ace_player_hwid INT(1) NOT NULL
        ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,  

        `CREATE TABLE IF NOT EXISTS nstats_players (
            id int(11) NOT NULL AUTO_INCREMENT,
            name varchar(32) NOT NULL,
            country varchar(3) NOT NULL
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
            port int(11) NOT NULL
        ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        `CREATE TABLE IF NOT EXISTS nstats_gametypes (
            id int(11) NOT NULL AUTO_INCREMENT,
            name varchar(255) NOT NULL
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
            bot int(1) NOT NULL,
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
            headshots int NOT NULL
        ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

        `CREATE TABLE IF NOT EXISTS nstats_match_weapon_stats (
            id int(11) NOT NULL AUTO_INCREMENT,
            match_id int(11) NOT NULL AUTO_INCREMENT,
            player_id int(11) NOT NULL AUTO_INCREMENT,
            weapon_id int(11) NOT NULL AUTO_INCREMENT,
            kills int(11) NOT NULL AUTO_INCREMENT,
            deaths int(11) NOT NULL AUTO_INCREMENT,
            team_kills int(11) NOT NULL AUTO_INCREMENT
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

        `CREATE TABLE nstats_match_ctf (
            id int NOT NULL,
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
        ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`


];


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

