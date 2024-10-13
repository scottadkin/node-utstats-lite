import { getMatchJSON } from "@/app/lib/matches.mjs";


export const dynamic = "force-dynamic";


export async function GET(req){

    try{
        const { searchParams } = new URL(req.url);


        let id = searchParams.get("id");
        

        if(id === null) return Response.json({"error": "You must supply a match id or perma link hash."});


        let mode = searchParams.get("mode");


        if(mode === null){

            let ignore = searchParams.get("ignore") ?? "";
      
            ignore = ignore.split(",").map((i) => i.toLowerCase());

            const bIgnoreWeaponStats = ignore.indexOf("weapons") !== -1;
            const bIgnoreKills = ignore.indexOf("kills") !== -1;
            const bIgnorePlayers = ignore.indexOf("players") !== -1;
            const bIgnoreBasic = ignore.indexOf("basic") !== -1;
            //first blood, sprees, multis
            const bIgnoreSpecial = ignore.indexOf("special") !== -1;
            const bIgnorePickups = ignore.indexOf("pickups") !== -1;

            const data = await getMatchJSON(id, bIgnoreKills, bIgnoreWeaponStats, bIgnorePlayers, bIgnoreBasic, bIgnoreSpecial, bIgnorePickups);

            return Response.json(data);
        }


        return Response.json({"message": "hi"});

        //return Response.json({"error": "Unknown Query"});

    }catch(err){
        console.trace(err);

        return Response.json({"error": err.toString()});
    }


}