import { getUniqueGametypeLeagues, getUniqueMapLeagues, sanitizeCTFLeaguePageReq, setCTFLeaguePageMetaData } from "../ctfLeague.mjs";
import { getSingleCTFLeague } from "../ctfLeague.mjs";
import { getCategorySettings, getSiteWideTimeZone } from "../siteSettings.mjs";

export async function renderCTFLeaguePage(req, res){

    try{

        const seasonId = 0;

        const [timeZone, pageSettings, gametypesInfo] = await Promise.all([
            getSiteWideTimeZone(),
            getCategorySettings("CTF League"),
            getUniqueGametypeLeagues(0),
        ]);

        let {
            mode, id, gId, 
            page, perPage, leagueSettings, 
            maxMatchesPerPlayer, maxMatchAge, lastLeagueRefresh
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
            data = await getSingleCTFLeague(0, id, 0, page, perPage);
        }else if(mode === "maps"){
            data = await getSingleCTFLeague(0, gId, id, page, perPage);
        }else if(mode === "combined"){
            data = await getSingleCTFLeague(0, 0, 0, page, perPage);
        }

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
            "userSession": req.userSession,
            "bSeasonPage": false,
            "seasonInfo": null,
            "seasonId": 0
        });
    }catch(err){
        res.send(err.toString());
    }
}