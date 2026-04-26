export const SQL_MODE = "mysql";

export const mysqlSettings = {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "",
    "database": "node_utstats_lite",

    //note: The importer will also have the same limit,
    //if both are running that's double this value
    "connectionLimit": 10
};

export const logFilePrefix = "unreal.nglog.";

export const importedLogsFolder = "./Logs";

// set this value to 0 if you only want to run the importer once,
// any other value is in seconds, e.g 60 would mean the impoter will run every 1 Minute
// 300 is every 5 minutes, 3600 once an hour, 86400 once a day
export const importInterval = 300;

export const multiKillTimeLimit = 3;

//how old a tmp file must be before it's deleted(seconds)
export const minTmpFileLifetime = 60 * 60 * 6;

export const DEFAULT_DATE = "1999-11-30 00:00:00";

export const websitePort = 3000;

//What quality map screenshots are saved as when using admin upload tool 0-100
//Higher the value the larger the file size of the screenshots
export const mapScreenshotQuality = 85;

//the maximum amount of failed login attempts before an ip is blocked from logging in.
export const maxLoginAttempts = 5; 

//how long an ip is banned from login attempts after failing maxLoginAttempts
//in seconds
export const maxLoginBanPeriod = 300;


/*how often the importer saves the dom_team_score to the database
UT logs this data every 5 * gamespeed * hardcore seconds (usually 5.5 seconds at 100% with hardcore mode)
We also save our calculated domination scores at the same time.
Setting this value to 1 will mean every 5 in game seconds data will be saved, 3 = every 15 seconds
*/
export const dominationScoreSaveInterval = 3;


/*
    Do not change this to true unless you know what you are doing,
    this is only used if you want to create a large database with
    a small amount of logs, this will randomize player, gametypes, 
    maps, servers, weapons names in the import process.
*/
export const bImportRandomizeNames = false;

//How long a login session will last after last page load.(in hours)
export const loginExpireTime = 24;