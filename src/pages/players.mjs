import { DEFAULT_ORDER_OPTIONS, PER_PAGE_OPTIONS } from "../generic.mjs";
import { sanitizePlayersPageParams, searchPlayers, setPlayersPageMetaData } from "../players.mjs";
import { getCategorySettings, getSiteWideTimeZone } from "../siteSettings.mjs";
const DEFAULT_PER_PAGE = 25;

export async function renderPlayersPage(req, res, userSession){

    try{

        const brandingSettings = await getCategorySettings("Branding");
        const pageSettings = await getCategorySettings("Players");
        const timeZone = await getSiteWideTimeZone();

        const {searchName, sortBy, order, perPage, page} = sanitizePlayersPageParams(req, pageSettings, DEFAULT_PER_PAGE);

    
        const players = await searchPlayers(searchName, sortBy, order, page, perPage, 0);

        const {title, description, siteName} = setPlayersPageMetaData(brandingSettings, searchName, sortBy, order);

        res.render("players.ejs", {
            "host": req.headers.host,
            "title": title,
            "meta": {"description": description, "image": "images/maps/default.jpg"},
            "orderOptions": DEFAULT_ORDER_OPTIONS,
            searchName,
            sortBy,
            order,
            perPage,
            page,
            "perPageOptions": PER_PAGE_OPTIONS,
            players,
            userSession,
            siteName,
            timeZone,
            "bSeasonPage": false,
            "seasonInfo": null,
            "seasonId": 0
        });
        
    }catch(err){
        res.send(err.toString());
    }
}