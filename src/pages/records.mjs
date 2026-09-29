import { getCategorySettings, getSiteWideTimeZone } from "../siteSettings.mjs";
import { 
    VALID_PLAYER_MATCH_TYPES, VALID_PLAYER_LIFETIME_TYPES, 
    MODE_TITLES, 
    VALID_PLAYER_EPM_TYPES,
    VALID_PLAYER_MATCH_AVG_TYPES
} from "../validRecordTypes.mjs";
import { getUniqueGametypeMapCombinations, getRecords, sanitizeRecordsPageReq, createRecordsPageMetaData } from "../records.mjs";


export async function renderRecordsPage(req, res, userSession){

    
    try{
        
        const [pageSettings, brandingSettings, timeZone, {gametypes, maps, combos, ctfGametypes, ctfMaps, domGametypes, domMaps}] = await Promise.all([
            getCategorySettings("Records"),
            getCategorySettings("Branding"),
            getSiteWideTimeZone(),
            getUniqueGametypeMapCombinations()
        ]);


        const {
            mode, recordType, dirtyPage, 
            dirtyPerPage, selectedGametype, 
            selectedMap, selectedMinimumMatchesPlayed, 
            seasonId, seasonInfo
        } = await sanitizeRecordsPageReq(req, res, pageSettings, gametypes, maps);


        const {page, perPage, totalResults, data} = await getRecords(
            mode, recordType, selectedGametype, selectedMap, dirtyPage, dirtyPerPage,
            selectedMinimumMatchesPlayed, 0
        );

 
        const {title, description, modeDisplayName} = createRecordsPageMetaData(mode, recordType, gametypes, maps, selectedGametype, selectedMap, brandingSettings);


        
        res.render("records.ejs",{
            "host": req.headers.host,
            timeZone,
            title,
            "meta": {"description": description, "image": "images/maps/default.jpg"},
            mode,
            recordType,
            "validMatchTypes": VALID_PLAYER_MATCH_TYPES,
            "validLifetimeTypes": VALID_PLAYER_LIFETIME_TYPES,
            "validEPMTypes": VALID_PLAYER_EPM_TYPES,
            "validAvgTypes": VALID_PLAYER_MATCH_AVG_TYPES,
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
            ctfGametypes,
            ctfMaps,
            domGametypes,
            domMaps,
            userSession,
            "seasonId": 0,
            seasonInfo,
            "bSeasonPage": false,
            "siteName": brandingSettings["Site Name"],
            "selectedMinimumMatchesPlayed": selectedMinimumMatchesPlayed
        });
        
    }catch(err){
        console.trace(err);
        res.send(err.toString());
    }
}
