import { sanitizeMapsReq, searchMaps, VALID_MAP_SEARCH_BY } from "../maps.mjs";
import { getCategorySettings, getSiteWideTimeZone } from "../siteSettings.mjs";


export async function renderMapsPage(req, res, userSession){

    try{
        const timeZone = await getSiteWideTimeZone();
        const pageSettings = await getCategorySettings("Maps");

        let title = "Maps";
        let description = "View all the maps played on our servers.";

        const {nameSearch, page, perPage, displayMode, order, sortBy} = sanitizeMapsReq(req, pageSettings);


        if(nameSearch !== ""){
            title = `${nameSearch} - Map Search`;
            description = `Map search for names containing: ${nameSearch}`;
        }
        
        const brandingSettings = await getCategorySettings("Branding");
        title = `${title} - ${brandingSettings?.["Site Name"] ?? "Node UTStats Lite"}`;

        const {totalMatches, maps} = await searchMaps(nameSearch, page, perPage, sortBy, order, 0);

        res.render("maps.ejs",{
            "host": req.headers.host,
            timeZone,
            title,
            "meta": {"description": description, "image": "images/maps/default.jpg"},
            sortBy,
            order,
            displayMode,
            nameSearch,
            totalMatches,
            maps,
            userSession,
            perPage,
            page,
            "seasonId": 0
        });
    }catch(err){
        console.trace(err);
    }
}