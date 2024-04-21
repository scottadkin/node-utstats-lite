import { getSessionInfo } from "@/app/lib/authentication";
import { getAllFTPSettings } from "@/app/lib/ftp";
import { cookies } from "next/headers";

export async function POST(req){

    try{

        const cookieStore = cookies();

        const userId = cookieStore.get("nstats_userid")?.value ?? null;
        const sessionId = cookieStore.get("nstats_sid")?.value ?? null;

        const sessionInfo = await getSessionInfo(userId, sessionId);

        if(sessionInfo === null) throw new Error(`You are not logged in`);

        console.log(sessionInfo);

        return Response.json({"message": "hi"});

    }catch(err){

        return Response.json({"error": err.toString()});
    }
}


export async function GET(req){


    
    try{

        const cookieStore = cookies();

        const userId = cookieStore.get("nstats_userid")?.value ?? null;
        const sessionId = cookieStore.get("nstats_sid")?.value ?? null;

        const sessionInfo = await getSessionInfo(userId, sessionId);

        if(sessionInfo === null) throw new Error(`You are not logged in`);

        console.log(sessionInfo);

        return Response.json({"message": "hi"});

    }catch(err){

        return Response.json({"error": err.toString()});
    }

    /*try{
        const {bAdmin, error} = await bSessionAdminUser();

        const { searchParams } = new URL(req.url);

        const mode = searchParams.get("mode");

        if(mode === undefined){
            throw new Error("Mode is undefined");
        }

        console.log(mode);

        if(mode === "load-ftp"){

            const data = await getAllFTPSettings();

            return Response.json(data);
        }

        if(!bAdmin){
            throw new Error(error);
        }*/

        //return Response.json({"message": "hi"});
        /*
    }catch(err){
        return Response.json({"error": err.toString()});
    }*/
}