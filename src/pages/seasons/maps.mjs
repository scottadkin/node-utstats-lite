
import { searchMaps } from "../../maps.mjs";
import { getSeasonById } from "../../seasons.mjs";
import { getCategorySettings, getSiteWideTimeZone } from "../../siteSettings.mjs";

export async function renderSeasonMapsPage(req, res){

    const brandingSettings = await getCategorySettings("Branding");
    const pageSettings = await getCategorySettings("Maps");
    const title = `Season - ${brandingSettings?.["Site Name"] ?? "Node UTStats Lite"}`;
    const timeZone = await getSiteWideTimeZone();

    const seasonId = (req.params.season !== undefined) ? parseInt(req.params.season) : null;

    if(seasonId === null) throw new Error(`Season missing`);
    if(seasonId !== seasonId) throw new Error(`Season must be a valid integer.`);
    
    const basicSeasonInfo = await getSeasonById(seasonId);

    if(basicSeasonInfo === null) throw new Error(`Season doesn't exist.`);

    let nameSearch = "";
    let sortBy = "name";
    let order = "ASC";
    let displayMode = "default";
    let page = 1;
    let perPage = 5;


    const {totalMatches, maps} = await searchMaps(nameSearch, page, perPage, sortBy, order, seasonId);


    res.render("maps.ejs",{
        req,
            "host": req.headers.host,
            timeZone,
            title,
            "meta": {"description": "Season Maps", "image": "images/maps/default.jpg"},
            "userSession": req.userSession,
            seasonId,
            "seasonInfo": basicSeasonInfo,
            "bSeasonPage": true,
            nameSearch,
            sortBy,
            order,
            displayMode,
            page, perPage, maps, totalMatches
        });
}