
import { getSeasonById, getSeasonUniqueMatchCombinations } from "../../seasons.mjs";
import { getCategorySettings, getSiteWideTimeZone } from "../../siteSettings.mjs";
import { getRecentMatches, sanitizeMatchesReq } from "../../matches.mjs";

export async function renderSeasonMatchesPage(req, res){

    const seasonId = res.locals.season;

    const [
        brandingSettings, pageSettings, 
        timeZone, uniqueCombinations, basicSeasonInfo
    ] = await Promise.all([
        getCategorySettings("Branding"),
        getCategorySettings("Matches"),
        getSiteWideTimeZone(),
        getSeasonUniqueMatchCombinations(seasonId),
        getSeasonById(seasonId)
    ]);

    const title = `Matches - ${basicSeasonInfo.name} - ${brandingSettings?.["Site Name"] ?? "Node UTStats Lite"}`;


    const {
        page, perPage, selectedServer, 
        selectedGametype, selectedMap, displayMode
    } = sanitizeMatchesReq(req, pageSettings);

    const matches = await getRecentMatches(page, perPage, selectedServer, selectedGametype, selectedMap, false, seasonId);


    let description = `Search for matches played during the ${basicSeasonInfo.name} season.`;

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
            "seasonInfo": basicSeasonInfo,
            "bSeasonPage": true
        });
}