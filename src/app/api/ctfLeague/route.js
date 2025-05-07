import { getMapTable, getLeagueSiteSettings, updateSettings } from "@/app/lib/ctfLeague.mjs";

export async function GET(req){

    const { searchParams } = new URL(req.url);

    const mode = searchParams.get("mode") ?? "";

    try{

        if(mode === "") throw new Error("No mode specified");


        if(mode === "map"){


            const data = await getMapTable(18,1);

            return Response.json(data);
        }

        if(mode === "get-settings"){

            const settings = await getLeagueSiteSettings();

            return Response.json(settings);
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