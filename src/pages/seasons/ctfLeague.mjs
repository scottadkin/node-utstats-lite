import { getUniqueGametypeLeagues, getUniqueMapLeagues, sanitizeCTFLeaguePageReq, setCTFLeaguePageMetaData } from "../../ctfLeague.mjs";
import { getSingleCTFLeague } from "../../ctfLeague.mjs";
import { getCategorySettings, getSiteWideTimeZone } from "../../siteSettings.mjs";

export async function renderSeasonCTFLeaguePage(req, res){

    try{

        const seasonId = res.locals.season;
        const seasonInfo = res.locals.seasonInfo;

        const [timeZone, pageSettings, gametypesInfo] = await Promise.all([
            getSiteWideTimeZone(),
            getCategorySettings("CTF League"),
            getUniqueGametypeLeagues(seasonId),
        ]);
        
        let {
            mode, id, gId, 
            page, perPage, leagueSettings, maxMatchesPerPlayer, 
            maxMatchAge, lastLeagueRefresh
        } = await sanitizeCTFLeaguePageReq(req, seasonId, pageSettings);


        let mapsInfo = {
            "names": {},
            "mapIds": []
        };

        if(mode === "maps"){

            mapsInfo = await getUniqueMapLeagues(seasonId, gId);

    
            if(mapsInfo.mapIds.indexOf(parseInt(id)) === -1 && mapsInfo.mapIds.length > 0){
                id = mapsInfo.mapIds[0];
            }
        }

        let data =  {"totalRows": 0, "data": []};

        if(mode === "gametypes"){
            data = await getSingleCTFLeague(seasonId, id, 0, page, perPage);
        }else if(mode === "maps"){
            data = await getSingleCTFLeague(seasonId, gId, id, page, perPage);
        }else if(mode === "combined"){
            data = await getSingleCTFLeague(seasonId, 0, 0, page, perPage);
        }

        //need to get latest played gametypeId and mapId

        const {
            title, brandingSettings, subHeader, 
            gametypeName, mapName 
        } = await setCTFLeaguePageMetaData(mode, gametypesInfo.names, mapsInfo.names, id, gId);


        res.render("ctfLeague.ejs", {
            "host": req.headers.host,
            timeZone,
            title,
            "meta": {"description": `View the top players for the ${title}`, "image": "images/maps/default.jpg"},
            mode,
            maxMatchesPerPlayer,
            maxMatchAge,
            lastLeagueRefresh,
            "gametypeNames": gametypesInfo.names,
            "mapNames": mapsInfo.names,
            id,
            gId,
            data,
            page,
            perPage,
            subHeader,
            "bSeasonPage": true,
            seasonInfo,
            "seasonId": seasonId,
            "userSession": req.userSession
        });
    }catch(err){
        res.send(err.toString());
    }
}