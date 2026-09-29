import { getCategorySettings, getSiteWideTimeZone } from "../../siteSettings.mjs";
import { 
    VALID_PLAYER_MATCH_TYPES, VALID_PLAYER_LIFETIME_TYPES, 
    getTypeDisplayName, MODE_TITLES, 
    VALID_PLAYER_EPM_TYPES,
    VALID_PLAYER_MATCH_AVG_TYPES,
} from "../../validRecordTypes.mjs";
import { getUniqueGametypeMapCombinations, getRecords, sanitizeRecordsPageReq } from "../../records.mjs";


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


export async function renderSeasonRecordsPage(req, res, userSession){

    
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
        } = await sanitizeRecordsPageReq(req, res, pageSettings);


        const {page, perPage, totalResults, data} = await getRecords(
            mode, recordType, selectedGametype, selectedMap, dirtyPage, dirtyPerPage,
            selectedMinimumMatchesPlayed, 0
        );

 
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
            seasonInfo,
            "seasonId": seasonId,
            "bSeasonPage": true,
            "siteName": brandingSettings["Site Name"],
            "selectedMinimumMatchesPlayed": selectedMinimumMatchesPlayed,
            
        });
        
    }catch(err){
        console.trace(err);
        res.send(err.toString());
    }
}