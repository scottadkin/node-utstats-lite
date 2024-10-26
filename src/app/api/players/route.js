import { getPlayersByHashes } from "@/app/lib/players.mjs";

export async function POST(req){

    try{

        const res = await req.json();
        const mode = (res.mode !== undefined) ? res.mode.toLowerCase() : "";


        console.log(mode);

        if(mode === "get-players-by-hashes"){

            const hashes = res.hashes ?? [];

            const players = await getPlayersByHashes(hashes);

            return Response.json({"players": players});
        }

        return Response.json({"error": "Unknown Command"});

    }catch(err){
        console.trace(err);
        return Response.json({"error": err.toString()});
    }
}