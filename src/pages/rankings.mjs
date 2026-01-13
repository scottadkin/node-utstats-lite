import { getRankingsWithPlayerNames, getUniqueGametypes } from "../rankings.mjs";
import { getLatestMatchGametypeMapIds } from "../matches.mjs";
import { getGametypeNames } from "../gametypes.mjs";
import { getNamesByIds as getMapNames } from "../maps.mjs";
import { getUniqueMaps } from "../rankings.mjs";
import { getCategorySettings } from "../siteSettings.mjs";

export async function renderRankingsPage(req, res, userSession){

    try{
        let mode = req?.query?.mode ?? "gametype";
        mode = mode.toLowerCase();

        let page = (req?.query?.p !== undefined) ? parseInt(req.query.p) : 1;
        let perPage = (req?.query?.pp !== undefined) ? parseInt(req.query.pp) : 25;
        let targetId = (req?.query?.id !== undefined) ? parseInt(req.query.id) : 0;
        let timeRange = (req?.query?.tf !== undefined) ? parseInt(req.query.tf) : 0;

        if(targetId === 0){

            const latestIds = await getLatestMatchGametypeMapIds();


            if(latestIds !== null){

                if(mode !== "maps"){
                    targetId = latestIds.gametypeId;
                }else{
                    targetId = latestIds.mapId;
                }
            }
        }

        let title = `Player Rankings`;

        let ids = [];

        let typeName = "";

        if(mode === "gametype"){

            const names = await getGametypeNames(targetId, true);
            typeName = names?.[targetId] ?? "Not Found";
            title = `${typeName} Player Gametype Rankings`;
            ids = await getUniqueGametypes();

        }else if(mode === "map"){

            const names = await getMapNames(targetId);
            typeName = names?.[targetId] ?? "Not Found";
            title = `${typeName} Player Map Rankings`;
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
            userSession
        });
    }catch(err){
        res.send(err.toString());
    }
}