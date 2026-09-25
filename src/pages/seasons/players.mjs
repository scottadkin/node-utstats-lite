
import { sanitizePlayersPageParams, setPlayersPageMetaData } from "../../players.mjs";
import { getSeasonById } from "../../seasons.mjs";
import { getCategorySettings, getSiteWideTimeZone } from "../../siteSettings.mjs";

const DEFAULT_PER_PAGE = 25;

export async function renderSeasonPlayersPage(req, res){

    const brandingSettings = await getCategorySettings("Branding");
    const pageSettings = await getCategorySettings("Players");
    const timeZone = await getSiteWideTimeZone();

    const seasonId = parseInt(req.params.season);

    if(seasonId !== seasonId) throw new Error(`SeasonId must be a valid integer`);

    const basicSeasonInfo = await getSeasonById(seasonId);

    if(basicSeasonInfo === null) throw new Error(`Season doesn't exist.`);

    const {searchName, sortBy, order, perPage, page} = sanitizePlayersPageParams(req, pageSettings, DEFAULT_PER_PAGE);
    const {title, description, siteName} = setPlayersPageMetaData(brandingSettings, searchName, sortBy, order);


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