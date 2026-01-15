import { convertTimestamp, toPlaytime } from "../generic.mjs";
import { 
    getPlayerByAuto,  
    getUniquePlayedGametypes, 
    getUniquePlayedMaps,
    getPlayerGametypeTotals
 } from "../players.mjs";
import { getNamesByIds as getMapNamesByIds } from "../maps.mjs";
import { getGametypeNames } from "../gametypes.mjs";
import { getPlayerCTFTotals } from "../ctf.mjs";
import { getPlayerTotals as getPlayerWeaponTotals } from "../weapons.mjs";
import { getPlayerRankings } from "../rankings.mjs";
import { getPlayerMapsLeagueData } from "../ctfLeague.mjs";
import { getCategorySettings } from "../siteSettings.mjs";
import { getPageLayout } from "../pageLayout.mjs";


function setTypeName(type, data, names){

    let targetKey = "gametype_id";
    let nameKey = "gametype_name";

    if(type === "maps"){
        targetKey = "map_id";
        nameKey = "map_name";
    }

    for(let i = 0; i < data.length; i++){

        const d = data[i];

        if(d[targetKey] === 0){
         
            d[nameKey] = "All";       
            continue;
        }
        d[nameKey] = names?.[d[targetKey]] ?? "Not Found";
    }
}


export async function renderPlayerPage(req, res, userSession){

    try{
        //getPlayerRecentMatches(playerId, gametype, map, page, perPage)
        let id = req?.params?.id ?? "";

        const basicPlayerInfo = await getPlayerByAuto(id);

        if(basicPlayerInfo === null) throw new Error(`Player does not exist!`);

        let title = `${basicPlayerInfo.name} - Player Profile`;
        let description = `View the player profile of ${basicPlayerInfo.name}, they were last seen ${convertTimestamp(basicPlayerInfo.last_active,true, false, true)}, and have played for a total of ${toPlaytime(basicPlayerInfo.playtime)}`;

        const playerId = basicPlayerInfo.id;

        if(basicPlayerInfo.country === "") basicPlayerInfo.country = "xx";

        const pageSettings = await getCategorySettings("Player");
        const pageLayout = await getPageLayout("Player");


        const uniquePlayedGametypes = await getUniquePlayedGametypes(playerId);
        const uniquePlayedMaps = await getUniquePlayedMaps(playerId);

        
        const mapNames = await getMapNamesByIds(uniquePlayedMaps);
        const gametypeNames = await getGametypeNames(uniquePlayedGametypes, true);

        let gametypeTotals = [];
        
        if(pageSettings["Display Gametype Totals"] === "1"){
            gametypeTotals = await getPlayerGametypeTotals(playerId);
        }

        let ctfTotals = [];

        if(pageSettings["Display CTF"] === "1"){
            ctfTotals = await getPlayerCTFTotals(playerId);
        }

        let weaponTotals = [];

        if(pageSettings["Display Weapons"] === "1"){
            weaponTotals = await getPlayerWeaponTotals(playerId);
        }

        const month = 60 * 60 * 24 * 28;

        const minDate = new Date(Date.now() - month * 1000);

        let rankings = null;

        if(pageSettings["Display Rankings"] === "1"){
            rankings = await getPlayerRankings(playerId, minDate);
            rankings.minDate = minDate;
        }
        
        let ctfLeagueData = [];

        if(pageSettings["Display CTF League"] === "1"){
            ctfLeagueData = await getPlayerMapsLeagueData(playerId);
        }
        
        setTypeName("gametypes", gametypeTotals, gametypeNames);
        setTypeName("gametypes", ctfTotals, gametypeNames);
        setTypeName("gametypes", weaponTotals, gametypeNames);
        setTypeName("gametypes", ctfLeagueData, gametypeNames);
        setTypeName("maps", ctfLeagueData, mapNames);
        setTypeName("maps", ctfTotals, mapNames);

        const brandingSettings = await getCategorySettings("Branding");
        title = `${title} - ${brandingSettings?.["Site Name"] ?? "Node UTStats Lite"}`;

        res.render("player.ejs", {
            "meta": {description, "image": "images/maps/default.jpg"},
            "host": req.headers.host,
            title,
            basicPlayerInfo,
            "playerId": playerId,
            gametypeNames,
            mapNames,
            gametypeTotals,
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