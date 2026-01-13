import { clearUserCookies, bSessionExist } from "../authentication.mjs";
import { getCategorySettings } from "../siteSettings.mjs";

export async function renderLoginPage(req, res, sessionStore, userSession){

    try{

        const error = req.query.error ?? null;

        if(req.cookies.nstats_sid !== undefined){

            if(!await bSessionExist(sessionStore, req.cookies.nstats_sid)){
                clearUserCookies(res);
                res.send("Not a valid session");
                return;
            }
            res.send("You are already logged in");
            return;
        }

        const brandingSettings = await getCategorySettings("Branding");
        const title = `Login - ${brandingSettings?.["Site Name"] ?? "Node UTStats Lite"}`;

        res.render("login.ejs",{
            "host": req.headers.host,
            title,
            error,
            "userSession": userSession,
            "meta": {"description": "Login to Node UTStats Lite", "image": "images/maps/default.jpg"},
        });

    }catch(err){
        res.send(`Error: ${err.toString()}`);
    }
    
}