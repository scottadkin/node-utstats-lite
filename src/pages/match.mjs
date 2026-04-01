import { getMatchData } from "../matches.mjs";
import { getMatchData as getClassicStatsData } from "../classicWeaponStats.mjs";
import { convertTimestamp, plural, toPlaytime } from "../generic.mjs";
import { getCategorySettings } from "../siteSettings.mjs";
import { getPageLayout } from "../pageLayout.mjs";

export async function renderMatchPage(req, res, userSession){

    try{
        
        const matchId = (req.params.id !== undefined) ? req.params.id : null;

        if(matchId === null) throw new Error(`MatchId was not supplied`);

        let desc = `Match Doesn't Exist - Node UTStats Lite`;

        const start = performance.now();
        const data = await getMatchData(matchId);
        const end = performance.now();
        console.log((end - start) * 0.001);

        if(data.error !== undefined) throw new Error(data.error);


        const b = data.basic;

        let date = b.date;

        const dateString = convertTimestamp(date, true, false, true);
        
        desc = `Match report for ${b.map_name} (${b.gametype_name}), ${dateString}, ${b.players} ${plural(b.players, "player")}, match length ${toPlaytime(b.playtime)}, server ${b.server_name}.`;

        const results = await Promise.all([
            getClassicStatsData(matchId), 
            getCategorySettings("Branding"), 
            getCategorySettings("Match"), 
            getPageLayout("Match")
        ]);

        const classicWeaponStats = results[0];
        const brandingSettings = results[1];
        const pageSettings = results[2];
        const pageLayout = results[3];


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
            pageLayout

        });

    }catch(err){
        res.send(err.toString());
    }

}