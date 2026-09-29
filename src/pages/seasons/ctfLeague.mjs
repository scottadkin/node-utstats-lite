import { getLeagueSiteSettings, getUniqueGametypeLeagues, getUniqueMapLeagues, sanitizeCTFLeaguePageReq, setCTFLeaguePageMetaData } from "../../ctfLeague.mjs";
import { convertTimestamp } from "../../generic.mjs";
import { getGametypeNames } from "../../gametypes.mjs";
import { getMapNames } from "../../maps.mjs";
import { getSingleCTFLeague } from "../../ctfLeague.mjs";
import { getCategorySettings, getSiteWideTimeZone } from "../../siteSettings.mjs";
import { getSeasonById } from "../../seasons.mjs";

export async function renderSeasonCTFLeaguePage(req, res){

    try{

        const timeZone = await getSiteWideTimeZone();
        const pageSettings = await getCategorySettings("CTF League");

        
        const {
            mode, id, gId, seasonId, seasonInfo, 
            page, perPage, leagueSettings, maxMatchesPerPlayer, 
            maxMatchAge, lastLeagueRefresh
        } = await sanitizeCTFLeaguePageReq(req, pageSettings);

        const uniqueGametypes = await getUniqueGametypeLeagues(seasonId);
        const gametypeNames = await getGametypeNames(uniqueGametypes, true);

        let mapNames = {};

        if(mode === "maps"){

            const mapIds = await getUniqueMapLeagues(seasonId);
            mapNames = await getMapNames(mapIds);
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
        } = await setCTFLeaguePageMetaData(mode, gametypeNames, mapNames, id, gId);


        res.render("ctfLeague.ejs", {
            "host": req.headers.host,
            timeZone,
            title,
            "meta": {"description": `View the top players for the ${title}`, "image": "images/maps/default.jpg"},
            mode,
            maxMatchesPerPlayer,
            maxMatchAge,
            lastLeagueRefresh,
            gametypeNames,
            mapNames,
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