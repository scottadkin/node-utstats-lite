import { getPlayersByHashes, getMatchesPlayedCountBetween } from "@/app/lib/players.mjs";

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

        if(mode === "get-matches-played-between"){

            const start = res.start ?? new Date(Date.now());
            const end = res.end ?? new Date(Date.now());
            const id = res.id ?? -1;

            const data = await getMatchesPlayedCountBetween(id, start, end);

            return Response.json(data);
        }

        return Response.json({"error": "Unknown Command"});

    }catch(err){
        console.trace(err);
        return Response.json({"error": err.toString()});
    }
}