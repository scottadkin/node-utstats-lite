import { convertTimestamp, toPlaytime } from "../generic.mjs";
import { 
        getPlayerProfileInfo,
        getPlayerGeneralSummary,
        sanitizePlayerPageReq
 } from "../players.mjs";
import { getPlayerCTFTotals } from "../ctf.mjs";
import { getPlayerTotals as getPlayerWeaponTotals } from "../weapons.mjs";
import { getPlayerRankings } from "../rankings.mjs";
import { getLeagueSiteSettings, getPlayerMapsLeagueData } from "../ctfLeague.mjs";
import { getCategorySettings, getSiteWideTimeZone } from "../siteSettings.mjs";
import { getPageLayout } from "../pageLayout.mjs";
import { getPlayerWeaponDamageTotals } from "../playerWeaponDamage.mjs";


export async function renderPlayerPage(req, res, userSession){

    try{

        let id = req?.params?.id ?? "";


        const timeZone = await getSiteWideTimeZone();
        

        const {title, description,
        pageSettings, pageLayout, brandingSettings, playerId, basicPlayerInfo, weaponDamage,seasonId,
        generalTotals, ctfTotals, weaponTotals, rankings, 
        ctfLeagueData, ctfLeagueSettings} = await sanitizePlayerPageReq(id, req);

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