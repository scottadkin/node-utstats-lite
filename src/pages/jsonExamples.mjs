
import { getCategorySettings } from "../siteSettings.mjs";

export async function renderJSONExamples(req, res, userSession){


    try{

        let mode = req.query?.mode?.toLowerCase() ?? "match";

        const brandingSettings = await getCategorySettings("Branding");

        const description = brandingSettings?.["Description"] ?? "JSON examples";
        let title = brandingSettings?.["Site Name"] ?? "Node UTStats Lite";

        return res.render("jsonExamples.ejs", {
            "title": `JSON Examples - ${title}`,
            "meta": {
                "description": description,
                "image": "images/maps/default.jpg"
            },
            "host": req.headers.host,
            mode,
            userSession
        });
    }catch(err){
        console.trace(err);

        res.send(err.toString());
    }


}