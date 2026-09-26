
import { searchMaps, sanitizeMapsReq } from "../../maps.mjs";
import { getSeasonById } from "../../seasons.mjs";
import { getCategorySettings, getSiteWideTimeZone } from "../../siteSettings.mjs";

export async function renderSeasonMapsPage(req, res){

    const brandingSettings = await getCategorySettings("Branding");
    const pageSettings = await getCategorySettings("Maps");
    let title = `Season - ${brandingSettings?.["Site Name"] ?? "Node UTStats Lite"}`;
    const timeZone = await getSiteWideTimeZone();

    const seasonId = (req.params.season !== undefined) ? parseInt(req.params.season) : null;

    if(seasonId === null) throw new Error(`Season missing`);
    if(seasonId !== seasonId) throw new Error(`Season must be a valid integer.`);
    
    const basicSeasonInfo = await getSeasonById(seasonId);

    if(basicSeasonInfo === null) throw new Error(`Season doesn't exist.`);

    let description = "View all the maps played on our servers.";

    const {nameSearch, page, perPage, displayMode, order, sortBy} = sanitizeMapsReq(req, pageSettings);


    if(nameSearch !== ""){
        title = `${nameSearch} - Map Search`;
        description = `Map search for names containing: ${nameSearch}`;
    }


    const {totalMatches, maps} = await searchMaps(nameSearch, page, perPage, sortBy, order, seasonId);


    res.render("maps.ejs",{
        req,
            "host": req.headers.host,
            timeZone,
            title,
            "meta": {"description": "Season Maps", "image": "images/maps/default.jpg"},
            "userSession": req.userSession,
            seasonId,
            "seasonInfo": basicSeasonInfo,
            "bSeasonPage": true,
            nameSearch,
            sortBy,
            order,
            displayMode,
            page, perPage, maps, totalMatches
        });
}