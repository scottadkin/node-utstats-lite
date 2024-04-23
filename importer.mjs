import Message from "./src/app/lib/message.mjs";
import {simpleQuery} from "./src/app/lib/database.mjs";
import { FTPImporter } from "./src/app/lib/ftpimporter.mjs";
import { readFile, readdir } from 'node:fs/promises';
import { MatchParser } from "./src/app/lib/matchParser.mjs";
import {importedLogsFolder, logFilePrefix} from "./config.mjs";
import Encoding from 'encoding-japanese';
import { getSettings as getLogsFolderSettings } from "./src/app/lib/logsfoldersettings.mjs";

new Message('Node UTStats 2 Importer module started.','note');

async function parseLog(file, bIgnoreBots, bIgnoreDuplicates, minPlayers, minPlaytime){

    try{
        new Message(`Starting parsing of log ${file}`,"note");

        const url = `${importedLogsFolder}/${file}`;

        let data = await readFile(url);

        const currentFileEncoding = Encoding.detect(data);
        
        if(currentFileEncoding !== "UTF16"){

            data = Encoding.codeToString(Encoding.convert(data, {
                "to": "UTF16",
                "from": currentFileEncoding
            }));
        }

        data = data.toString().replace(/\u0000/ig, '');

        const m = new MatchParser(data, bIgnoreBots, bIgnoreDuplicates, minPlayers, minPlaytime);

        await m.main();

        new Message(`Finished parsing log ${file}`,"pass");

    }catch(err){

        new Message(err.toString(),"error");
    }
}

//serverId is -1 if logs are from the websites /Logs folder
async function parseLogs(serverId, bIgnoreBots, bIgnoreDuplicates, minPlayers, minPlaytime){

    const files = await readdir(importedLogsFolder);

    for(let i = 0; i < files.length; i++){

        const f = files[i];
        
        if(!f.toLowerCase().startsWith(logFilePrefix)) continue;

        await parseLog(f, bIgnoreBots, bIgnoreDuplicates, minPlayers, minPlaytime);
    }
}



(async () =>{

    const logsFolderSettings = await getLogsFolderSettings();

    if(logsFolderSettings === null){
        new Message(`logsFolderSettings is null`,"error");
        return;
    }


    new Message(`Checking for leftover logs...`,"note");
    const ls = logsFolderSettings;
    await parseLogs(-1, ls.ignore_bots, ls.ignore_duplicates, ls.min_players, ls.min_playtime);
    new Message(`Completed parsing Leftover logs completed`,"pass");

    const query = "SELECT * FROM nstats_ftp ORDER BY id ASC";
    const result = await simpleQuery(query);

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        new Message(`Attempting to connect to ${r.host}:${r.user}`,"note");


        const test = new FTPImporter(
            r.host, 
            r.port, 
            r.user, 
            r.password, 
            false, 
            r.target_folder,
        );

        await test.connect();
        await parseLogs(
            r.id,
            r.ignore_bots,
            r.ignore_duplicates,
            r.min_players,
            r.min_playtime
        );
    }

    

    new Message(`Import Completed`,"pass");
    process.exit();

})();

