import { getMatchJSON } from "@/app/lib/matches.mjs";


export const dynamic = "force-dynamic";


export async function GET(req){

    try{
        const { searchParams } = new URL(req.url);


        let id = searchParams.get("id");

        if(id === null) return Response.json({"error": "You must supply a match id or perma link hash."});

        const data = await getMatchJSON(id, true);

        return Response.json(data);

        return Response.json({"error": "Unknown Query"});

    }catch(err){
        console.trace(err);

        return Response.json({"error": err.toString()});
    }


}