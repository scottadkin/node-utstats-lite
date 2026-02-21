import { 
    getMinMatchesSetting, getMostActiveInTimeRange, 
    getRankingsWithPlayerNames, 
    getUniqueGametypes, getUniqueMaps, getRankingSettings 
} from "../rankings.mjs";
import { getGametypeNames } from "../gametypes.mjs";
import { getNamesByIds as getMapNames } from "../maps.mjs";
import { getCategorySettings } from "../siteSettings.mjs";

export async function renderRankingsPage(req, res, userSession){

    try{


        const pageSettings = await getCategorySettings("Rankings");

        const rankingSettings = await getRankingSettings(true);

        let mode = req?.query?.mode ?? "gametype";
        mode = mode.toLowerCase();

        if(mode !== "gametype" && mode !== "map") mode = "gametype";

        let page = (req.query?.p !== undefined) ? parseInt(req.query.p) : 1;
        let perPage = req.query.pp ?? pageSettings["Results Per Page"] ?? 25;
        let targetId = (req.query?.id !== undefined) ? parseInt(req.query.id) : 0;

        let defaultLastActive = 28;

        if(req.query.tf !== undefined){
            defaultLastActive = req.query.tf;
        }else{

            const key = (mode === "gametype") ? "Default Last Active Limit(Gametypes)" : "Default Last Active Limit(Maps)"
            defaultLastActive = pageSettings?.[key];
        }

        const timeRange = defaultLastActive;

        if(targetId === 0){

            targetId = await getMostActiveInTimeRange(mode, timeRange);
        }

        let title = `Player Rankings`;

        let ids = [];

        let typeName = "";

        if(mode === "gametype"){

            
            if(targetId !== 0){
                const names = await getGametypeNames(targetId, true);
                typeName = `${names?.[targetId]} ` ?? "Not Found ";
            }
            
            title = `${typeName}Player Gametype Rankings`;
            ids = await getUniqueGametypes();

        }else if(mode === "map"){
  
            if(targetId !== 0){
                const names = await getMapNames(targetId);
                typeName = `${names?.[targetId]} ` ?? "Not Found ";
            }

            title = `${typeName}Player Map Rankings`;
            ids = await getUniqueMaps();
        }

        const data = await getRankingsWithPlayerNames(targetId, page, perPage, timeRange, mode);

        let itemNames = [];
        
        if(mode === "gametype"){

            itemNames = await getGametypeNames(ids, true);

        }else if(mode === "map"){
            itemNames = await getMapNames(ids);
        }

        const brandingSettings = await getCategorySettings("Branding");
        title = `${title} - ${brandingSettings?.["Site Name"] ?? "Node UTStats Lite"}`;


        const minMatchesSetting = await getMinMatchesSetting(mode);

        res.render("rankings.ejs",{
            "host": req.headers.host,
            "title": title,
            "meta": {"description": "Player rankings", "image": "images/maps/default/jpg"},
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
            minMatchesSetting
        });
    }catch(err){
        res.send(err.toString());
    }
}