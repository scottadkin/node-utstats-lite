import { getMapTable } from "@/app/lib/ctfLeague.mjs";

export async function GET(req){

    const { searchParams } = new URL(req.url);

    const mode = searchParams.get("mode") ?? "";

    try{

        if(mode === "") throw new Error("No mode specified");


        if(mode === "map"){

            console.log(`target map}`);

            const data = await getMapTable(1,1);

            return Response.json(data);
        }

    }catch(err){
        return Response.json({"error": err});
    }
}