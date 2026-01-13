import { getCategorySettings } from "../siteSettings.mjs";

export async function renderRegisterPage(req, res, userSession){

    try{

        const brandingSettings = await getCategorySettings("Branding");
        const title = `Register - ${brandingSettings?.["Site Name"] ?? "Node UTStats Lite"}`;

        res.render("register.ejs",{
            "host": req.headers.host,
            title,
            "meta": {"description": "Login", "image": "images/maps/default.jpg"},
            userSession
        });

    }catch(err){
        res.send(`Error: ${err.toString()}`);
    }
    
}