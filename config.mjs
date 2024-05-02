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