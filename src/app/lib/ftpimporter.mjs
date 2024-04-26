import { Client } from "basic-ftp"; 
import Message from "./message.mjs";
import { logFilePrefix, importedLogsFolder } from "../../../config.mjs";
import { bLogAlreadyImported } from "./importer.mjs";

export class FTPImporter{

    constructor(host, port, user, password, secure, targetFolder, bIgnoreDuplicates, bDeleteAfterImport){

        this.host = host;
        this.port = port;
        this.user = user;
        this.password = password;
        this.secure = secure;
        this.targetFolder = targetFolder;
        this.bIgnoreDuplicates = bIgnoreDuplicates;
        this.bDeleteAfterImport = bDeleteAfterImport;
    }
   


    async connect(){

        this.client = new Client()

        //this.client.ftp.verbose = true

        try {

            await this.client.access({
                "host": this.host,
                "port": this.port,
                "user": this.user,
                "password": this.password,
                "secure": false
            });

            new Message(`Connected to ${this.host}:${this.port}`,"pass");

            await this.downloadMatchLogs();

        }catch(err) {
            new Message(err.toString(),"error");
        }

        this.client.close();
        new Message(`Disconnected from ${this.host}`,"note");
    }

    async downloadMatchLogs(){

        const files = await this.client.list(`${this.targetFolder}/Logs`);

        const lowerPrefix = logFilePrefix.toLowerCase();
        const fileExt = /^.+\.log$/i;
       
        for(let i = 0; i < files.length; i++){


            try{

                const f = files[i];

                if(!fileExt.test(f.name) || !f.name.toLowerCase().startsWith(lowerPrefix)) continue;

                if(this.bIgnoreDuplicates && await bLogAlreadyImported(f.name)){
                    new Message(`${f.name} has already been imported, skipping.`, "note");
                
                }else{

                    await this.client.downloadTo(`${importedLogsFolder}/${f.name}`, `./Logs/${f.name}`);
                    new Message(`Downloaded file ${importedLogsFolder}/${f.name}`,"pass"); 
                }

                if(this.bDeleteAfterImport === 1){
                    new Message(`Deleting file ${f.name} from ftp server.`,"note");
                    await this.client.remove(`./Logs/${f.name}`);
                }

            }catch(err){
                new Message(err.toString(),"error");
            }
        }
    }
}