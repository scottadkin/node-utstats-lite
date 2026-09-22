import { getAllNames as getAllServerNames } from "../servers.mjs";
import { getAllGametypesWithBGametype } from "../gametypes.mjs";
import { getAllMapNamesWithBGametype } from "../maps.mjs";
import { getAllUniqueGametypeMapCombinations, getRecentMatches } from "../matches.mjs";
import { getCategorySettings, getSiteWideTimeZone } from "../siteSettings.mjs";
import { bUseSeasons } from "../../config.mjs";
import { getAllSeasons, getSeasonMatchesData } from "../seasons.mjs";

export async function renderMatchesPage(req, res, userSession){

    try{

        const [serverNames, pageSettings, timeZone, gametypeNames, mapNames, uniqueGametypeMapCombos] = await Promise.all([
            getAllServerNames(true),
            getCategorySettings("Matches"),
            getSiteWideTimeZone(),
            getAllGametypesWithBGametype(true),
            getAllMapNamesWithBGametype(true),
            getAllUniqueGametypeMapCombinations()
        ]);



        let seasonsData = [];
        if(bUseSeasons){

            seasonsData = await getAllSeasons();
        }
  

        
        let perPage = pageSettings?.["Results Per Page"] ?? 25;
        perPage = parseInt(perPage);
        if(perPage !== perPage) perPage = 25;

        let selectedServer = (req.query.s !== undefined) ? parseInt(req.query.s) : 0;
        if(selectedServer !== selectedServer) selectedServer = 0;

        let selectedGametype = (req.query.g !== undefined) ? parseInt(req.query.g) : 0;
        if(selectedGametype !== selectedGametype) selectedGametype = 0;

        let selectedMap = (req.query.m !== undefined) ? parseInt(req.query.m) : 0;
        if(selectedMap !== selectedMap) selectedMap = 0;

        let page = (req.query.page !== undefined) ? parseInt(req.query.page) : 1;
        if(page !== page) page = 1;

        let displayMode = req?.query?.display ?? pageSettings?.["Default Display Mode"] ?? "default"; 
        displayMode = displayMode.toLowerCase();


       

        let selectedSeason = (req.query.season !== undefined) ? parseInt(req.query.season) : 0;

        if(selectedSeason !== selectedSeason) selectedSeason = 0;

        if(selectedSeason !== 0){

            const test = await getSeasonMatchesData(selectedSeason);
            console.log(test);
        }


        const matches = await getRecentMatches(page, perPage, selectedServer, selectedGametype, selectedMap);
  
        const brandingSettings = await getCategorySettings("Branding");
        const title = `Recent Matches - ${brandingSettings?.["Site Name"] ?? "Node UTStats Lite"}`;

        res.render('matches.ejs', {
            "title": title,
            "host": req.headers.host,
            "meta": {
                "description": "View recent matches played on our Unreal Tournament servers.",
                "image": "/images/maps/default.jpg"
            },
            serverNames,
            gametypeNames, 
            mapNames,
            uniqueGametypeMapCombos,
            selectedServer,
            selectedGametype,
            selectedMap,
            matches,
            page,
            pageSettings,
            displayMode,
            perPage,
            userSession,
            timeZone,
            bUseSeasons,
            seasonsData,
            selectedSeason
        });

    }catch(err){
        res.send(`Error: ${err.toString()}`);
    }
}