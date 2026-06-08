export async function renderAdminPage(req, res, userSession){

    try{

        let mode = req?.query?.mode ?? "";

        return res.render("admin.ejs", {
            "title": "Admin",
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