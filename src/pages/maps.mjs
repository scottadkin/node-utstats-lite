import { search } from "../maps.mjs";
import { getCategorySettings } from "../siteSettings.mjs";

export async function renderMapsPage(req, res, userSession){

    try{
        let title = "Maps";
        let description = "View all the maps played on our servers.";

        let displayMode = req?.query?.display ?? "default";
        displayMode = displayMode.toLowerCase();

        let nameSearch = req?.query?.name ?? "";


        if(nameSearch !== ""){
            title = `${nameSearch} - Map Search`;
            description = `Map search for names containing: ${nameSearch}`;
        }
        
        const brandingSettings = await getCategorySettings("Branding");
        title = `${title} - ${brandingSettings?.["Site Name"] ?? "Node UTStats Lite"}`;

        const data = await search(nameSearch);

        res.render("maps.ejs",{
            "host": req.headers.host,
            title,
            "meta": {"description": description, "image": "images/maps/default.jpg"},
            displayMode,
            nameSearch,
            data,
            userSession
        });
    }catch(err){
        console.trace(err);
    }
}