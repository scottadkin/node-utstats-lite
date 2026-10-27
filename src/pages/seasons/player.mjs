
import { sanitizePlayerPageReq} from "../../players.mjs";
import { getSiteWideTimeZone } from "../../siteSettings.mjs";
import { getPlayerActiveSeasons } from "../../seasons.mjs";
import { escapeHTML } from "../../generic.mjs";


function getSeasonName(seasonList, targetId){

    for(let i = 0; i < seasonList.length; i++){

        if(seasonList[i].id === targetId) return seasonList[i].name;
    }

    return "Not Found";
}

export async function renderSeasonPlayerPage(req, res){

    const timeZone = await getSiteWideTimeZone();

    try{

        let id = req?.params?.id ?? "";


        const seasonId = res.locals.season;
        const seasonInfo = res.locals.seasonInfo;
        const bSkipSeasonLinks = res.locals.bSkipSeasonLinks;

        try{

            const {title, description,
                pageSettings, pageLayout, brandingSettings, playerId, basicPlayerInfo, weaponDamage,
                generalTotals, ctfTotals, weaponTotals, rankings, 
                ctfLeagueData, ctfLeagueSettings, activeSeasons
            } = await sanitizePlayerPageReq(id, seasonId, seasonInfo);

            res.render("player.ejs", {
                "meta": {description, "image": "images/maps/default.jpg"},
                "host": req.headers.host,
                title,
                basicPlayerInfo,
                "playerId": playerId,
                generalTotals,
                ctfTotals,
                weaponTotals,
                rankings,
                ctfLeagueData,
                "userSession": req.userSession,
                pageSettings,
                pageLayout,
                timeZone,
                weaponDamage,
                ctfLeagueSettings,
                activeSeasons,
                "bSeasonPage": true,
                seasonInfo,
                seasonId
            });

        }catch(err){

            console.trace(err);

            if(err.message === "Player does not exist!"){

                const activeSeasons = await getPlayerActiveSeasons(id);

                let errorMessage = `Player doesn't have a profile for this season.`;

                if(activeSeasons.length > 0){

                    errorMessage += `<br><br>They do have the following profiles:`;

                    errorMessage += `<br>- <a class="underline" href="/season/0/player/${id}">All Time profile</a>`;

                    for(let i = 0; i < activeSeasons.length; i++){

                        const sId = activeSeasons[i];
                        const seasonName = escapeHTML(getSeasonName(res.locals.seasonList, sId));
                        errorMessage += `<br>- <a class="underline" href="/season/${sId}/player/${id}">${seasonName}</a>`;
                    }
                }

                return res.render("error.ejs", {
                    "host": req.headers.host, 
                    "userSession": req.userSession, 
                    timeZone,
                    errorMessage
                });

            }else{
                throw err;
            }
        }
       

        

    }catch(err){

        return res.render("error.ejs", {
            "host": req.headers.host, 
            "userSession": req.userSession, 
            timeZone,
            "errorMessage": err.toString()
        });
    }
}