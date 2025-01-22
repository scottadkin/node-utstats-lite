import { getMatchesByHashes, getMatchesPlayedCountBetween } from "@/app/lib/matches.mjs";

export async function POST(req){

    try{

        const res = await req.json();

        const mode = (res.mode !== undefined) ? res.mode.toLowerCase() : "";

        if(mode === "get-matches-by-hashes"){

            const hashes = res.hashes;

            const data = await getMatchesByHashes(hashes);

            return Response.json(data);
        }

        if(mode === "get-matches-played-between"){

            const start = res.start ?? new Date(Date.now());
            const end = res.end ?? new Date(Date.now());

            const data = await getMatchesPlayedCountBetween(start, end);

            return Response.json(data);
        }

        return Response.json({"error": "Unknown command"});

    }catch(err){
        console.trace(err);
        return Response.json({"error": err.toString()});
    }
}
