import { Client } from "basic-ftp"; 
import Message from "./message.mjs";
import config from "../../../config.mjs";

export class FTPImporter{

    constructor(host, user, password, secure, targetFolder){

        this.host = host;
        this.user = user;
        this.password = password;
        this.secure = secure;
        this.targetFolder = targetFolder;
    }


    async connect(){

        this.client = new Client()

        this.client.ftp.verbose = true

        try {

            await this.client.access({
                "host": "127.0.0.1",
                "user": "ooper",
                "password": "password",
                "secure": false
            })

            //console.log(await this.client.list("/System"))
            //await client.uploadFrom("README.md", "README_FTP.md")
            //await client.downloadTo("README_COPY.md", "README_FTP.md")

            await this.downloadMatchLogs();
        }
        catch(err) {
            console.log(err)
            new Message(err.toString(),"error");
        }

        this.client.close();
        new Message(`Disconnected from ${this.host}`,"note");
    }

    async downloadMatchLogs(){

        const files = await this.client.list("/Logs");

        const lowerPrefix = config.logFilePrefix.toLowerCase();
        const fileExt = /^.+\.log$/i;


       
        for(let i = 0; i < files.length; i++){

            try{

                const f = files[i];

                if(f.name.toLowerCase().startsWith(lowerPrefix) && fileExt.test(f.name)){

                    await this.client.downloadTo(`${config.importedLogsFolder}/${f.name}`, `/Logs/${f.name}`);
                    new Message(`Downloaded file ${config.importedLogsFolder}/${f.name}`,"pass");
                }

            }catch(err){
                new Message(err.toString(),"error");
            }
        }
    }
}