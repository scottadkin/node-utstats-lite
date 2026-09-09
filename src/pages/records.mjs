import { getCategorySettings, getSiteWideTimeZone } from "../siteSettings.mjs";
import { getAllNames as getAllGametypeNames } from "../gametypes.mjs";
import { VALID_PLAYER_MATCH_TYPES, VALID_PLAYER_LIFETIME_TYPES } from "../validRecordTypes.mjs";
import { getUniqueGametypeMapCombinations } from "../records.mjs";

export async function renderRecordsPage(req, res, userSession){

    
        try{
            
            const pageSettings = await getCategorySettings("Records");
            //const gametypeNames = await getAllGametypeNames(true);
            const timeZone = await getSiteWideTimeZone();

            const {gametypes, maps, combos} = await getUniqueGametypeMapCombinations();

            let mode = "";
    
           
            let title = "records";
            
    
            res.render("records.ejs",{
                "host": req.headers.host,
                timeZone,
                title,
                "meta": {"description": "description", "image": "images/maps/default.jpg"},
                mode,
                "validMatchTypes": VALID_PLAYER_MATCH_TYPES,
                "validLifetimeTypes": VALID_PLAYER_LIFETIME_TYPES,
                "gametypeList": gametypes,
                "mapList": maps,
                "gametypeMapCombos": combos,
               // gametypeNames,
               // selectedGametype,
               // selectedCat,
               // mode,
               // data,
               // totalResults,
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