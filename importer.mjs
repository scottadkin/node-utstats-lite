import Message from "./src/app/lib/message.mjs";
import {simpleQuery} from "./src/app/lib/database.mjs";
import { FTPImporter } from "./src/app/lib/ftpimporter.mjs";
import { SFTPImporter } from "./src/app/lib/sftpimporter.mjs";
import { readFile, readdir, rename } from 'node:fs/promises';
import { MatchParser } from "./src/app/lib/matchParser.mjs";
import {importedLogsFolder, logFilePrefix, importInterval} from "./config.mjs";
import Encoding from 'encoding-japanese';
import { getSettings as getLogsFolderSettings } from "./src/app/lib/logsfoldersettings.mjs";
import { bLogAlreadyImported } from "./src/app/lib/importer.mjs";
import { calcPlayersMapResults as leagueCalcPlayerMapResults, getLeagueCategorySettings, refreshAllMapTables } from "./src/app/lib/ctfLeague.mjs";
import { setInt } from "./src/app/lib/generic.mjs";

new Message('Node UTStats 2 Importer module started.','note');



async function InsertLogHistory(fileName, serverId, matchId){

    fileName = fileName.toLowerCase();

    const date = new Date();

    const query = `INSERT INTO nstats_logs VALUES(NULL,?,?,?,?)`;
    return await simpleQuery(query, [fileName, date, serverId, matchId]);
}

async function insertRejectedHistory(serverId, fileName, reason){

    fileName = fileName.toLowerCase();

    const query = `INSERT INTO nstats_logs_rejected VALUES(NULL,?,?,?,?)`;
    const date = new Date();

    return await simpleQuery(query, [fileName, date, serverId, reason]);
}

async function updateFTPStats(serverId, totalImports){

    const date = new Date();

    const query = `UPDATE nstats_ftp SET 
    first = IF(total_imports = 0, ?, first),
    last=?,
    total_imports = total_imports+1,
    total_logs_imported = total_logs_imported + ?
    WHERE id=?`;

    const vars = [
        date, date, totalImports, serverId
    ];

    await simpleQuery(query, vars);

}

async function updateLogsFolderStats(totalImports){

    const date = new Date();

    const query = `UPDATE nstats_logs_folder SET 
    first = IF(total_imports = 0, ?, first),
    last=?,
    total_imports = total_imports+1,
    total_logs_imported = total_logs_imported + ?`;

    const vars = [
        date, date, totalImports
    ];

    await simpleQuery(query, vars);

}


async function insertImporterHistory(serverId, logsFound, passed, failed, totalTime){

    const date = new Date();

    const query = `INSERT INTO nstats_importer_history VALUES(NULL,?,?,?,?,?,?)`;

    await simpleQuery(query, [serverId, date, logsFound, passed, failed, totalTime]);
}


async function updateCTFLeague(m, mapCTFLeagueSettings){

    if(mapCTFLeagueSettings["Enable League"].value === undefined){
        new Message(`Map CTFLeague settings missing, please install using install.mjs.`,"error");
    }else{

        const bEnabledMapCTF = mapCTFLeagueSettings["Enable League"]?.value ?? "false";
        const maxMatches = setInt(mapCTFLeagueSettings["Maximum Matches Per Player"]?.value, 5);
        const maxDays = setInt(mapCTFLeagueSettings["Maximum Match Age In Days"]?.value, 180);

        if(bEnabledMapCTF === "true"){
            await leagueCalcPlayerMapResults(m.map.id, m.gametype.id, maxMatches, maxDays);
        }else{
            new Message(`CTF map league is disabled, skipping.`,"note");
        }
    }
}

async function parseLog(file, bIgnoreBots, bIgnoreDuplicates, minPlayers, minPlaytime, serverId, bAppendTeamSizes, mapCTFLeagueSettings){

    try{

        new Message(`Starting parsing of log ${file}`,"note");

        if(bIgnoreDuplicates){

            if(await bLogAlreadyImported(file)){
                await rename(`./Logs/${file}`, `./Logs/imported/${file}`);
                new Message(`The match log ${file} has already been imported, skipping(bIgnore Duplicates is set to true).`,"note");
                return;
            }
        }

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

        const m = new MatchParser(data, bIgnoreBots, bIgnoreDuplicates, minPlayers, minPlaytime, bAppendTeamSizes);

        await m.main();

        await updateCTFLeague(m, mapCTFLeagueSettings);

        await InsertLogHistory(file, serverId, m.matchId);

        await rename(`./Logs/${file}`, `./Logs/imported/${file}`);
        
        new Message(`Finished parsing log ${file}`,"pass");
        return true;

    }catch(err){

        await rename(`./Logs/${file}`, `./Logs/rejected/${file}`);
        await insertRejectedHistory(serverId, file, err.toString());

        if(err.message === "MIN PLAYERS" || err.message === "MIN PLAYTIME" || err.message === "NO START" || err.message === "NO END") return;
        console.trace(err);
        new Message(err.toString(),"error");
        return false;
    }
}

//serverId is -1 if logs are from the websites /Logs folder
async function parseLogs(serverId, bIgnoreBots, bIgnoreDuplicates, minPlayers, minPlaytime, bAppendTeamSizes, mapCTFLeagueSettings){

    const start = performance.now();

    const files = await readdir(importedLogsFolder);

    let imported = 0;
    let failed = 0;

    for(let i = 0; i < files.length; i++){

        const f = files[i];
        
        if(!f.toLowerCase().startsWith(logFilePrefix)) continue;

        if(await parseLog(f, bIgnoreBots, bIgnoreDuplicates, minPlayers, minPlaytime, serverId, bAppendTeamSizes, mapCTFLeagueSettings)){
            imported++;
        }else{
            failed++;
        }
    }

    const end = performance.now();

    const importTime = (end - start) * 0.001;

    await insertImporterHistory(serverId, imported + failed, imported, failed, importTime);
    
    if(serverId !== -1){

        await updateFTPStats(serverId, imported);
    }else{

        await updateLogsFolderStats(imported);
    }  
}


async function main(mapCTFLeagueSettings){


    const logsFolderSettings = await getLogsFolderSettings();

    if(logsFolderSettings === null){
        new Message(`logsFolderSettings is null`,"error");
        return;
    }

    new Message(`Checking for leftover logs...`,"progress");
    const ls = logsFolderSettings;
    await parseLogs(-1, ls.ignore_bots, ls.ignore_duplicates, ls.min_players, ls.min_playtime, ls.append_team_sizes, mapCTFLeagueSettings);
    new Message(`Completed parsing Leftover logs completed`,"pass");

    const query = "SELECT * FROM nstats_ftp ORDER BY id ASC";
    const result = await simpleQuery(query);

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        if(!r.enabled) continue;

        new Message(`Attempting to connect to ${r.host}:${r.user}`,"note");

        let ftp = null;

        if(r.sftp){

            ftp = new SFTPImporter(
                r.host, 
                r.port, 
                r.user, 
                r.password, 
                false, 
                r.target_folder,
                r.ignore_duplicates,
                r.delete_after_import,
                r.delete_tmp_files
            );
        }else{

            ftp = new FTPImporter(
                r.host, 
                r.port, 
                r.user, 
                r.password, 
                false, 
                r.target_folder,
                r.ignore_duplicates,
                r.delete_after_import,
                r.delete_tmp_files
            );
        }

        await ftp.connect();


        await parseLogs(
            r.id,
            r.ignore_bots,
            r.ignore_duplicates,
            r.min_players,
            r.min_playtime,
            r.append_team_sizes,
            mapCTFLeagueSettings
        );
    }  

    new Message(`Import Completed`,"progress");

}


async function startImport(){

    const mapCTFLeagueSettings = await getLeagueCategorySettings("maps");
    await main(mapCTFLeagueSettings);

    if(mapCTFLeagueSettings["Update Whole League End Of Import"].value === "true"){

        await refreshAllMapTables();
    }
}


(async () =>{

    if(importInterval === 0){

        new Message(`ImportInterval is set to 0, the importer will run just once and then exit.`,"note");
        await startImport();

        process.exit();

    }else{

        let bPreviousImportCompleted = false;
        await startImport();
        bPreviousImportCompleted = true;

        setInterval(async () =>{

            if(bPreviousImportCompleted){

                bPreviousImportCompleted = false;
                await startImport();
                bPreviousImportCompleted = true;  

            }else{
                new Message(`Previous import cycle is running, skipping this cycle.`,"progress");
            }
        }, importInterval * 1000);
    }

})();

