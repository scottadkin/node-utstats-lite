
import { sanitizePlayerPageReq} from "../../players.mjs";
import { getSeasonById } from "../../seasons.mjs";
import { getSiteWideTimeZone } from "../../siteSettings.mjs";


export async function renderSeasonPlayerPage(req, res, userSession){

    try{

        let id = req?.params?.id ?? "";


        const timeZone = await getSiteWideTimeZone();
     
        const seasonId = res.locals.season;

        const {title, description,
        pageSettings, pageLayout, brandingSettings, playerId, basicPlayerInfo, weaponDamage,
        generalTotals, ctfTotals, weaponTotals, rankings, 
        ctfLeagueData, ctfLeagueSettings} = await sanitizePlayerPageReq(id, req, seasonId);


        const seasonInfo = await getSeasonById(seasonId);
       

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
            userSession,
            pageSettings,
            pageLayout,
            timeZone,
            weaponDamage,
            ctfLeagueSettings,
            "bSeasonPage": true,
            seasonInfo,
            seasonId
        });

    }catch(err){
        res.send(err.toString());
    }
}