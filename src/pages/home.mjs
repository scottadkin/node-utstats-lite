
import { getRecentMatches } from "../matches.mjs";
import { getCategorySettings } from "../siteSettings.mjs";
import { getBasicList as getBasicServerList } from "../servers.mjs";

export async function renderHomePage(req, res, userSession){

    try{

        const pageSettings = await getCategorySettings("Home");
        const socialSettings = await getCategorySettings("Social Media");
        const welcomeMessageSettings = await getCategorySettings("Welcome Message");
        const recentMatches = await getRecentMatches(1, 5, 0, 0, 0);

        const serversList = await getBasicServerList();

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
            socialSettings,
            welcomeMessageSettings,
            recentMatches,
            serversList,
            userSession,
            message
        });

    }catch(err){
        res.send(err.toString());
    }
}