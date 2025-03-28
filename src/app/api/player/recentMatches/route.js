import { getPlayerRecentMatches } from "@/app/lib/players.mjs";
import { getMatchesResultByIds } from "@/app/lib/matches.mjs";
import { getServerNames } from "@/app/lib/servers.mjs";
import { getGametypeNames } from "@/app/lib/gametypes.mjs";
import { getMapNames } from "@/app/lib/maps.mjs";

export const dynamic = "force-dynamic";

export async function GET(req){

    try{
        
        const DEFAULT_PER_PAGE = 50;

        const { searchParams } = new URL(req.url);

        const id = searchParams.get("id");
        let perPage = searchParams.get("perPage");
        let page = searchParams.get("page");

        if(perPage === null) perPage = DEFAULT_PER_PAGE;
        if(page === null) page = 1;

        perPage = parseInt(perPage);
        page = parseInt(page);

        if(perPage !== perPage) perPage = DEFAULT_PER_PAGE;
        if(page !== page) page = 1;
  
        if(id === null){
            throw new Error(`PlayerId is undefined`);
        }

        let gametype = searchParams.get("g") ?? 0;
        gametype = parseInt(gametype);
        if(gametype !== gametype) gametype = 0;

        let map = searchParams.get("m") ?? 0;
        map = parseInt(map);
        if(map !== map) map = 0;



        const basicInfo = await getPlayerRecentMatches(id, gametype, map, page, perPage);

        const matchIds = [... new Set(basicInfo.matches.map((b) =>{
            return b.match_id;
        }))];



        const matchResults = await getMatchesResultByIds(matchIds);
        const serverIds = new Set();
        const gametypeIds = new Set();
        const mapIds = new Set();

        for(const m of Object.values(matchResults)){

            serverIds.add(m.server_id);
            gametypeIds.add(m.gametype_id);
            mapIds.add(m.map_id);

        }

        const serverNames = await getServerNames([...serverIds]);
        const gametypeNames = await getGametypeNames([...gametypeIds]);
        const mapNames = await getMapNames([...mapIds]);

        const matches = [];

        for(let i = 0; i < basicInfo.matches.length; i++){

            const b = basicInfo.matches[i];

            const result = matchResults[b.match_id];

            matches.push({
                "date": b.match_date,
                "team": b.team,
                "playtime": b.time_on_server,
                "spectator": b.spectator,
                ...result
            });
        }

        return Response.json({
            "matches": matches, 
            "serverNames": serverNames, 
            "gametypeNames": gametypeNames, 
            "mapNames": mapNames,
            "totalMatches": basicInfo.totalMatches
        });

    }catch(err){
        console.trace(err);

        return Response.json({"error": err.toString()});
    }
}