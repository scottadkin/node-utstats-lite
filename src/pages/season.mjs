import { getAllSeasons, getSeasonBasicObjectStats, getSeasonById, seasonsGetMostPlayedMaps } from "../seasons.mjs";
import { getCategorySettings, getSiteWideTimeZone } from "../siteSettings.mjs";

export async function renderSeasonPage(req, res){

    const brandingSettings = await getCategorySettings("Branding");
    const title = `Season - ${brandingSettings?.["Site Name"] ?? "Node UTStats Lite"}`;
    const timeZone = await getSiteWideTimeZone();

    const seasonList = res.locals.seasonsList;
   
    const seasonId = res.locals.season;

    const basicSeasonInfo = res.locals.seasonInfo;

    const objectStats = await getSeasonBasicObjectStats(seasonId);

    const mostPlayedMaps = await seasonsGetMostPlayedMaps(seasonId,3);

    res.render("season.ejs",{
        req,
            "host": req.headers.host,
            timeZone,
            title,
            "meta": {"description": "Login", "image": "images/maps/default.jpg"},
            "userSession": req.userSession,
            basicSeasonInfo,
            objectStats,
            mostPlayedMaps,
            seasonList,
            seasonId
        });
    //res.json({"test": "test"});
}