import { getBasicMatchJSON, getMatchJSON, getMatchIdFromHash, 
    getMatchKillsBasicJSON, getMatchKillsDetailedJSON, getPlayerStatsJSON, getPlayersWeaponStatsJSON } from "@/app/lib/matches.mjs";


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

        mode = mode.toLowerCase();

        if(id.length !== 32){

            id = parseInt(id);
            if(id !== id) throw new Error(`MatchId must be a valid integer`);

        }else{

            id = await getMatchIdFromHash(id);
            if(id === null) throw new Error(`No match with that hash exists`);

        }

        console.log(mode);

        if(mode === "basic"){
            return Response.json(await getBasicMatchJSON(id));
        }

        if(mode === "kills-basic"){
  
            return Response.json(await getMatchKillsBasicJSON(id));
        }

        if(mode === "kills-detailed"){

            return Response.json(await getMatchKillsDetailedJSON(id));
        }

        if(mode === "players"){

            return Response.json(await getPlayerStatsJSON(id));
        }

        if(mode === "weapons"){

            return Response.json(await getPlayersWeaponStatsJSON(id));
        }

        return Response.json({"message": "hi"});

        //return Response.json({"error": "Unknown Query"});

    }catch(err){
        console.trace(err);

        return Response.json({"error": err.toString()});
    }


}