
import { getSeasonById, getSeasonUniqueMatchCombinations } from "../../seasons.mjs";
import { getCategorySettings, getSiteWideTimeZone } from "../../siteSettings.mjs";
import { getRecentMatches, sanitizeMatchesReq } from "../../matches.mjs";

export async function renderSeasonMatchesPage(req, res){

    const brandingSettings = await getCategorySettings("Branding");
    const pageSettings = await getCategorySettings("Matches");
    const title = `Season - ${brandingSettings?.["Site Name"] ?? "Node UTStats Lite"}`;
    const timeZone = await getSiteWideTimeZone();

    const seasonId = res.locals.season;
    
    const uniqueCombinations = await getSeasonUniqueMatchCombinations(seasonId);

    const basicSeasonInfo = await getSeasonById(seasonId);

    if(basicSeasonInfo === null) throw new Error(`Season doesn't exist.`);




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
            "meta": {"description": "Season Matches", "image": "images/maps/default.jpg"},
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
            "seasonInfo": basicSeasonInfo,
            "bSeasonPage": true
        });
}