import {bulkInsert} from "./src/app/lib/database.mjs";
import Message from "./src/app/lib/message.mjs";
import {readFile} from "fs/promises";


(async () =>{

    new Message(`Import Node UTStats 2 FTP settings to Node UTStats lite`,"note");

    const targetFile = "./nstats_ftp.json";

    const data = await readFile(targetFile);

    const json = JSON.parse(data);

    const query = `INSERT INTO nstats_ftp (name,host,port,user,password,
    target_folder, delete_after_import, first,
    last, total_imports, total_logs_imported, ignore_bots,
    ignore_duplicates, min_players, min_playtime,
    sftp, enabled, delete_tmp_files) VALUES ?`;
    const settings = json.data;
    const rows = [];
    
    new Message(`Found ${settings.length} ftp import settings from node utstats_ftp.json`,"note");

    for(let i = 0; i < settings.length; i++){

        const s = settings[i];//16
        const first = new Date(s[8]);
        const last = new Date(s[9]);
        rows.push([
            s[1], s[2], s[3], s[4], s[5],
            s[6], s[7], first, 
            last, 0, 0, s[13], 
            s[14], s[15], s[16], 
            s[17],s[24],s[25]// s[24]
        ]);
    }

    await bulkInsert(query, rows);

    process.exit();

})();