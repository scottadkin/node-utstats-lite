import { search } from "../maps.mjs";
import { getCategorySettings } from "../siteSettings.mjs";

export async function renderMapsPage(req, res, userSession){

    try{

        const pageSettings = await getCategorySettings("Maps");

        let title = "Maps";
        let description = "View all the maps played on our servers.";

        let displayMode = req.query.display ?? pageSettings["Default Display Mode"] ?? "default";
        displayMode = displayMode.toLowerCase();

        if(displayMode !== "table" && displayMode !== "default") displayMode = "default";

        let nameSearch = req.query?.name ?? "";

        const DEFAULT_PER_PAGE = 25;

        let perPage = req.query.perPage ?? pageSettings["Results Per Page"] ?? DEFAULT_PER_PAGE;
        perPage = parseInt(perPage);

        let page = req.query.page ?? 1;
        page = parseInt(page);
        if(page !== page) page = 1;

        if(perPage !== perPage || perPage < 5 || perPage > 100) perPage = DEFAULT_PER_PAGE;


        if(nameSearch !== ""){
            title = `${nameSearch} - Map Search`;
            description = `Map search for names containing: ${nameSearch}`;
        }
        
        const brandingSettings = await getCategorySettings("Branding");
        title = `${title} - ${brandingSettings?.["Site Name"] ?? "Node UTStats Lite"}`;

        const {totalMatches, maps} = await search(nameSearch, page, perPage);

        res.render("maps.ejs",{
            "host": req.headers.host,
            title,
            "meta": {"description": description, "image": "images/maps/default.jpg"},
            displayMode,
            nameSearch,
            totalMatches,
            maps,
            userSession,
            perPage,
            page
        });
    }catch(err){
        console.trace(err);
    }
}