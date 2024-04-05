
import fs from "fs";
import Message from "./src/app/lib/message.mjs";
import config from "./config.mjs";
import mysql from "mysql2/promise";
import {createRandomString} from "./src/app/lib/generic.mjs";

let connection = mysql.createPool({
    "host": config.mysql.host,
    "user": config.mysql.user,
    "password": config.mysql.password
});


const queries = [
    `CREATE DATABASE IF NOT EXISTS ${config.mysql.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
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
            ip varchar(39) NOT NULL,
            hwid varchar(255) NOT NULL,
            mac1 varchar(255) NOT NULL,
            mac2 varchar(255) NOT NULL,
            country varchar(3) NOT NULL
        ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`

        `CREATE TABLE IF NOT EXISTS nstats_matches (
            id int(11) NOT NULL AUTO_INCREMENT,
            server_id int(11) NOT NULL,
            gametype_id int(11) NOT NULL,
            map_id int(11) NOT NULL,
            date datetime NOT NULL,
            players int(11) NOT NULL
           
        ,PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`

];


(async () =>{
 
    try{
        
        for(let i = 0; i < queries.length; i++){
         
            await connection.query(queries[i]);

            if(i === 0){

                connection.end();

                connection = mysql.createPool({
                    "host": config.mysql.host,
                    "user": config.mysql.user,
                    "password": config.mysql.password,
                    "database": config.mysql.database
                });
            }

            new Message(`Performed query ${i+1} of ${queries.length}`,"pass");
        
        }

        connection.end();


        if(!fs.existsSync("./salt.js")){

            new Message(`Creating password hash`,"note");

            const seed = createRandomString(10000);
            const fileContents = `module.exports = () => {  return \`${seed}\`;}`;

            fs.writeFileSync("./salt.js", fileContents);
        }

        
        process.exit();

    }catch(err){
        console.trace(err);
    }
})();

