import { getSessionInfo } from "../authentication.mjs";
import { getAllFTPSettings, addFTPServer, editFTPServer, deleteFTPServer } from "../ftp.mjs";
import { updateLogsFolderSettings } from "../logsfoldersettings.mjs";
import { getAllMaps, getAllMapImages } from "../maps.mjs";
import { getMapImageName, stripFileExtension } from "../generic.mjs";
import { Jimp } from "jimp";
import { writeFile, rm } from 'node:fs/promises';
import { mapScreenshotQuality } from "../../config.mjs";
import { getAllSettings as getAllSiteSettings, updateSiteSettings } from "../siteSettings.mjs";
import { getAllPagesLayout, savePageLayoutChanges } from "../pageLayout.mjs";
import { getAllSettings as getAllRankingSettings, updateRankingSettings, recalculateAllRankings} from "../rankings.mjs";
import { clearAllDataTables } from "../admin.mjs";
import { adminGetAllCTFLeagueSettings, adminUpdateCTFLeagueSettings } from "../ctfLeague.mjs";
import { VALID_PLAYER_LIFETIME_TYPES, VALID_PLAYER_MATCH_TYPES } from "../validRecordTypes.mjs";




export default class AdminJSONManager{

    constructor(req, res, sessionStore){

        this.mode = req?.body?.mode ?? "";
        //if(this.mode === null) throw new Error(`No mode specified`);
        this.mode = this.mode.toLowerCase();

        this.req = req;
        this.body = req?.body ?? null;
        this.res = res;
        this.sessionStore = sessionStore;

    }

    async checkSession(){

        this.userSession = await getSessionInfo(this.req, this.sessionStore);

        //this.userSession = null;

        if(this.userSession === null) throw new Error("Access Denied");
    }


    async init(){

        console.log(this.mode);
        console.log(this.body);
        try{

            this.userSession = await getSessionInfo(this.req, this.sessionStore);

            //this.userSession = null;

            if(this.userSession === null) throw new Error("Access Denied");


            if(this.mode === "load-importer-list"){

                return this.res.json(await getAllFTPSettings());

            }else if(this.mode === "add-ftp-server"){

                if(this.body.settings === undefined) throw new Error(`No settings supplied`);
                const insertId = await addFTPServer(this.body.settings);
              
                return this.res.json({insertId});

            }else if(this.mode === "edit-ftp-server"){

                if(this.body.settings === undefined) throw new Error(`No settings supplied`);
                await editFTPServer(this.body.settings);

                return this.res.json({"message": "passed"});

            }else if(this.mode === "delete-ftp-server"){

                if(this.body.serverId === undefined) throw new Error(`No server was selected to delete`);
                await deleteFTPServer(this.body.serverId);
                return this.res.json({"message": "passed"});

            }else if(this.mode === "edit-logs-folder-settings"){

                if(this.body.settings === undefined) throw new Error(`No settings supplied`);
                await updateLogsFolderSettings(this.body.settings);
                return this.res.json({"message": "passed"});

            }else if(this.mode === "load-maps"){

                const mapList = await getAllMaps();

                for(let i = 0; i < mapList.length; i++){

                    const m = mapList[i];
                    m.targetImage = `${getMapImageName(m.name)}.jpg`;
                }

                const mapImages = await getAllMapImages();

                return this.res.json({mapList, mapImages});

            }else if(this.mode === "upload-map-sshot"){
                
                let fileInfo = null;

                for(let i = 0; i < this.req.files.length; i++){

                    const f = this.req.files[i];

                    if(f.fieldname === "map-sshot"){
                        fileInfo = f;
                        break;
                    }
                }

                if(fileInfo === null) throw new Error(`Map screenshot not found.`);

                let mapName = this.req.body?.["map-name"] ?? null;
                if(mapName === null) throw new Error(`No map name found`);
                mapName = stripFileExtension(mapName);

                const uploadedName = await this.uploadMapScreenshot(fileInfo, mapName);
                return this.res.json({"message": "uploaded", "fileName": uploadedName});

            }else if(this.mode === "get-all-page-settings"){

                const settings = await getAllSiteSettings();
                const layouts = await getAllPagesLayout();
                const validRecordTypes = {"matches": VALID_PLAYER_MATCH_TYPES, "lifetime": VALID_PLAYER_LIFETIME_TYPES};

                return this.res.json({"pageSettings": settings, "pageLayouts": layouts, validRecordTypes});

            }else if(this.mode === "save-site-setting-changes"){

                const changes = this.req.body?.changes ?? null;

                if(changes === null) throw new Error(`You have not provided an array of changes`);

                const {passed, failed} = await updateSiteSettings(changes);
                const [lPassed, lFailed] = await savePageLayoutChanges(changes);

                return this.res.json({
                    "passed": passed + lPassed, 
                    "failed": failed + lFailed
                });

            }else if(this.mode === "load-ranking-settings"){

                const settings = await getAllRankingSettings();

                return this.res.json({settings});

            }else if(this.mode === "save-ranking-changes"){

                const changes = this.req.body?.changes ?? null;

                if(changes === null) throw new Error(`You have not provided an array of changes`);

                const result = await updateRankingSettings(changes);

                return this.res.json(result);

            }else if(this.mode === "recalculate-all-rankings"){

                const message = await recalculateAllRankings();

                return this.res.json({message});

            }else if(this.mode === "clear-database-tables"){

                await clearAllDataTables();

                return this.res.json({"message": "passed"});

            }else if(this.mode === "load-ctf-league-settings"){

                return this.res.json({"settings": await adminGetAllCTFLeagueSettings()});

            }else if(this.mode === "save-ctf-league-settings"){

                const changes = this.req.body?.changes ?? null;

                if(changes === null) throw new Error(`No changes supplied`);
                
                await adminUpdateCTFLeagueSettings(changes);

                return this.res.json({"message": "passed"});
            }



            this.res.json({"error": "Unknown Request"});

        }catch(err){
            console.trace(err);
            this.res.json({"error": err.message ?? "Error Message Not Found"});
        }
    }

    /**
     * 
     * @param {*} fileInfo multer fileInfo
     */
    async uploadMapScreenshot(fileInfo, name){

        const validMimes = [
            "image/png", 
            "image/x-ms-bmp", 
            "image/bmp", 
            "image/gif",
            "image/jpeg",
            "image/tiff"
        ];

        if(validMimes.indexOf(fileInfo.mimetype) === -1){
            throw new Error(`Filetype must be one of the following: ${validMimes}`);
        }

        const tmpFile = await Jimp.read(fileInfo.path);

        const imageBuffer = await tmpFile.getBuffer("image/jpeg", { "quality": mapScreenshotQuality });

        await writeFile(`./public/images/maps/${name}.jpg`, imageBuffer);
        await rm(fileInfo.path);

        return `${name}.jpg`;
        //await fart.write("./uploads/test.jpg", "image/jpeg");
    }
}