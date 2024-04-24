import { Client } from "basic-ftp"; 
import Message from "./message.mjs";
import { logFilePrefix, importedLogsFolder } from "../../../config.mjs";

export class FTPImporter{

    constructor(host, port, user, password, secure, targetFolder){

        this.host = host;
        this.port = port;
        this.user = user;
        this.password = password;
        this.secure = secure;
        this.targetFolder = targetFolder;
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

                if(f.name.toLowerCase().startsWith(lowerPrefix) && fileExt.test(f.name)){

                    await this.client.downloadTo(`${importedLogsFolder}/${f.name}`, `./Logs/${f.name}`);
                    new Message(`Downloaded file ${importedLogsFolder}/${f.name}`,"pass");
                }

            }catch(err){
                new Message(err.toString(),"error");
            }
        }
    }
}