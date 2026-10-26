import { 
    getMinMatchesSetting, getRankingSettings, sanitizeRankingsPageReq, 
    getRankings
} from "../../rankings.mjs";
import { getCategorySettings, getSiteWideTimeZone } from "../../siteSettings.mjs";

export async function renderSeasonRankingsPage(req, res){

    try{

        const [pageSettings, timeZone, rankingSettings] = await Promise.all([

            getCategorySettings("Rankings"),
            getSiteWideTimeZone(),
            getRankingSettings(true)
        ]);

        const seasonId = res.locals.season;
        const seasonInfo = res.locals.seasonInfo;

        const {
            mode, itemNames, targetId, 
            timeRange, typeName, titleName, page, perPage
        } = await sanitizeRankingsPageReq(req, pageSettings);

        

        let title = `${typeName} - ${seasonInfo.name} - Rankings`;

        const [data, minMatchesSetting] = await Promise.all([
            getRankings(seasonId, targetId, page, perPage, timeRange, mode),
            getMinMatchesSetting(mode)
        ]);

        res.render("rankings.ejs",{
            "host": req.headers.host,
            "title": title,
            "meta": {"description": `View player ${typeName} rankings for the season ${seasonInfo.name}.`, "image": "images/maps/default/jpg"},
            mode,
            data,
            "names": itemNames,
            "selectedId": targetId,
            "selectedTimeRange": timeRange,
            "selectedPerPage": perPage,
            "currentPage": page,
            "userSession": req.userSession,
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