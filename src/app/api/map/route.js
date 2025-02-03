import { getRankingsWithPlayerNames } from "@/app/lib/rankings.mjs";

const DEFAULT_PER_PAGE = 25;

export async function GET(req){

    try{
        const { searchParams } = new URL(req.url);
        const mode = searchParams.get("mode") ?? "";

        if(mode === "") throw new Error("No mode specified");

        let perPage = searchParams.get("pp") ?? DEFAULT_PER_PAGE;

        perPage = parseInt(perPage);
        if(perPage !== perPage) perPage = DEFAULT_PER_PAGE;

        let page = searchParams.get("p") ?? 1;
        page = parseInt(page);
        if(page !== page) page = 1;

        if(mode === "get-rankings"){

            let id = searchParams.get("id") ?? NaN;

            id = parseInt(id);
            if(id != id) throw new Error(`map id must be a valid integer`);

            //time frame
            let tf = searchParams.get("tf") ?? 28;

            tf = parseInt(tf);
            if(tf !== tf) td = 28;

            return Response.json(await getRankingsWithPlayerNames(id, page, perPage, tf, "map"));

        }

        throw new Error("Nothing to return");

    }catch(err){

        console.trace(err);
        return Response.json({"error": err.toString()});
    }
}