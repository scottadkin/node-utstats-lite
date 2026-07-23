import { convertTimestamp, toPlaytime } from "../generic.mjs";
import { 
    getPlayerGametypeTotals,
    getPlayerAllMapTotals,
    getPlayerProfileInfo,
    getUniquePlayedType,
    getPlayerGeneralSummary
 } from "../players.mjs";
import { getPlayerCTFTotals } from "../ctf.mjs";
import { getPlayerTotals as getPlayerWeaponTotals } from "../weapons.mjs";
import { getPlayerRankings } from "../rankings.mjs";
import { getPlayerMapsLeagueData } from "../ctfLeague.mjs";
import { getCategorySettings } from "../siteSettings.mjs";
import { getPageLayout } from "../pageLayout.mjs";


export async function renderPlayerPage(req, res, userSession){

    try{

        let id = req?.params?.id ?? "";

        const basicPlayerInfo = await getPlayerProfileInfo(id);

        if(basicPlayerInfo === null) throw new Error(`Player does not exist!`);

        let title = `${basicPlayerInfo.name} - Player Profile`;

        const lastSeenString = convertTimestamp(basicPlayerInfo.last_active, true, false, true);
        const playtimeString = toPlaytime(basicPlayerInfo.playtime);

        let description = `View the player profile of ${basicPlayerInfo.name}, `;
        description += `they were last seen ${lastSeenString}, and have played for a total of ${playtimeString}`;

        const playerId = basicPlayerInfo.id;

        if(basicPlayerInfo.country === "") basicPlayerInfo.country = "xx";

        const [pageSettings, pageLayout, brandingSettings,] = await Promise.all([
            getCategorySettings("Player"),
            getPageLayout("Player"),
            getCategorySettings("Branding")]
        );



        const generalTotals = await getPlayerGeneralSummary(playerId);




        let ctfTotals = [];

        if(pageSettings["Display CTF"] === 1){
            ctfTotals = await getPlayerCTFTotals(playerId);
        }

        let weaponTotals = [];

        if(pageSettings["Display Weapons"] === 1){
  
            weaponTotals = await getPlayerWeaponTotals(playerId);    
      
        }


        let rankingDayRange = (pageSettings["Rankings Activity Range"] !== undefined) ? parseInt(pageSettings["Rankings Activity Range"]) : 28;

        if(rankingDayRange !== rankingDayRange) rankingDayRange = 28;

        const dateMin = 60 * 60 * 24 * rankingDayRange;
     
        const minDate = new Date(Date.now() - dateMin * 1000);

        let rankings = null;

        if(pageSettings["Display Rankings"] === 1){
            //no real speed diffs with indexes
            rankings = await getPlayerRankings(playerId, minDate);
            rankings.minDate = minDate;
            rankings.maxDays = rankingDayRange;
        
        }
        
        let ctfLeagueData = [];

        if(pageSettings["Display CTF League"] === 1){
            ctfLeagueData = await getPlayerMapsLeagueData(playerId);
        }
        
        
        title = `${title} - ${brandingSettings?.["Site Name"] ?? "Node UTStats Lite"}`;

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
            pageLayout
        });

    }catch(err){
        res.send(err.toString());
    }
}