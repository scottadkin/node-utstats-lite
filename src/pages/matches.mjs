import { getAllNames as getAllServerNames } from "../servers.mjs";
import { getAllGametypesWithBGametype } from "../gametypes.mjs";
import { getAllMapNamesWithBGametype } from "../maps.mjs";
import { getAllUniqueGametypeMapCombinations, getRecentMatches, sanitizeMatchesReq } from "../matches.mjs";
import { getCategorySettings, getSiteWideTimeZone } from "../siteSettings.mjs";
import { bUseSeasons } from "../../config.mjs";
import { getSeasonUniqueMatchCombinations } from "../seasons.mjs";

export async function renderMatchesPage(req, res, userSession){

    try{

        const [serverNames, pageSettings, timeZone, gametypeNames, mapNames, uniqueGametypeMapCombos] = await Promise.all([
            getAllServerNames(true),
            getCategorySettings("Matches"),
            getSiteWideTimeZone(),
            getAllGametypesWithBGametype(true),
            getAllMapNamesWithBGametype(true),
            getAllUniqueGametypeMapCombinations()
        ]);
  
        const uniqueCombinations = await getSeasonUniqueMatchCombinations(0);
  
        const {
            page, perPage, selectedServer, 
            selectedGametype, selectedMap, displayMode
        } = sanitizeMatchesReq(req, pageSettings);

        const seasonId = 0;

   
        const matches = await getRecentMatches(page, perPage, selectedServer, selectedGametype, selectedMap, false, 0);
  
        const brandingSettings = await getCategorySettings("Branding");
        const title = `Recent Matches - ${brandingSettings?.["Site Name"] ?? "Node UTStats Lite"}`;

        res.render('matches.ejs', {
            "title": title,
            "host": req.headers.host,
            "meta": {
                "description": "View recent matches played on our Unreal Tournament servers.",
                "image": "/images/maps/default.jpg"
            },
            uniqueCombinations,
            uniqueGametypeMapCombos,
            selectedServer,
            selectedGametype,
            selectedMap,
            matches,
            page,
            pageSettings,
            displayMode,
            perPage,
            userSession,
            timeZone,
            seasonId
        });

    }catch(err){
        res.send(`Error: ${err.toString()}`);
    }
}