import { getMapTable, getLeagueSiteSettings, updateSettings, getMapPlayedValidGametypes, getSingleTopX } from "@/app/lib/ctfLeague.mjs";
import { setInt } from "@/app/lib/generic.mjs";

export async function GET(req){

    const { searchParams } = new URL(req.url);

    const mode = searchParams.get("mode") ?? "";
    const mapId = setInt(searchParams.get("mId"), -1);
    const gametypeId = setInt(searchParams.get("gId"), -1);
    let page = setInt(searchParams.get("page"), 1);
    let perPage = setInt(searchParams.get("perPage"), 25);

    page--;
    if(page < 0) page = 0;
    if(perPage < 1 || perPage > 100) perPage = 25;

    try{

        

        if(mode === "") throw new Error("No mode specified");


        if(mode === "map"){

            const data = await getMapTable(mapId, gametypeId, page, perPage);
            return Response.json(data);
        }

        if(mode === "gametype"){

            const data = await getMapTable(0, gametypeId, page, perPage);
            return Response.json(data);
        }

        if(mode === "get-settings"){

            const settings = await getLeagueSiteSettings();

            return Response.json(settings);
        }

        if(mode === "get-map-valid-gametypes"){

            const data = await getSingleTopX(gametypeId, mapId, page, perPage);

            const validOptions = await getMapPlayedValidGametypes(mapId);

            return Response.json({data, validOptions});
        }

    }catch(err){
        return Response.json({"error": err});
    }
}


export async function POST(req){

    try{


        const res = await req.json();


        const mode = res?.mode ?? null;
   
        if(mode === null) throw new Error("Unknown Command");


        if(mode === "save-settings"){

            if(res.changes === undefined) throw new Error("Object must have key called changes!");

            await updateSettings(res.changes);

            return Response.json({"message": "passed"});
        }

        throw new Error("test");

    }catch(err){
        return Response.json({"error": err.toString()});
    }
}