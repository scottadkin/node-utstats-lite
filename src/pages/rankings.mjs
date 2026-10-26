import { 
    getMinMatchesSetting, getRankingSettings, 
    getRankings,
    sanitizeRankingsPageReq
} from "../rankings.mjs";
import { getCategorySettings, getSiteWideTimeZone } from "../siteSettings.mjs";

export async function renderRankingsPage(req, res){

    try{

        const [pageSettings, timeZone, rankingSettings] = await Promise.all([

            getCategorySettings("Rankings"),
            getSiteWideTimeZone(),
            getRankingSettings(true)
        ]);

        const {mode, itemNames, targetId, timeRange, typeName, titleName, page, perPage, seasonId} = await sanitizeRankingsPageReq(req, pageSettings)


        const [data, minMatchesSetting] = await Promise.all([
            getRankings(seasonId, targetId, page, perPage, timeRange, mode),
            getMinMatchesSetting(mode)
        ]);
       
        let title = `${typeName} - ${titleName} Rankings`;

        res.render("rankings.ejs",{
            "host": req.headers.host,
            "title": title,
            "meta": {"description": `View player ${mode} rankings for ${typeName}.`, "image": "images/maps/default/jpg"},
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
            "seasonId": 0,
            "seasonInfo": null,
            "bSeasonPage": false
        });
    }catch(err){
        res.send(err.toString());
    }
}