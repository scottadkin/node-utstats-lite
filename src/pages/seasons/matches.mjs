
import { getSeasonBasicObjectStats, getSeasonById } from "../../seasons.mjs";
import { getCategorySettings, getSiteWideTimeZone } from "../../siteSettings.mjs";


export async function renderSeasonMatchesPage(req, res){

    const brandingSettings = await getCategorySettings("Branding");
    const title = `Season - ${brandingSettings?.["Site Name"] ?? "Node UTStats Lite"}`;
    const timeZone = await getSiteWideTimeZone();


    const seasonId = (req.params.season !== undefined) ? parseInt(req.params.season) : null;

    if(seasonId === null) throw new Error(`Season missing`);
    if(seasonId !== seasonId) throw new Error(`Season must be a valid integer.`);
    
    const basicSeasonInfo = await getSeasonById(seasonId);

    if(basicSeasonInfo === null) throw new Error(`Season doesn't exist.`);


    res.render("seasons/matches.ejs",{
        req,
            "host": req.headers.host,
            timeZone,
            title,
            "meta": {"description": "Login", "image": "images/maps/default.jpg"},
            "userSession": req.userSession,
            basicSeasonInfo
        });
}