import { 
    getMinMatchesSetting, getMostActiveInTimeRange, 
    getRankingsWithPlayerNames, 
    getUniqueGametypes, getUniqueMaps, getRankingSettings, 
    getRankings
} from "../rankings.mjs";
import { getGametypeNames } from "../gametypes.mjs";
import { getNamesByIds as getMapNames } from "../maps.mjs";
import { getCategorySettings, getSiteWideTimeZone } from "../siteSettings.mjs";

export async function renderRankingsPage(req, res, userSession){

    try{


        const pageSettings = await getCategorySettings("Rankings");
        const timeZone = await getSiteWideTimeZone();
        const rankingSettings = await getRankingSettings(true);

        let mode = req?.query?.mode ?? "gametype";
        mode = mode.toLowerCase();

        if(mode !== "gametype" && mode !== "map") mode = "gametype";

        let page = (req.query.p !== undefined) ? parseInt(req.query.p) : 1;
        let perPage = req.query.pp ?? pageSettings["Results Per Page"] ?? 25;
        let targetId = (req.query.id !== undefined) ? parseInt(req.query.id) : 0;
        let seasonId = req.params?.season ?? 0;

        console.log(seasonId);

        let defaultLastActive = 28;

        if(req.query.tf !== undefined){
            defaultLastActive = req.query.tf;
        }else{

            const key = (mode === "gametype") ? "Default Last Active Limit(Gametypes)" : "Default Last Active Limit(Maps)"
            defaultLastActive = pageSettings?.[key];
        }

        const timeRange = defaultLastActive;

        const data = await getRankings(seasonId, targetId, page, perPage, timeRange, mode);

        console.log(data);

        let title = "title";
        const itemNames = [];


        const minMatchesSetting = await getMinMatchesSetting(mode);

        res.render("rankings.ejs",{
            "host": req.headers.host,
            "title": title,
            "meta": {"description": `UPDATE DESCRIPTION View player rankings.`, "image": "images/maps/default/jpg"},
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
            "bSeasonPage": false
        });
    }catch(err){
        res.send(err.toString());
    }
}