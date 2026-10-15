import { convertTimestamp, toPlaytime } from "../generic.mjs";
import { getAllSeasons, getSeasonBasicObjectStats, getSeasonById, seasonsGetMostPlayedMaps } from "../seasons.mjs";
import { getCategorySettings, getSiteWideTimeZone } from "../siteSettings.mjs";


export async function renderSeasonPage(req, res){



    const [brandingSettings, timeZone] = await Promise.all([
        getCategorySettings("Branding"), 
        getSiteWideTimeZone()
    ]);

    const basicSeasonInfo = res.locals.seasonInfo;

    const title = `${basicSeasonInfo.name} - ${brandingSettings?.["Site Name"] ?? "Node UTStats Lite"}`;
    
    let description = `${basicSeasonInfo.name} season started ${convertTimestamp(basicSeasonInfo.start_date, true, true)}`;
    description += ` and ended ${convertTimestamp(basicSeasonInfo.end_date, true, true)}.`;
    description += ` ${basicSeasonInfo.total_matches} matches where played with a total of ${basicSeasonInfo.total_players} players,`;
    description += ` with a total playtime of ${toPlaytime(basicSeasonInfo.total_playtime)}.`;

    const seasonId = res.locals.season;

    

    const objectStats = await getSeasonBasicObjectStats(seasonId);

    const mostPlayedMaps = await seasonsGetMostPlayedMaps(seasonId,23);

    res.render("season.ejs",{
        req,
            "host": req.headers.host,
            timeZone,
            title,
            "meta": {description, "image": "images/maps/default.jpg"},
            "userSession": req.userSession,
            basicSeasonInfo,
            objectStats,
            mostPlayedMaps,
            seasonId
        });
}