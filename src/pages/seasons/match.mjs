import { getMatchData } from "../../matches.mjs";
import { getMatchData as getClassicStatsData } from "../../classicWeaponStats.mjs";
import { convertTimestamp, plural, toPlaytime } from "../../generic.mjs";
import { getCategorySettings, getSiteWideTimeZone } from "../../siteSettings.mjs";
import { getPageLayout } from "../../pageLayout.mjs";
import { getSeasonById } from "../../seasons.mjs";

export async function renderSeasonMatchPage(req, res, userSession){

    try{
        
        const matchId = (req.params.id !== undefined) ? req.params.id : null;

        if(matchId === null) throw new Error(`MatchId was not supplied`);

        const timeZone = await getSiteWideTimeZone();
        let desc = `Match Doesn't Exist - Node UTStats Lite`;

        const seasonId = (req.params.season !== undefined) ? parseInt(req.params.season) : null;

        if(seasonId === null) throw new Error(`Season missing`);
        if(seasonId !== seasonId) throw new Error(`Season must be a valid integer.`);

        const basicSeasonInfo = await getSeasonById(seasonId);
        
        if(basicSeasonInfo === null) throw new Error(`Season doesn't exist.`);
        
        const data = await getMatchData(matchId);

        if(data.error !== undefined) throw new Error(data.error);
        const b = data.basic;

        let date = b.date;

        const dateString = convertTimestamp(date, true, false, true);
        
        desc = `Match report for ${b.map_name} (${b.gametype_name}), ${dateString}, ${b.players} ${plural(b.players, "player")}, match length ${toPlaytime(b.playtime)}, server ${b.server_name}.`;

        const [classicWeaponStats, brandingSettings, pageSettings, pageLayout] = await Promise.all([
            getClassicStatsData(matchId), 
            getCategorySettings("Branding"), 
            getCategorySettings("Match"), 
            getPageLayout("Match")
        ]);


        res.render('match.ejs', {
            "title": `${b.map_name} - ${dateString} Match Report - ${brandingSettings?.["Site Name"] ?? "Node UTStats Lite"}`,
            "host": req.headers.host,
            "meta": {
                "description": desc,
                "image": `matchshot/${b.id}`
            },
            userSession,
            data,	
            classicWeaponStats,
            pageSettings,
            pageLayout,
            timeZone,
            seasonId,
            "seasonInfo": basicSeasonInfo,
            "bSeasonPage": true

        });

    }catch(err){
        res.send(err.toString());
    }

}