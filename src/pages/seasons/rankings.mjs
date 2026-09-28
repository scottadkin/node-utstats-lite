import { 
    getMinMatchesSetting, getRankingSettings, sanitizeRankingsPageReq, 
    getRankings
} from "../../rankings.mjs";
import { getSeasonById } from "../../seasons.mjs";
import { getCategorySettings, getSiteWideTimeZone } from "../../siteSettings.mjs";

export async function renderSeasonRankingsPage(req, res, userSession){

    try{

        const pageSettings = await getCategorySettings("Rankings");
        const timeZone = await getSiteWideTimeZone();
        const rankingSettings = await getRankingSettings(true);

        const {mode, itemNames, targetId, timeRange, typeName, titleName, page, perPage, seasonId} = await sanitizeRankingsPageReq(req, pageSettings);

        if(seasonId === 0) throw new Error(`No season with id of 0`);

        const data = await getRankings(seasonId, targetId, page, perPage, timeRange, mode);

        let title = `${typeName} - ${titleName} Season Rankings`;

        const seasonInfo = await getSeasonById(seasonId);
       

        const minMatchesSetting = await getMinMatchesSetting(mode);

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