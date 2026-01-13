import { getAllNames as getAllServerNames } from "../servers.mjs";
import { getAllNames as getAllGametypeNames } from "../gametypes.mjs";
import { getAllNames as getAllMapNames } from "../maps.mjs";
import { getRecentMatches } from "../matches.mjs";
import { getCategorySettings } from "../siteSettings.mjs";

export async function renderMatchesPage(req, res, userSession){

    try{

        const perPage = 25;

        const serverNames = await getAllServerNames(true);
        const gametypeNames = await getAllGametypeNames(true);
        const mapNames = await getAllMapNames(true);
        const pageSettings = await getCategorySettings("Matches");
        

        let selectedServer = (req.query.s !== undefined) ? parseInt(req.query.s) : 0;
        if(selectedServer !== selectedServer) selectedServer = 0;

        let selectedGametype = (req.query.g !== undefined) ? parseInt(req.query.g) : 0;
        if(selectedGametype !== selectedGametype) selectedGametype = 0;

        let selectedMap = (req.query.m !== undefined) ? parseInt(req.query.m) : 0;
        if(selectedMap !== selectedMap) selectedMap = 0;

        let page = (req.query.page !== undefined) ? parseInt(req.query.page) : 1;
        if(page !== page) page = 1;

        let displayMode = req?.query?.display ?? "default"; 
        displayMode = displayMode.toLowerCase();
 
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
            selectedServer,
            selectedGametype,
            selectedMap,
            matches,
            page,
            pageSettings,
            displayMode,
            perPage,
            userSession
        });

    }catch(err){
        res.send(`Error: ${err.toString()}`);
    }
}