import { getMapPlayerAverages } from "@/app/lib/maps.mjs";

export async function GET(req){

    const DEFAULT_PER_PAGE = 10;
    const MAX_PER_PAGE = 100;


     try{

          const { searchParams } = new URL(req.url);
          const mode = searchParams.get("mode") ?? "";
          let id = searchParams.get("id") ?? NaN;
          id = parseInt(id);
          
          let page = searchParams.get("page") ?? 1;
          page = parseInt(page);
          if(page !== page) page = 1;
          if(page < 1) page = 1;

          let perPage = searchParams.get("pp") ?? DEFAULT_PER_PAGE;
          perPage = parseInt(perPage);
          if(perPage !== perPage) perPage = DEFAULT_PER_PAGE;

          if(perPage > MAX_PER_PAGE) perPage = MAX_PER_PAGE;
          if(perPage <= 0) perPage = DEFAULT_PER_PAGE;

          console.log(id, mode);
          

          console.log(`id = ${id}`);

          
          
          console.log(mode);

          if(mode === "avg"){

               if(id !== id) throw new Error(`MapId must be a integer`);

               const result = await getMapPlayerAverages(id, "kills", page, perPage);

               return Response.json(result);
               //console.table(result);
          }

          return Response.json({"error": "Unknown Command"});

     }catch(err){
          return Response.json({"error": err.toString()});
     }
}