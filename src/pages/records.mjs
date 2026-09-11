import { getCategorySettings, getSiteWideTimeZone } from "../siteSettings.mjs";
import { 
    VALID_PLAYER_MATCH_TYPES, VALID_PLAYER_LIFETIME_TYPES, 
    bValidRecordType, getTypeDisplayName, MODE_TITLES 
} from "../validRecordTypes.mjs";

import { getUniqueGametypeMapCombinations, getPlayerMatchRecords, getPlayerLifetimeRecords } from "../records.mjs";
import { sanitizePagePerPage } from "../generic.mjs";

const VALID_MODES = [
    "player-lifetime",
    "player-match"
];

function bIdExists(data, id){

    for(let i = 0; i < data.length; i++){
        if(data[i].id === id) return true;
    }

    return false;
}

function getIdName(data, id){

    for(let i = 0; i < data.length; i++){

        if(data[i].id === id) return data[i].name;
    }

    return "Not Found";
}


export async function renderRecordsPage(req, res, userSession){

    
    try{
        
        const [pageSettings, brandingSettings, timeZone, {gametypes, maps, combos}] = await Promise.all([
            getCategorySettings("Records"),
            getCategorySettings("Branding"),
            getSiteWideTimeZone(),
            getUniqueGametypeMapCombinations()
        ]);


        let mode = (req.query.mode !== undefined) ? req.query.mode.toLowerCase() : "player-match";
        let recordType = (req.query.rec !== undefined) ? req.query.rec.toLowerCase() : "score";
        let selectedGametype = (req.query.gid !== undefined) ? parseInt(req.query.gid) : 0;
        let selectedMap = (req.query.mid !== undefined) ? parseInt(req.query.mid) : 0;
        let perPage = (req.query.pp !== undefined) ? parseInt(req.query.pp) : parseInt(pageSettings["Results Per Page"]);
        let page = (req.query.page !== undefined) ? parseInt(req.query.page) : 1;
        
        if(perPage !== perPage) perPage = 25;
        if(page !== page) page = 1;
        
        if(selectedGametype !== selectedGametype) selectedGametype = 0;
        if(selectedMap !== selectedMap) selectedMap = 0;

        if(selectedGametype !== 0 && !bIdExists(gametypes, selectedGametype)){
            selectedGametype = 0;
        }

        if(selectedMap !== 0 && !bIdExists(maps, selectedMap)){
            selectedMap = 0;
        }

        if(VALID_MODES.indexOf(mode) === -1) mode = "player-match";

        if(!bValidRecordType(mode, recordType)){

            if(mode === "player-match"){
                recordType = "max_score";
            }else{
                recordType = "score";
            }
        }

        let totalResults = 0;
        let data = [];


        if(mode === "player-match"){

            const result = await getPlayerMatchRecords(recordType, selectedGametype, selectedMap, page, perPage);
   
            totalResults = result.totalResults;
            data = result.data;

        }else if(mode === "player-lifetime"){

            const result = await getPlayerLifetimeRecords(recordType, selectedGametype, selectedMap, page, perPage);

            totalResults = result.totalResults;
            data = result.data;
        }        
 
        const modeDisplayName = getTypeDisplayName(mode, recordType);

        let title = `${MODE_TITLES[mode]} - ${modeDisplayName} - ${brandingSettings["Site Name"]}`;

        let description = `View the top ${modeDisplayName} ${MODE_TITLES[mode].toLowerCase()}`;

        if(selectedMap !== 0){
            description += `, where the map played was ${getIdName(maps, selectedMap)}`;
        }

        if(selectedGametype !== 0){
            description += `, ${(selectedMap !== 0) ? "and " : "where "}the gametype played was ${getIdName(gametypes, selectedGametype)}`;
        }

        description += `.`;

        
        res.render("records.ejs",{
            "host": req.headers.host,
            timeZone,
            title,
            "meta": {"description": description, "image": "images/maps/default.jpg"},
            mode,
            recordType,
            "validMatchTypes": VALID_PLAYER_MATCH_TYPES,
            "validLifetimeTypes": VALID_PLAYER_LIFETIME_TYPES,
            "gametypeList": gametypes,
            "mapList": maps,
            "gametypeMapCombos": combos,
            pageSettings,
            MODE_TITLES,
            selectedGametype,
            selectedMap,
            recordType,
            data,
            totalResults,
            perPage,
            page,
            // catTitle,
            // page,
            // perPage,
            userSession
        });
        
    }catch(err){
        console.trace(err);
        res.send(err.toString());
    }
}