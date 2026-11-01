
import { getSeasonById, getSeasonUniqueMatchCombinations } from "../../seasons.mjs";
import { getCategorySettings, getSiteWideTimeZone } from "../../siteSettings.mjs";
import { getRecentMatches, sanitizeMatchesReq } from "../../matches.mjs";

export async function renderSeasonMatchesPage(req, res){

    const seasonId = res.locals.season;

    const [
        brandingSettings, pageSettings, 
        timeZone, uniqueCombinations
    ] = await Promise.all([
        getCategorySettings("Branding"),
        getCategorySettings("Matches"),
        getSiteWideTimeZone(),
        getSeasonUniqueMatchCombinations(seasonId),
        getSeasonById(seasonId)
    ]);

    const seasonInfo = res.locals.seasonInfo;

    let description = "";
    let title = "Matches";

    if(seasonInfo.id !== 0){
        title += ` - ${seasonInfo.name}`;
    }
    title += ` - ${brandingSettings?.["Site Name"] ?? "Node UTStats Lite"}`;

    if(!res.locals.bSkipSeasonLinks || seasonInfo.id !== 0){
 
        description = `Search for matches played during the ${seasonInfo.name} season.`;
    }else{
        description = `Search for matches played on our servers.`
    }


    


    const {
        page, perPage, selectedServer, 
        selectedGametype, selectedMap, displayMode
    } = sanitizeMatchesReq(req, pageSettings);

    const matches = await getRecentMatches(page, perPage, selectedServer, selectedGametype, selectedMap, false, seasonId);


    
    

    res.render("matches.ejs",{
        req,
            "host": req.headers.host,
            timeZone,
            title,
            "meta": {description, "image": "images/maps/default.jpg"},
            "userSession": req.userSession,
            uniqueCombinations,
            selectedServer,
            selectedGametype,
            selectedMap,
            matches,
            page,
            perPage,
            displayMode,
            seasonId,
            seasonInfo,
            "bSeasonPage": true
        });
}