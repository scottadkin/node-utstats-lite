
import { sanitizePlayersPageParams, setPlayersPageMetaData } from "../../players.mjs";
import { getSeasonById } from "../../seasons.mjs";
import { getCategorySettings, getSiteWideTimeZone } from "../../siteSettings.mjs";

const DEFAULT_PER_PAGE = 25;

export async function renderSeasonPlayersPage(req, res){

    const seasonId = res.locals.season;

    const [brandingSettings, pageSettings, timeZone, basicSeasonInfo] = await Promise.all([
        getCategorySettings("Branding"),
        getCategorySettings("Players"),
        getSiteWideTimeZone(),
        getSeasonById(seasonId)
    ]);

    
    const {searchName, sortBy, order, perPage, page} = sanitizePlayersPageParams(req, pageSettings, DEFAULT_PER_PAGE);
    const {title, description, siteName} = setPlayersPageMetaData(brandingSettings, searchName, sortBy, order, basicSeasonInfo.name);


    res.render("players.ejs",{
        req,
            "host": req.headers.host,
            timeZone,
            title,
            "meta": {"description": description, "image": "images/maps/default.jpg"},
            "userSession": req.userSession,
            seasonId,
            "seasonInfo": basicSeasonInfo,
            "bSeasonPage": true,
            searchName,
            sortBy,
            order,
            perPage,
            page,
            siteName,
            seasonId
        });
}