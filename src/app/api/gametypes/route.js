import { getAllNames } from "@/app/lib/gametypes.mjs";

export async function GET(req){

    try{

        const { searchParams } = new URL(req.url);

        const mode = searchParams.get("mode") ?? "";

        console.log(mode);

        if(mode === "get-all-names"){

            const data = await getAllNames();

            return Response.json({"data": data});
        }

        return Response.json({"error": "Unknown command"});

    }catch(err){
        return Response.json({"error": err.toString()});
    }
}