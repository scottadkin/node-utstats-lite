import { getAllUniquePlayedGametypes, getMapInfo } from "../../maps.mjs";
import { getCategorySettings, getSiteWideTimeZone } from "../../siteSettings.mjs";
import { getPageLayout } from "../../pageLayout.mjs";
import { getMapWeaponStats } from "../../weapons.mjs";
import { getLeagueCategorySettings } from "../../ctfLeague.mjs";
import { VALID_PLAYER_LIFETIME_TYPES, VALID_PLAYER_MATCH_AVG_TYPES, VALID_PLAYER_EPM_TYPES, VALID_PLAYER_MATCH_TYPES } from "../../validRecordTypes.mjs";

export async function renderSeasonMapPage(req, res){

    try{

        const seasonId = res.locals.season;
        
        const seasonInfo = res.locals.seasonInfo;

        if(req.params.id === undefined) throw new Error(`No map id found`);

        const [timeZone, basic, pageSettings, pageOrder, brandingSettings] = await Promise.all([
            getSiteWideTimeZone(),
            getMapInfo(req.params.id, seasonId),
            getCategorySettings("map"),
            getPageLayout("map"),
            getCategorySettings("Branding")
        ]);

        if(basic === null) throw new Error(`Map does not exist`);

        let title = basic.name;
        let description = `View ${seasonInfo.name} season stats for the map ${basic.name}.`;


        let ctfLeagueSettings = {};

        if(pageSettings["Display CTF League"] === 1){
            ctfLeagueSettings = await getLeagueCategorySettings("maps");
        }

        let weaponStats = null;

        if(pageSettings["Display Weapon Statistics"] === 1){
            weaponStats = await getMapWeaponStats(seasonId, basic.id);
        }

        title = `${title} - ${seasonInfo.name} - ${brandingSettings?.["Site Name"] ?? "Node UTStats Lite"}`;


        const uniqueGametypes = await getAllUniquePlayedGametypes(basic.id, true, seasonId);
        
        res.render("map.ejs",{
            "host": req.headers.host,
            timeZone,
            "userSession": req.userSession,
            title,
            basic,
            pageSettings,
            pageOrder,
            weaponStats,
            ctfLeagueSettings,
            uniqueGametypes,
            seasonId,
            seasonInfo,
            "bSeasonPage": true,
            "validTypes": {
                "player-match": VALID_PLAYER_MATCH_TYPES, 
                "player-epm": VALID_PLAYER_EPM_TYPES,
                "player-lifetime": VALID_PLAYER_LIFETIME_TYPES,
                "player-avg": VALID_PLAYER_MATCH_AVG_TYPES,
            },
            
            "meta": {"description": description, "image": `images/maps/${basic.image.fullSize}`},
        });

    }catch(err){
        res.send(err.toString());
    }
   
}