
import fs from "fs";
import Message from "./src/message.mjs";
import {createRandomString} from "./src/generic.mjs";
import { restoreDefaultSettings as restoreDefaultSiteSettings } from "./src/siteSettings.mjs";
import { restoreDefaultLayouts as restoreDefaultPageLayouts} from "./src/pageLayout.mjs";
import { refreshAllTables, insertDefaultCTFLeagueSettings } from "./src/ctfLeague.mjs";
import {insertDefaultRankingSettings } from "./src/rankings.mjs";
import mysqlInstall from "./src/mysqlInstall.mjs";
import sqliteInstall from "./src/sqliteInstall.mjs";
import { SQL_MODE } from "./config.mjs";
import { updateJSONApiSettings } from "./src/json.mjs";
import { createDefaultLogsFolderSettings} from "./src/logsfoldersettings.mjs";

if(SQL_MODE === "sqlite"){
    new Message("Selected Database Type is SQLite");
    await sqliteInstall();
}else{
    new Message("Selected Database Type is MYSQL");
    await mysqlInstall();
}

new Message("Inserting Default Rankings Settings", "note");
await insertDefaultRankingSettings();
new Message("Inserting Default CTF League Settings", "note");
await insertDefaultCTFLeagueSettings();
new Message("Inserting Default Site Settings", "note");
await restoreDefaultSiteSettings();
new Message("Inserting Default Site Page Layout Settings", "note");
await restoreDefaultPageLayouts();
new Message("Creating Default Logs Folder Settings", "note");
await createDefaultLogsFolderSettings();
new Message("Creating JSON API Settings","note");
await updateJSONApiSettings();

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

new Message(`Refreshing player ctf league Map tables.`,"note");
await refreshAllTables("maps");
new Message(`Refreshing player ctf league Gametype tables.`,"note");
await refreshAllTables("gametypes");