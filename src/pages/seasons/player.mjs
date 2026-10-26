
import { sanitizePlayerPageReq} from "../../players.mjs";
import { getSiteWideTimeZone } from "../../siteSettings.mjs";


export async function renderSeasonPlayerPage(req, res){

    try{

        let id = req?.params?.id ?? "";


        const timeZone = await getSiteWideTimeZone();
     
        const seasonId = res.locals.season;
        const seasonInfo = res.locals.seasonInfo;
        const bSkipSeasonLinks = res.locals.bSkipSeasonLinks;


        const {title, description,
        pageSettings, pageLayout, brandingSettings, playerId, basicPlayerInfo, weaponDamage,
        generalTotals, ctfTotals, weaponTotals, rankings, 
        ctfLeagueData, ctfLeagueSettings, activeSeasons} = await sanitizePlayerPageReq(id, seasonId, seasonInfo);
       

        res.render("player.ejs", {
            "meta": {description, "image": "images/maps/default.jpg"},
            "host": req.headers.host,
            title,
            basicPlayerInfo,
            "playerId": playerId,
            generalTotals,
            ctfTotals,
            weaponTotals,
            rankings,
            ctfLeagueData,
            "userSession": req.userSession,
            pageSettings,
            pageLayout,
            timeZone,
            weaponDamage,
            ctfLeagueSettings,
            activeSeasons,
            "bSeasonPage": true,
            seasonInfo,
            seasonId
        });

    }catch(err){
        res.send(err.toString());
    }
}