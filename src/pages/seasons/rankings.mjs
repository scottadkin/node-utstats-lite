import { 
    getMinMatchesSetting, getRankingSettings, sanitizeRankingsPageReq, 
    getRankings
} from "../../rankings.mjs";
import { getCategorySettings, getSiteWideTimeZone } from "../../siteSettings.mjs";

export async function renderSeasonRankingsPage(req, res, userSession){

    try{

        const [pageSettings, timeZone, rankingSettings] = await Promise.all([

            getCategorySettings("Rankings"),
            getSiteWideTimeZone(),
            getRankingSettings(true)
        ]);

        const {mode, itemNames, targetId, timeRange, typeName, titleName, page, perPage} = await sanitizeRankingsPageReq(req, pageSettings);

        const seasonId = res.locals.season;
        const seasonInfo = res.locals.seasonInfo;

        let title = `${typeName} - ${titleName} Season Rankings`;

        const [data, minMatchesSetting] = await Promise.all([
            getRankings(seasonId, targetId, page, perPage, timeRange, mode),
            getMinMatchesSetting(mode)
        ]);

        res.render("rankings.ejs",{
            "host": req.headers.host,
            "title": title,
            "meta": {"description": `View season player ${mode} rankings for ${typeName}.`, "image": "images/maps/default/jpg"},
            mode,
            data,
            "names": itemNames,
            "selectedId": targetId,
            "selectedTimeRange": timeRange,
            "selectedPerPage": perPage,
            "currentPage": page,
            userSession,
            pageSettings,
            rankingSettings,
            minMatchesSetting,
            timeZone,
            "seasonId": seasonId,
            "bSeasonPage": true,
            seasonInfo
        });
    }catch(err){
        res.send(err.toString());
    }
}