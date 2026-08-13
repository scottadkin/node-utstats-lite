import { getSiteWideTimeZone } from "../siteSettings.mjs";

export async function renderAdminPage(req, res, userSession){

    try{

        const timeZone = await getSiteWideTimeZone();

        let mode = req?.query?.mode ?? "";

        return res.render("admin.ejs", {
            "title": "Admin",
            timeZone,
            "meta": {
                "description": "",
                "image": "images/maps/default.jpg"
            },
            "host": req.headers.host,
            userSession,
            mode
        });

    }catch(err){
        res.send(err.toString());
    }

}