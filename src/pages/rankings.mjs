import { 
    getMinMatchesSetting, getMostActiveInTimeRange, getRankingSettings, 
    getRankings
} from "../rankings.mjs";
import { getCategorySettings, getSiteWideTimeZone } from "../siteSettings.mjs";
import { seasonGetAllGametypeNames, seasonGetAllMapNames } from "../seasons.mjs";

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

        let defaultLastActive = 28;

        if(req.query.tf !== undefined){
            defaultLastActive = req.query.tf;
        }else{

            const key = (mode === "gametype") ? "Default Last Active Limit(Gametypes)" : "Default Last Active Limit(Maps)"
            defaultLastActive = pageSettings?.[key];
        }

        const timeRange = defaultLastActive;

        if(targetId === 0){
            targetId = await getMostActiveInTimeRange(seasonId, mode, timeRange);
        }

        const data = await getRankings(seasonId, targetId, page, perPage, timeRange, mode);

        let title = "title";
        const itemNames = (mode === "gametype") ? await seasonGetAllGametypeNames(seasonId)  : await seasonGetAllMapNames(seasonId);

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