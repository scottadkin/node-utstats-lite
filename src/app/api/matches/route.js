import { getMatchesByHashes } from "@/app/lib/matches.mjs";

export async function POST(req){

    try{

        const res = await req.json();

        console.log(res);

        const mode = (res.mode !== undefined) ? res.mode.toLowerCase() : "";

        if(mode === "get-matches-by-hashes"){

            const hashes = res.hashes;

            const data = await getMatchesByHashes(hashes);

            return Response.json(data);
        }

        console.log(`mode = ${mode}`);

        return Response.json({"error": "Unknown command"});

    }catch(err){
        console.trace(err);
        return Response.json({"error": err.toString()});
    }
}