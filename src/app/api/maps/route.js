import { getMapPlayerAverages } from "@/app/lib/maps.mjs";

export async function GET(req){

    const DEFAULT_PER_PAGE = 10;

   try{

        const { searchParams } = new URL(req.url);
        const mode = searchParams.get("mode") ?? "";
        let id = searchParams.get("id") ?? NaN;
        id = parseInt(id);
        

        let perPage = searchParams.get("pp") ?? DEFAULT_PER_PAGE;
        perPage = parseInt(perPage);
        if(perPage !== perPage) perPage = DEFAULT_PER_PAGE;

        console.log(id, mode);
        

        console.log(`id = ${id}`);

        
        
        console.log(mode);

        if(mode === "avg"){

            if(id !== id) throw new Error(`MapId must be a integer`);

            const result = await getMapPlayerAverages(id, "kills", 1, 10);

            console.table(result);
        }

        return Response.json({"error": "Unknown Command"});

   }catch(err){
        return Response.json({"error": err.toString()});
   }
}