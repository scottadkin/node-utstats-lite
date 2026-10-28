import { convertTimestamp, toPlaytime } from "../generic.mjs";
import { getRecentMatches } from "../matches.mjs";
import { getPageLayout } from "../pageLayout.mjs";
import { getMostActivePlayers } from "../players.mjs";
import { getSeasonBasicObjectStats,seasonsGetMostPlayedMaps } from "../seasons.mjs";
import { getCategorySettings, getSiteWideTimeZone } from "../siteSettings.mjs";


export async function renderSeasonPage(req, res){



    const [brandingSettings, timeZone, socialSettings, welcomeMessageSettings, pageSettings, pageLayout] = await Promise.all([
        getCategorySettings("Branding"), 
        getSiteWideTimeZone(),
        getCategorySettings("Social Media"),
        getCategorySettings("Welcome Message"),
        getCategorySettings("Home"),
        getPageLayout("Home")

    ]);

    const basicSeasonInfo = res.locals.seasonInfo;

    const title = `${basicSeasonInfo.name} - ${brandingSettings?.["Site Name"] ?? "Node UTStats Lite"}`;
    
    let description = `${basicSeasonInfo.name} season started ${convertTimestamp(basicSeasonInfo.start_date, true, true)}`;
    description += ` and ended ${convertTimestamp(basicSeasonInfo.end_date, true, true)}.`;
    description += ` ${basicSeasonInfo.total_matches} matches where played with a total of ${basicSeasonInfo.total_players} players,`;
    description += ` with a total playtime of ${toPlaytime(basicSeasonInfo.total_playtime)}.`;

    const seasonId = res.locals.season;

    const maxMaps = pageSettings["Total Most Played Maps"];
    const maxGametypes = pageSettings["Total Most Played Gametypes"];
    const maxPlayers = pageSettings["Total Most Active Players"];
    const maxServers = pageSettings["Total Most Played Servers"]
    
    const objectStats = await getSeasonBasicObjectStats(seasonId, maxServers, maxGametypes, maxMaps);

    let mostActivePlayers = [];
    
    if(pageSettings["Display Most Active Players"] === 1){
        mostActivePlayers = await getMostActivePlayers(pageSettings["Total Most Active Players"], seasonId);
    }

    const perPage = pageSettings["Total Recent Matches"];

    const recentMatches = await getRecentMatches(1, perPage, 0, 0, 0, true, seasonId);


    res.render("season.ejs",{
        req,
            "host": req.headers.host,
            timeZone,
            title,
            "meta": {description, "image": "images/maps/default.jpg"},
            "userSession": req.userSession,
            basicSeasonInfo,
            objectStats,
            seasonId,
            welcomeMessageSettings,
            socialSettings,
            pageSettings,
            pageLayout,
            recentMatches,
            mostActivePlayers
        });
}