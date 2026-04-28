import Message from "./src/message.mjs";
import {simpleQuery} from "./src/database.mjs";
import { FTPImporter } from "./src/ftpimporter.mjs";
import { SFTPImporter } from "./src/sftpimporter.mjs";
import { readFile, readdir, rename } from 'node:fs/promises';
import { MatchParser } from "./src/matchParser.mjs";
import {importedLogsFolder, logFilePrefix, importInterval} from "./config.mjs";
import Encoding from 'encoding-japanese';
import { getSettings as getLogsFolderSettings } from "./src/logsfoldersettings.mjs";
import { bLogAlreadyImported } from "./src/importer.mjs";
import { calcPlayersMapResults as leagueCalcPlayerMapResults, getLeagueCategorySettings, getMultipleLeagueCategorySettings, refreshAllTables } from "./src/ctfLeague.mjs";
import { setInt } from "./src/generic.mjs";
import { getMultipleFTPServerSettings } from "./src/ftp.mjs";

new Message('Node UTStats 2 Importer module started.','note');



async function InsertLogHistory(fileName, matchId){

    fileName = fileName.toLowerCase();

    const date = new Date();

    const query = `INSERT INTO nstats_logs VALUES(NULL,?,?,?)`;
    return await simpleQuery(query, [fileName, date, matchId]);
}

async function insertRejectedHistory(fileName, reason){

    fileName = fileName.toLowerCase();

    const query = `INSERT INTO nstats_logs_rejected VALUES(NULL,?,?,?)`;
    const date = new Date();

    return await simpleQuery(query, [fileName, date, reason]);
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


async function updateCTFLeague(m, ctfLeagueSettings){

    const types = ["maps", "gametypes"];

    for(let i = 0; i < types.length; i++){

        const t = types[i];

        const settings = ctfLeagueSettings[t];

        if(settings["Enable League"].value === undefined){
            new Message(`${t.toUpperCase()} CTFLeague settings missing, please install using install.mjs.`,"error");
            continue;
        }


        const bEnabledMapCTF = settings["Enable League"]?.value ?? "false";
        const maxMatches = setInt(settings["Maximum Matches Per Player"]?.value, 5);
        const maxDays = setInt(settings["Maximum Match Age In Days"]?.value, 180);


        if(bEnabledMapCTF === "true"){

            //we only want to do all time once
            if(i === 0){
                await leagueCalcPlayerMapResults(0, 0, maxMatches, maxDays);
            }
            //map gametype
            await leagueCalcPlayerMapResults((t === "maps") ? m.map.id: 0, m.gametype.id, maxMatches, maxDays);
            //map all time
            await leagueCalcPlayerMapResults((t === "maps") ? m.map.id: 0, 0, maxMatches, maxDays);

        }else{
            new Message(`CTF ${t.toUpperCase()} league is disabled, skipping.`,"note");
        }
        
    } 
}

async function parseLog(file, bIgnoreBots, bIgnoreDuplicates, minPlayers, minPlaytime, bAppendTeamSizes, ctfLeagueSettings){

    try{

        const start = performance.now();

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

            //old utstats backup logs are converted to UTF16 LE BOM
            data = Encoding.codeToString(Encoding.convert(data, {
                "to": "UTF16",
                "from": currentFileEncoding
            }));
        }

        data = data.toString().replace(/\u0000/ig, '');

        const m = new MatchParser(data, bIgnoreBots, bIgnoreDuplicates, minPlayers, minPlaytime, bAppendTeamSizes);

        await m.main();

        new Message(`MatchId: ${m.matchId}, Server: ${m.server.name}, Gametype: ${m.gametype.name}, Map: ${m.map.name}`,"note");

        if(m.ctf.bMatchCTF){
            new Message(`Updating CTF League`,"note");
            await updateCTFLeague(m, ctfLeagueSettings);
        }

        await InsertLogHistory(file, m.matchId);

        await rename(`./Logs/${file}`, `./Logs/imported/${file}`);
        
        const end = performance.now();

        new Message(`Finished parsing log ${file}`,"pass");
        new Message(`Log imported in ${(end - start) * 0.001} seconds`,"progress");
        return true;

    }catch(err){

        await rename(`./Logs/${file}`, `./Logs/rejected/${file}`);
        await insertRejectedHistory(file, err.toString());

        const ignoreMessages = [
            "MIN PLAYERS", "MIN PLAYTIME", "NO START", "NO END", "MAP CHANGE END"
        ];

        if(ignoreMessages.indexOf(err.message) !== -1) return;
        console.trace(err);
        new Message(err.toString(),"error");
        return false;
    }
}

async function getDownloadedFrom(fileName){

    const query = `SELECT importer_id,ftp_ip FROM nstats_logs_downloads WHERE file_name=? ORDER BY id DESC LIMIT 1`;

    const result = await simpleQuery(query, [fileName]);

    if(result.length === 0) return null;

    return {"id": result[0].importer_id, "ip": result[0].ftp_ip};
}


async function getMultipleDownloadedFrom(fileNames){

    if(fileNames.length === 0) return {"logs": {}, "uniqueImporterIds": []};

    const query = `SELECT file_name,importer_id,ftp_ip FROM nstats_logs_downloads WHERE file_name IN (?)`;

    const result = await simpleQuery(query, [fileNames]);

    const data = {};
    const uniqueIds = new Set();

    for(let i = 0; i < fileNames.length; i++){
        data[fileNames[i]] = null;
    }

    for(let i = 0; i < result.length; i++){

        const r = result[i];
        uniqueIds.add(r.importer_id);
        data[r.file_name] = {"id": r.importer_id, "ip": r.ftp_ip}
    }

    return {"logs":data, "uniqueImporterIds": [...uniqueIds]};
}

//serverId is -1 if logs are from the websites /Logs folder
//if serverId is -1(leftover logs) look for download data and use the ftp settings from importer_id if exists.
async function parseLogs(serverId, bIgnoreBots, bIgnoreDuplicates, minPlayers, minPlaytime, bAppendTeamSizes, ctfLeagueSettings){

    const start = performance.now();

    const files = await readdir(importedLogsFolder);

    const logs = files.filter((f) => f.toLowerCase().startsWith(logFilePrefix));

    let downloadHistory = null;
    let settings = null;

    if(serverId !== -1){
        downloadHistory = await getMultipleDownloadedFrom(logs);
        settings = await getMultipleFTPServerSettings(downloadHistory.uniqueImporterIds);
    }

    let imported = 0;
    let failed = 0;

    for(let i = 0; i < logs.length; i++){

        const f = logs[i];
        
        if(!f.toLowerCase().startsWith(logFilePrefix)) continue;

        new Message(`Log ${i+1}/${logs.length}, Starting parsing of ${f}`,"note");

        //if not logs folder leftovers
        if(serverId !== -1){

            if(await parseLog(
                f, 
                bIgnoreBots, bIgnoreDuplicates, 
                minPlayers, minPlaytime, bAppendTeamSizes, 
                ctfLeagueSettings
            )){
                imported++;
            }else{
                failed++;
            }

            continue;
        }

        const history = downloadHistory?.logs[f] ?? null;

        if(history === null){
            new Message(`Could not find download information for ${f}, using logs folder importer settings instead.`,"note");
            if(await parseLog(f, bIgnoreBots, bIgnoreDuplicates, minPlayers, minPlaytime, bAppendTeamSizes, ctfLeagueSettings)){
                imported++;
            }else{
                failed++;
            }

            continue;
        }

        const logSettings = settings[history.id] ?? null;

        if(logSettings === null){
            new Message(`Failed to find importer settings for ftpServer with id ${history.id}`,"error");
            failed++;
            continue;
        }
       
        new Message(`Found download information for ${f}, using importer settings from ftp server ${logSettings.name}.`, "note");
        

        if(await parseLog(
            f, 
            logSettings.ignore_bots, 
            logSettings.ignore_duplicates, 
            logSettings.min_players, 
            logSettings.min_playtime,
            logSettings.append_team_sizes, 
            ctfLeagueSettings
        )){
            imported++;
        }else{
            failed++;
        }
        
        continue;

    }

    const end = performance.now();

    const importTime = (end - start) * 0.001;

    await insertImporterHistory(serverId, imported + failed, imported, failed, importTime);
    
    if(serverId !== -1){

        await updateFTPStats(serverId, imported);
    }else{

        await updateLogsFolderStats(imported);
    }  


    return {"passed": imported,failed,"totalLogs": imported + failed};
}


async function main(ctfLeagueSettings){


    const start = performance.now();

    const logsFolderSettings = await getLogsFolderSettings();

    if(logsFolderSettings === null){
        new Message(`logsFolderSettings is null`,"error");
        return;
    }

    

    new Message(`Checking for leftover logs...`,"progress");
    const leftOverStart = performance.now();
    const ls = logsFolderSettings;

    const leftOverStats = await parseLogs(
        -1, ls.ignore_bots, ls.ignore_duplicates, 
        ls.min_players, ls.min_playtime, 
        ls.append_team_sizes, ctfLeagueSettings
    );
    const leftOverEnd = performance.now();

    const totals = {...leftOverStats};

    const leftOverString = `Completed Leftover logs parsing in ${((leftOverEnd - leftOverStart) * 0.001).toFixed(3)} seconds.`;

    new Message(leftOverString ,"progress");
  
    const query = "SELECT * FROM nstats_ftp ORDER BY id ASC";
    const result = await simpleQuery(query);


    for(let i = 0; i < result.length; i++){

        const r = result[i];

        if(!r.enabled) continue;

        new Message(`Attempting to connect to ${r.host}:${r.port}${r.user}`,"progress");

        let ftp = null;

        if(r.sftp){

            ftp = new SFTPImporter(
                r.id,
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
                r.id,
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

        const {passed, failed, totalLogs} = await parseLogs(
            r.id,
            r.ignore_bots,
            r.ignore_duplicates,
            r.min_players,
            r.min_playtime,
            r.append_team_sizes,
            ctfLeagueSettings
        );

        totals.passed += passed;
        totals.failed += failed;
        totals.totalLogs += totalLogs;
    }  

    const end = performance.now();


    const totalTime = (end - start) * 0.001;

    new Message(`Import completed in ${totalTime} seconds, ${totals.passed} imported, ${totals.failed} failed out of ${totals.totalLogs} logs.`,"progress");
    

}


async function startImport(){


    const {maps, gametypes, combined} = await getMultipleLeagueCategorySettings(["maps", "gametypes", "combined"]);

    const ctfLeagueSettings = {maps, gametypes, combined};

    await main(ctfLeagueSettings);

    if(ctfLeagueSettings.maps["Update Whole League End Of Import"].value === "true"){

        await refreshAllTables("maps");
    }

    if(ctfLeagueSettings.gametypes["Update Whole League End Of Import"].value === "true"){

        await refreshAllTables("gametypes");
    }

    if(ctfLeagueSettings.combined["Update Whole League End Of Import"].value === "true"){

        await refreshAllTables("combined");
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

