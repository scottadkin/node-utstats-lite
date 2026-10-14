
import { searchMaps, sanitizeMapsReq } from "../../maps.mjs";
import { getCategorySettings, getSiteWideTimeZone } from "../../siteSettings.mjs";

export async function renderSeasonMapsPage(req, res){


    const [brandingSettings, pageSettings, timeZone] = await Promise.all([
        getCategorySettings("Branding"),
        getCategorySettings("Maps"),
        getSiteWideTimeZone()
    ]);

    const seasonId = res.locals.season;
    const seasonInfo = res.locals.seasonInfo;

    let title = `${seasonInfo.name} Maps - ${brandingSettings?.["Site Name"] ?? "Node UTStats Lite"}`;

    let description = `View all the maps played on our servers during the ${seasonInfo.name} season.`;

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
            "meta": {description, "image": "images/maps/default.jpg"},
            "userSession": req.userSession,
            seasonId,
            seasonInfo,
            "bSeasonPage": true,
            nameSearch,
            sortBy,
            order,
            displayMode,
            page, perPage, maps, totalMatches
        });
}