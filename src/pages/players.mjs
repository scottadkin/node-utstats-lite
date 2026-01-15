import { PER_PAGE_OPTIONS } from "../generic.mjs";
import { searchPlayers } from "../players.mjs";
import { getCategorySettings } from "../siteSettings.mjs";

export async function renderPlayersPage(req, res, userSession){

    try{

        const sortByOptions =  [
            {"value": "name", "display": "Name"}, 
            {"value": "last_active", "display": "Last Active"}, 
            {"value": "score", "display": "Score"}, 
            {"value": "frags", "display": "Frags"}, 
            {"value": "kills", "display": "Kills"}, 
            {"value": "deaths", "display": "Deaths"}, 
            {"value": "suicides", "display": "Suicides"}, 
            {"value": "eff", "display": "Efficiency"}, 
            {"value": "matches", "display": "Matches"}, 
            {"value": "playtime", "display": "Playtime"}
        ];

        const orderOptions = [
            {"value": "ASC", "display": "Ascending"}, 
            {"value": "DESC", "display": "Descending"}, 
        ];

        const DEFAULT_PER_PAGE = 25;


        const pageSettings = await getCategorySettings("Players");

        let searchName = req?.query?.name ?? "";
        let sortBy = req?.query?.sortBy ?? pageSettings["Default Sort By"] ?? "name";
        let order = req?.query?.order  ?? pageSettings["Default Order"] ?? "ASC";
        let perPage = req?.query?.perPage ?? pageSettings["Results Per Page"] ?? DEFAULT_PER_PAGE;
        if(perPage != perPage) perPage = DEFAULT_PER_PAGE;
        if(perPage < 5 || perPage > 100) perPage = DEFAULT_PER_PAGE;

        let page = req?.query?.page ?? 1;
        page = parseInt(page);
        if(page !== page) page = 1;


        let description = "Search for a player that has been active on one of our servers";
        let title = "Player Search";

        if(searchName !== ""){
            title =  `${searchName} - Player Search `;
            description = `Search result for player's named "${searchName}"`;
        }

        description += `, sorted by ${sortBy} in ${order} order`;

        const players = await searchPlayers(searchName, sortBy, order, page, perPage);

        
        const brandingSettings = await getCategorySettings("Branding");
        title = `${title} - ${brandingSettings?.["Site Name"] ?? "Node UTStats Lite"}`;

        res.render("players.ejs", {
            "host": req.headers.host,
            "title": title,
            "meta": {"description": description, "image": "images/maps/default.jpg"},
            sortByOptions,
            orderOptions,
            searchName,
            sortBy,
            order,
            perPage,
            page,
            "perPageOptions": PER_PAGE_OPTIONS,
            players,
            userSession
        });
        
    }catch(err){
        res.send(err.toString());
    }
}