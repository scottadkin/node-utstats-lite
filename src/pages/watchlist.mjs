import { getCategorySettings, getSiteWideTimeZone } from "../siteSettings.mjs";

export async function renderWatchlistPage(req, res, userSession){

    try{

        const timeZone = await getSiteWideTimeZone();
        const brandingSettings = await getCategorySettings("Branding");
        const title = `Watchlist - ${brandingSettings?.["Site Name"] ?? "Node UTStats Lite"}`;

        res.render("watchlist.ejs", {
            "host": req.headers.host,
            timeZone,
            title,
            "meta": {
                "description": "View all your saved players and matches.",
                "image": "images/maps/default.jpg"
            },
            userSession

        });
    }catch(err){
        res.send(err.toString());
    }
}