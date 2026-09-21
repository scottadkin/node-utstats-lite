import { attachDatabase, simpleQuery } from "../database.mjs";
import { getSeasonByFileName } from "../seasons.mjs";
import { getCategorySettings, getSiteWideTimeZone } from "../siteSettings.mjs";

export async function renderSeasonPage(req, res, userSession){

    const brandingSettings = await getCategorySettings("Branding");
    const title = `Season - ${brandingSettings?.["Site Name"] ?? "Node UTStats Lite"}`;
    const timeZone = await getSiteWideTimeZone();

    const seasonInfo = await getSeasonByFileName(req.params.season);
 
    if(seasonInfo === null){
        throw new Error(`Season doesn't exist`);
    }

    console.log(seasonInfo);

    await attachDatabase(seasonInfo.file_name);

    const query = `SELECT * FROM nstats_matches ORDER BY id DESC`;

    const result = await simpleQuery(query);

    console.log(result);

    

    res.render("season.ejs",{
        req,
            "host": req.headers.host,
            timeZone,
            title,
            "meta": {"description": "Login", "image": "images/maps/default.jpg"},
            userSession
        });
    //res.json({"test": "test"});
}