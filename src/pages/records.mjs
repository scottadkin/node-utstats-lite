import { VALID_PLAYER_LIFETIME_TYPES, VALID_PLAYER_MATCH_TYPES, getTypeDisplayName } from "../validRecordTypes.mjs";
import { getAllNames } from "../gametypes.mjs";
import { getPlayersMatchRecords, getPlayersLifetimeRecords, getTotalPossibleLifetimeMatches, getTotalPossibleSingleMatchResults  } from "../records.mjs";
import { getCategorySettings } from "../siteSettings.mjs";

export async function renderRecordsPage(req, res, userSession){

    try{
        
        const pageSettings = await getCategorySettings("Records");
        const gametypeNames = await getAllNames(true);

        let mode = req.query?.mode ?? pageSettings["Default Mode"] ?? "match";
        mode = mode.toLowerCase();

        if(mode !== "match" && mode !== "lifetime") throw new Error(`Not a valid record mode`);

        let selectedGametype = req.query?.g ?? -1;

        const fallbackCat = pageSettings[`Default Record Type(${(mode === "match") ? "Matches" : "Lifetime"})`] 

        const selectedCat = req.query?.cat ?? fallbackCat ?? "kills";

        let page = req.query.page ?? 1;
        let perPage = req.query?.perPage ?? pageSettings["Results Per Page"] ?? 50;

        page = parseInt(page);
        if(page !== page) page = 1;
        perPage = parseInt(perPage);
        if(perPage !== perPage) perPage = 50;


        let currentGametypeName = "Not Found";

        for(let i = 0; i < gametypeNames.length; i++){

            if(gametypeNames[i].id == selectedGametype) currentGametypeName = gametypeNames[i].name;
            if(gametypeNames[i].id === 0) gametypeNames[i].id = -1;
        }

        const catTitle = getTypeDisplayName(mode, selectedCat);

        let data = null;
        let totalResults = 0;
        let title = "Records";
        let description = "";

        if(mode === "match"){

            data = await getPlayersMatchRecords(selectedCat, selectedGametype, page, perPage, false);
            totalResults = await getTotalPossibleSingleMatchResults(selectedGametype);
            title = `Single Match Records`;
            description = `View all the single match ${catTitle} records for players.`;


        }else if(mode === "lifetime"){
            totalResults = await getTotalPossibleLifetimeMatches(selectedGametype);
            data = await getPlayersLifetimeRecords(selectedCat, selectedGametype, page, perPage, false);
            title = `Lifetime Records`;
            description = `View all the player lifetime ${catTitle} records for players.`;
        }


        if(selectedGametype <= 0){
            description += ` All matches played are counted towards this list.`;
        }else{
            description += ` Only matches played using the ${currentGametypeName} gametype are counted towards this list.`;

            title += `(${currentGametypeName})`;
        }

        title = `${catTitle} - ${title}`;

        const brandingSettings = await getCategorySettings("Branding");
        title = `${title} - ${brandingSettings?.["Site Name"] ?? "Node UTStats Lite"}`;
        

        res.render("records.ejs",{
            "host": req.headers.host,
            title,
            "meta": {"description": description, "image": "images/maps/default.jpg"},
            "validMatchTypes": VALID_PLAYER_MATCH_TYPES,
            "validLifetimeTypes": VALID_PLAYER_LIFETIME_TYPES,
            gametypeNames,
            selectedGametype,
            selectedCat,
            mode,
            data,
            totalResults,
            catTitle,
            page,
            perPage,
            userSession
        });
        
    }catch(err){
        console.trace(err);
        res.send(err.toString());
    }
}