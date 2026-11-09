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
            mode, itemNames, gametypeId, mapId, 
            timeRange, typeName, titleName, page, perPage
        } = await sanitizeRankingsPageReq(req, pageSettings);


        let title = `${typeName}`;
        
        if(seasonInfo.id !== 0){
            title += ` - ${seasonInfo.name}`
        }


        title += ` - Rankings`;

        const [data, minMatchesSetting] = await Promise.all([
            getRankings(seasonId, gametypeId, mapId, page, perPage, timeRange, mode),
            getMinMatchesSetting(mode)
        ]);

        let description = "";
        if(seasonInfo.id !== 0){

            description = `View player ${typeName} rankings for the season ${seasonInfo.name}.`
        }else{


            description = `View player ${typeName} rankings for all time stats.`
        }

        res.render("rankings.ejs",{
            "host": req.headers.host,
            "title": title,
            "meta": {description, "image": "images/maps/default/jpg"},
            mode,
            data,
            "names": itemNames,
            "selectedGametype": gametypeId,
            "selectedMap": mapId,
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