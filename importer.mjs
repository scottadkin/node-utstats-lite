//const Importer =  require('./api/importer/importer');
import Message from "./src/app/lib/message.mjs";
//const mysql = require('./api/database');
//const config = require('./config.json');
import {simpleQuery} from "./src/app/lib/database.mjs";
import { FTPImporter } from "./src/app/lib/ftpimporter.mjs";
import { readFile, readdir } from 'node:fs/promises';
import { MatchParser } from "./src/app/lib/matchParser.mjs";
import config from "./config.mjs";
import Encoding from 'encoding-japanese';

new Message('Node UTStats 2 Importer module started.','note');

async function parseLog(file){

    new Message(`Starting parsing of log ${file}`,"note");

    const url = `${config.importedLogsFolder}/${file}`;

    const dummy = await readFile(url);

    let detectedEncoding = Encoding.detect(dummy);

    if(detectedEncoding === "UTF16") detectedEncoding = "utf16le";

    const data = await readFile(url, detectedEncoding);

    const m = new MatchParser(data);

    await m.main();

    new Message(`Finished parsing log ${file}`,"pass");
}


async function parseLogs(){

    const files = await readdir(config.importedLogsFolder);
    console.table(files);

    for(let i = 0; i < files.length; i++){

        const f = files[i];
        

        if(!f.toLowerCase().startsWith(config.logFilePrefix)) continue;

        await parseLog(f);
    }
}



(async () =>{

    const query = "SELECT * FROM nstats_ftp ORDER BY id ASC";
    const result = await simpleQuery(query);


    for(let i = 0; i < result.length; i++){

        const r = result[i];
        const test = new FTPImporter(r.host, r.user, r.password, false, r.target_folder);

        await test.connect();

    }


    
   // await openFile();

    await parseLogs();

    
    process.exit();
})()

