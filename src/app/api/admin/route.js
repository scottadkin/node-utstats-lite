import { getSessionInfo } from "@/app/lib/authentication";
import { getAllFTPSettings, addServer, editServer, deleteServer } from "@/app/lib/ftp";
import { updateSettings as updateLogsFolderSettings, getSettings as getLogsFolderSettings} from "@/app/lib/logsfoldersettings.mjs";
import { getHistory as getImporterHistory, getImporterNames, getRejectedHistory, getLogImportHistory } from "@/app/lib/importer.mjs";
import { getAllUsers, adminUpdateUser } from "@/app/lib/users.mjs";
import { getAllSettings as getAllSiteSettings, updateSettings as updateSiteSettings } from "@/app/lib/siteSettings.mjs";

export async function POST(req){

    try{

        const sessionInfo = await getSessionInfo();

        if(sessionInfo === null) throw new Error(`You are not logged in`);

        console.log(sessionInfo);

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

        if(mode === "update-importer-settings"){

            const ignoreBots = (res.ignoreBots !== undefined) ? res.ignoreBots : 0;
            const ignoreDuplicates = (res.ignoreDuplicates !== undefined) ? res.ignoreDuplicates : 0;
            const minPlayers = (res.minPlayers !== undefined) ? res.minPlayers : 0;
            const minPlaytime = (res.minPlaytime !== undefined) ? res.minPlaytime : 0;

            await updateLogsFolderSettings(ignoreBots, ignoreDuplicates, minPlayers, minPlaytime);

            return Response.json({"message": "passed"});
        }

        if(mode === "get-users"){

            const data = await getAllUsers();

            return Response.json({"data": data});

        }

        if(mode === "save-user-changes"){

            const userId = res.userId;
            const bEnabled = res.bEnabled;
            
            if(userId === undefined || bEnabled === undefined) throw new Error(`userId and bEnabled must be set if you want to update a user account`);

            await adminUpdateUser(userId, bEnabled);
            return Response.json({"message": "passed"});

        }

        if(mode === "save-site-settings"){

            const messages = await updateSiteSettings(res.settings);

            return Response.json({"messages": messages});
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

        let page = searchParams.get("page");
        let perPage = searchParams.get("perPage");

        
        if(page === null) page = 1;
        if(perPage === null) perPage = 25;

        page = parseInt(page);
        if(page !== page) throw new Error(`Page must be a valid integer`);

        perPage = parseInt(perPage);
        if(perPage !== perPage) throw new Error(`perPage must be a valid integer`);

        if(page < 1) page = 1;
        if(perPage > 100) perPage = 100;
        if(perPage < 5) perPage = 5;

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

        if(mode === "get-log-settings"){

            const data = await getLogsFolderSettings();

            return Response.json(data);
        }

        if(mode === "get-importer-history"){

            const result = await getImporterHistory(page, perPage);

            const {totals, data} = result;
            
            return Response.json({"data": data, "totals": totals});
        }

        if(mode === "get-importer-names"){

            const data = await getImporterNames();
            
            return Response.json({"data": data});
        }

        if(mode === "get-rejected-history"){

            const result = await getRejectedHistory(page, perPage);

            const {totals, data} = result;
            
            return Response.json({"data": data, "totals": totals});
        }

        if(mode === "get-importer-logs"){

            const {totals, data} = await getLogImportHistory(page, perPage);

            return Response.json({"data": data, "totals": totals});
        }

        if(mode === "get-site-settings"){

            const data = await getAllSiteSettings();

            return Response.json({"data": data});

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