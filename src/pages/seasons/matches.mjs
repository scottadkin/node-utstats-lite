
import { getSeasonById, getSeasonUniqueMatchCombinations, searchSeasonMatches } from "../../seasons.mjs";
import { getCategorySettings, getSiteWideTimeZone } from "../../siteSettings.mjs";

const DEFAULT_PER_PAGE = 25;

export async function renderSeasonMatchesPage(req, res){

    const brandingSettings = await getCategorySettings("Branding");
    const title = `Season - ${brandingSettings?.["Site Name"] ?? "Node UTStats Lite"}`;
    const timeZone = await getSiteWideTimeZone();


    const seasonId = (req.params.season !== undefined) ? parseInt(req.params.season) : null;

    if(seasonId === null) throw new Error(`Season missing`);
    if(seasonId !== seasonId) throw new Error(`Season must be a valid integer.`);
    
    const uniqueCombinations = await getSeasonUniqueMatchCombinations(seasonId);
    const basicSeasonInfo = await getSeasonById(seasonId);

    if(basicSeasonInfo === null) throw new Error(`Season doesn't exist.`);


    const selectedServer = (req.query.sid !== undefined) ? parseInt(req.query.sid) : 0;
    const selectedGametype = (req.query.gid !== undefined) ? parseInt(req.query.gid) : 0;
    const selectedMap = (req.query.mid !== undefined) ? parseInt(req.query.mid) : 0;

    if(selectedServer !== selectedServer) throw new Error(`ServerId must be a valid integer`);
    if(selectedGametype !== selectedGametype) throw new Error(`GametypeId must be a valid integer`);
    if(selectedMap !== selectedMap) throw new Error(`MapId must be a valid integer`);

    const page = (req.query.page !== undefined) ? parseInt(req.query.page) : 1;
    if(page !== page) throw new Error(`page must be a valid integer`);

    let perPage = (req.query.pp !== undefined) ? parseInt(req.query.pp): DEFAULT_PER_PAGE;

    if(perPage !== perPage) perPage = DEFAULT_PER_PAGE;

    if(perPage < 5 || perPage > 100) perPage = DEFAULT_PER_PAGE;

    const matches = await searchSeasonMatches(seasonId, selectedServer, selectedGametype, selectedMap, page, perPage);

    res.render("seasons/matches.ejs",{
        req,
            "host": req.headers.host,
            timeZone,
            title,
            "meta": {"description": "Login", "image": "images/maps/default.jpg"},
            "userSession": req.userSession,
            basicSeasonInfo,
            uniqueCombinations,
            selectedServer,
            selectedGametype,
            selectedMap,
            seasonId,
            matches,
            page,
            perPage
        });
}