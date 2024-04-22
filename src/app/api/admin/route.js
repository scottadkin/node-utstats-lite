import { getSessionInfo } from "@/app/lib/authentication";
import { getAllFTPSettings, addServer, editServer, deleteServer } from "@/app/lib/ftp";
import { cookies } from "next/headers";

export async function POST(req){

    try{

        const sessionInfo = await getSessionInfo();

        if(sessionInfo === null) throw new Error(`You are not logged in`);

        console.log(sessionInfo);

        console.log("req.body");
        console.log(req.body);

        const res = await req.json();
        console.log(res);

        if(res.mode === undefined) throw new Error(`No mode specified`);

        const mode = res.mode.toLowerCase();

        if(mode === "add-server"){
            await addServer(res);
            return Response.json({"message": "passed"});
        }

        if(mode === "update-server"){
            if(res.serverId == undefined) throw new Error(`ServerId is undefined/null`);
            await editServer(res.serverId, res);
            return Response.json({"message": "passed"});
        }

        if(mode === "delete-server"){

            if(res.serverId == undefined) throw new Error(`ServerId is undefined/null`);
            await deleteServer(res.serverId);
            return Response.json({"message": "passed"});
        }

        return Response.json({"message": "hi"});

    }catch(err){

        console.trace(err);

        return Response.json({"error": err.toString()});
    }
}


export async function GET(req){


    
    try{

        const sessionInfo = await getSessionInfo();

        if(sessionInfo === null) throw new Error(`You are not logged in`);

        console.log(sessionInfo);

        const { searchParams } = new URL(req.url);

        const mode = searchParams.get("mode");

        if(mode === undefined){
            throw new Error("Mode is undefined");
        }

        console.log("mode");
        console.log(mode);

        if(mode === "load-ftp"){

            const data = await getAllFTPSettings();

            return Response.json(data);
        }

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