import { getAllSeasons } from "../seasons.mjs";
import { getCategorySettings, getSiteWideTimeZone } from "../siteSettings.mjs";

export async function renderSeasonsPage(req, res){

    
    const brandingSettings = await getCategorySettings("Branding");
    const title = `Season - ${brandingSettings?.["Site Name"] ?? "Node UTStats Lite"}`;
    const timeZone = await getSiteWideTimeZone();

    const seasons = await getAllSeasons();


    return res.render("seasons.ejs", {
        req,
            "host": req.headers.host,
            timeZone,
            title,
            "meta": {"description": "Login", "image": "images/maps/default.jpg"},
            "userSession": req.userSession ,
            "seasonsData": seasons
    });
}