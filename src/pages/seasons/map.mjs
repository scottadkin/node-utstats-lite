import { getAllUniquePlayedGametypes, getMapInfo } from "../../maps.mjs";
import { getCategorySettings, getSiteWideTimeZone } from "../../siteSettings.mjs";
import { getPageLayout } from "../../pageLayout.mjs";
import { getMapWeaponStats } from "../../weapons.mjs";
import { getLeagueCategorySettings } from "../../ctfLeague.mjs";
import { getSeasonById } from "../../seasons.mjs";
import { VALID_PLAYER_LIFETIME_TYPES, VALID_PLAYER_MATCH_AVG_TYPES, VALID_PLAYER_EPM_TYPES, VALID_PLAYER_MATCH_TYPES } from "../../validRecordTypes.mjs";

export async function renderSeasonMapPage(req, res){

    try{

        const seasonId = (req.params.season !== undefined) ? parseInt(req.params.season) : null;
    
        if(seasonId === null) throw new Error(`Season missing`);
        if(seasonId !== seasonId) throw new Error(`Season must be a valid integer.`);
        
        const basicSeasonInfo = await getSeasonById(seasonId);
    
        if(basicSeasonInfo === null) throw new Error(`Season doesn't exist.`);

        if(req.params.id === undefined) throw new Error(`No map id found`);
        const timeZone = await getSiteWideTimeZone();
        const basic = await getMapInfo(req.params.id, seasonId);


        if(basic === null) throw new Error(`Map does not exist`);

        let title = basic.name;
        let description = `View stats for the map ${basic.name}.`;

        const pageSettings = await getCategorySettings("map");
        const pageOrder = await getPageLayout("map");

        let ctfLeagueSettings = {};

        if(pageSettings["Display CTF League"] === 1){
            ctfLeagueSettings = await getLeagueCategorySettings("maps");
        }

        let weaponStats = null;

        if(pageSettings["Display Weapon Statistics"] === 1){
            weaponStats = await getMapWeaponStats(basic.id);
        }

        const brandingSettings = await getCategorySettings("Branding");
        title = `${title} - ${brandingSettings?.["Site Name"] ?? "Node UTStats Lite"}`;


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
            "seasonInfo": basicSeasonInfo,
            "bSeasonPage": true,
            "validTypes": {
                "player-match": VALID_PLAYER_MATCH_AVG_TYPES, 
                "player-epm": VALID_PLAYER_EPM_TYPES,
                "player-lifetime": VALID_PLAYER_LIFETIME_TYPES
            },
            
            "meta": {"description": description, "image": `images/maps/${basic.image.fullSize}`},
        });

    }catch(err){
        res.send(err.toString());
    }
   
}