import { getMapInfo } from "../maps.mjs";
import { getCategorySettings } from "../siteSettings.mjs";
import { getPageLayout } from "../pageLayout.mjs";
import { getMapWeaponStats } from "../weapons.mjs";
import { VALID_PLAYER_MAP_MINUTE_AVERAGES } from "../maps.mjs";
import { getLeagueCategorySettings } from "../ctfLeague.mjs";

export async function renderMapPage(req, res, userSession){

    try{

        if(req.params.id === undefined) throw new Error(`No map id found`);

        const basic = await getMapInfo(req.params.id);

        if(basic === null) throw new Error(`Map does not exist`);

        let title = basic.name;
        let description = `View stats for the map ${basic.name}.`;

        const pageSettings = await getCategorySettings("map");
        const pageOrder = await getPageLayout("map");

        let ctfLeagueSettings = {};

        if(pageSettings["Display CTF League"] === "1"){
            ctfLeagueSettings = await getLeagueCategorySettings("maps");
        }

        let weaponStats = null;

        if(pageSettings["Display Weapon Statistics"] === "1"){
            weaponStats = await getMapWeaponStats(basic.id);
        }

        const brandingSettings = await getCategorySettings("Branding");
        title = `${title} - ${brandingSettings?.["Site Name"] ?? "Node UTStats Lite"}`;
    
        res.render("map.ejs",{
            "host": req.headers.host,
            userSession,
            title,
            basic,
            pageSettings,
            pageOrder,
            weaponStats,
            ctfLeagueSettings,
            "validTypes": VALID_PLAYER_MAP_MINUTE_AVERAGES,
            "meta": {"description": description, "image": `images/maps/${basic.image}`},
        });

    }catch(err){
        res.send(err.toString());
    }
   
}