
import { getRecentMatches } from "../matches.mjs";
import { getCategorySettings } from "../siteSettings.mjs";
import { getPageLayout } from "../pageLayout.mjs";
import { getBasicList as getBasicServerList } from "../servers.mjs";
import { getMostPlayedGametypes } from "../gametypes.mjs";
import { getMostPlayedMaps } from "../maps.mjs";

export async function renderHomePage(req, res, userSession){


    const pageSettings = await getCategorySettings("Home");
    const pageLayout = await getPageLayout("Home");

    const socialSettings = await getCategorySettings("Social Media");
    const welcomeMessageSettings = await getCategorySettings("Welcome Message");

    let perPage = pageSettings["Total Recent Matches"] ?? 5;

    const recentMatches = await getRecentMatches(1, perPage, 0, 0, 0);

    let serversList = [];

    if(pageSettings["Display Servers"] === "1"){
        serversList = await getBasicServerList();
    }

    let mostPlayedGametypes = [];

    if(pageSettings["Display Most Played Gametypes"] === "1"){
        mostPlayedGametypes = await getMostPlayedGametypes(pageSettings["Total Most Played Gametypes"]);
    }

    let mostPlayedMaps = [];

    if(pageSettings["Display Most Played Maps"] === "1"){
        mostPlayedMaps = await getMostPlayedMaps(pageSettings["Total Most Played Maps"]);
    }

    const brandingSettings = await getCategorySettings("Branding");

    const description = brandingSettings?.["Description"] ?? "Welcome to Node UTStats Lite Unreal Tournament stats tracking website";
    let title = brandingSettings?.["Site Name"] ?? "Node UTStats Lite";

    const message = req.query.message ?? null;

    return res.render("home.ejs", {
        "title": `Home - ${title}`,
        "meta": {
            "description": description,
            "image": "images/maps/default.jpg"
        },
        "host": req.headers.host,
        pageSettings,
        pageLayout,
        socialSettings,
        welcomeMessageSettings,
        recentMatches,
        serversList,
        userSession,
        message,
        mostPlayedGametypes,
        mostPlayedMaps
    });


}