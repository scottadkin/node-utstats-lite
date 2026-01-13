export const mysqlSettings = {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "",
    "database": "node_utstats_lite"
};

export const logFilePrefix = "unreal.nglog.";

export const importedLogsFolder = "./Logs";

// set this value to 0 if you only want to run the importer once,
// any other value is in seconds, e.g 60 would mean the impoter will run every 1 Minute
export const importInterval = 0;

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