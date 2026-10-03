import { sanitizePlayerPageReq } from "../players.mjs";
import { getSiteWideTimeZone } from "../siteSettings.mjs";


export async function renderPlayerPage(req, res, userSession){

    try{

        let id = req?.params?.id ?? "";

        const timeZone = await getSiteWideTimeZone();
        

        const seasonId = res.locals.season;

        const {title, description,
        pageSettings, pageLayout, brandingSettings, playerId, basicPlayerInfo, weaponDamage,
        generalTotals, ctfTotals, weaponTotals, rankings, 
        ctfLeagueData, ctfLeagueSettings} = await sanitizePlayerPageReq(id, req, seasonId);
       

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
            "bSeasonPage": false,
            "seasonInfo": null,
            "seasonId": 0
        });

    }catch(err){
        res.send(err.toString());
    }
}