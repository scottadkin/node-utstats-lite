import { getLeagueSiteSettings, getUniqueGametypeLeagues, getUniqueMapLeagues, getLatestMapGametypePlayed } from "../ctfLeague.mjs";
import { convertTimestamp } from "../generic.mjs";
import { getGametypeNames } from "../gametypes.mjs";
import { getMapNames } from "../maps.mjs";
import { getSingleCTFLeague } from "../ctfLeague.mjs";
import { getCategorySettings } from "../siteSettings.mjs";

export async function renderCTFLeaguePage(req, res, userSession){

    try{
        const mode = req?.query?.mode ?? "gametypes";
        let id = req?.query?.id ?? "";
        //gid only used for maps mode as id in that case is the map id
        let gId = req?.query?.gid ?? "";

        if(id === "" && gId === ""){

            const latestIds = await getLatestMapGametypePlayed();

            if(latestIds !== null){

                if(mode === "gametypes"){
                    id = latestIds.gametype_id;
                }else{
                    gId = latestIds.gametype_id;
                    id = latestIds.map_id;
                }
            }
        }

        let page = req?.query?.page ?? 1;
        let perPage = req?.query?.perPage ?? 25;
    
        const leagueSettings = await getLeagueSiteSettings();

        let maxMatchesPerPlayer = 0;
        let maxMatchAge = 0;
        let lastLeagueRefresh = "Never";

        if(mode === "gametypes" || mode === "maps" || mode === "combined"){

            maxMatchesPerPlayer = leagueSettings[mode]["Maximum Matches Per Player"].value;
            maxMatchAge = leagueSettings[mode]["Maximum Match Age In Days"].value;
            lastLeagueRefresh = leagueSettings[mode]["Last Whole League Refresh"].value;

            lastLeagueRefresh = convertTimestamp(new Date(lastLeagueRefresh), false, false, true);
        }

        const uniqueGametypes = await getUniqueGametypeLeagues();
        const gametypeNames = await getGametypeNames(uniqueGametypes, true);

        let mapNames = {};

        if(mode === "maps"){

            const mapIds = await getUniqueMapLeagues();
            mapNames = await getMapNames(mapIds);
        }

        let data =  {"totalRows": 0, "data": []};

        if(mode === "gametypes"){
            data = await getSingleCTFLeague(id, 0, page, perPage);
        }else if(mode === "maps"){
            data = await getSingleCTFLeague(gId, id, page, perPage);
        }else if(mode === "combined"){
            data = await getSingleCTFLeague(0, 0, page, perPage);
        }

        //need to get latest played gametypeId and mapId

        let gametypeName = "Gametypes";
        let mapName = "Maps";
        let subHeader = "";

        let title = "";

        if(mode === "gametypes"){

            gametypeName = gametypeNames?.[id] ?? "Gametypes";
            title = `${gametypeName} - CTF League`;
            subHeader = gametypeName;

        }else if(mode === "maps"){
        
            mapName = mapNames?.[id] ?? "Maps";

            if(gId == 0){
                title = `${mapName} - CTF League`;
                subHeader = mapName;
            }else{
                gametypeName = gametypeNames?.[gId] ?? "Gametypes";
                title = `${mapName} (${gametypeName}) - CTF League`;
                subHeader = `${mapName} (${gametypeName})`
            }

        }else if(mode === "combined"){

            title = `Combined - CTF League`;
            subHeader = "Combined";
        }

        const brandingSettings = await getCategorySettings("Branding");
        title = `${title} - ${brandingSettings?.["Site Name"] ?? "Node UTStats Lite"}`;


        res.render("ctfLeague.ejs", {
            "host": req.headers.host,
            title,
            "meta": {"description": `View the top players for the ${title}`, "image": "images/maps/default.jpg"},
            mode,
            maxMatchesPerPlayer,
            maxMatchAge,
            lastLeagueRefresh,
            gametypeNames,
            mapNames,
            id,
            gId,
            data,
            page,
            perPage,
            subHeader,
            userSession
        });
    }catch(err){
        res.send(err.toString());
    }
}