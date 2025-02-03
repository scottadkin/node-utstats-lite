import { getRankings } from "@/app/lib/rankings.mjs";

export async function GET(req){

    try{
        const { searchParams } = new URL(req.url);
        const mode = searchParams.get("mode") ?? "";

        if(mode === "") throw new Error("No mode specified");

        if(mode === "get-rankings"){

            let id = searchParams.get("id") ?? NaN;

            id = parseInt(id);
            if(id != id) throw new Error(`map id must be a valid integer`);

            //time frame
            let tf = searchParams.get("tf") ?? 28;

            tf = parseInt(tf);
            if(tf !== tf) td = 28;

            return Response.json(await getRankings(id, 1, 25, tf, "map"));

        }

        throw new Error("Nothing to return");

    }catch(err){

        console.trace(err);
        return Response.json({"error": err.toString()});
    }
}