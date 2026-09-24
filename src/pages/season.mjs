import { getSeasonPlayers } from "../players.mjs";
import { getSeasonBasicObjectStats, getSeasonById } from "../seasons.mjs";
import { getCategorySettings, getSiteWideTimeZone } from "../siteSettings.mjs";

export async function renderSeasonPage(req, res){

    const brandingSettings = await getCategorySettings("Branding");
    const title = `Season - ${brandingSettings?.["Site Name"] ?? "Node UTStats Lite"}`;
    const timeZone = await getSiteWideTimeZone();

    let seasonId = req.params.season ?? 0;

    seasonId = parseInt(seasonId);
    if(seasonId !== seasonId) seasonId = 0;

    const basicSeasonInfo = await getSeasonById(seasonId);

    if(basicSeasonInfo === null) throw new Error(`Season doesn't exist`);

    const objectStats = await getSeasonBasicObjectStats(seasonId);

    const testPlayers = await getSeasonPlayers(seasonId);
    
    res.render("season.ejs",{
        req,
            "host": req.headers.host,
            timeZone,
            title,
            "meta": {"description": "Login", "image": "images/maps/default.jpg"},
            "userSession": req.userSession,
            basicSeasonInfo,
            objectStats, testPlayers
        });
    //res.json({"test": "test"});
}