import { 
    getMinMatchesSetting, getRankingSettings, 
    getRankings,
    sanitizeRankingsPageReq
} from "../rankings.mjs";
import { getCategorySettings, getSiteWideTimeZone } from "../siteSettings.mjs";

export async function renderRankingsPage(req, res, userSession){

    try{

        const [pageSettings, timeZone, rankingSettings] = await Promise.all([

            getCategorySettings("Rankings"),
            getSiteWideTimeZone(),
            getRankingSettings(true)
        ]);

        const {mode, itemNames, targetId, timeRange, typeName, titleName, page, perPage, seasonId} = await sanitizeRankingsPageReq(req, pageSettings)

        let title = `${typeName} - ${titleName} Rankings`;

        const [data, minMatchesSetting] = await Promise.all([
            getRankings(seasonId, targetId, page, perPage, timeRange, mode),
            getMinMatchesSetting(mode)
        ]);
       

        res.render("rankings.ejs",{
            "host": req.headers.host,
            "title": title,
            "meta": {"description": `View the player ${mode} rankings for ${typeName}.`, "image": "images/maps/default/jpg"},
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
            "seasonId": 0,
            "seasonInfo": null,
            "bSeasonPage": false
        });
    }catch(err){
        res.send(err.toString());
    }
}