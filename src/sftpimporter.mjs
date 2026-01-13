import Client from "ssh2-sftp-client";
import Message from "./message.mjs";
import { logFilePrefix, importedLogsFolder, minTmpFileLifetime } from "../config.mjs";
import { bLogAlreadyImported } from "./importer.mjs";
import { createWriteStream } from "fs";
import { bTMPFileOldEnough } from "./generic.mjs";
import path from "path";

export class SFTPImporter{

    constructor(host, port, user, password, secure, targetFolder, bIgnoreDuplicates, bDeleteAfterImport, bDeleteTmpFiles){

        this.host = host;
        this.port = port;
        this.user = user;
        this.password = password;
        this.secure = secure;
        this.targetFolder = path.join("./", targetFolder);
        this.logsFolder = path.join(this.targetFolder, "Logs");
        this.bIgnoreDuplicates = bIgnoreDuplicates;
        this.bDeleteAfterImport = bDeleteAfterImport;
        this.bDeleteTmpFiles = bDeleteTmpFiles;
    }
   


    async connect(){

       this.client = new Client("sftp-importer");

        
        const config = {
            "host": this.host,
            "port": this.port,
            "user": this.user,
            "password": this.password
        };

        let sftp = new Client();

        return this.client.connect(config).then( () => {

            new Message(`Connected to ${this.host}:${this.port}(SFTP)`,"pass");
            return this.downloadMatchLogs()
        })
        .then(() => {
            sftp.end();
        })
        .catch(err => {
            console.error(err.message);
        }).finally(() =>{
            new Message(`Disconnected from ${this.host}(SFTP)`,"note");
        });

        
    }

    async deleteTmpFile(file){

        if(!this.bDeleteTmpFiles){
            new Message(`Delete tmp files is turned off.`,"note");
            return;
        }

        const bValid = bTMPFileOldEnough(file.name, minTmpFileLifetime);

        if(bValid === null){
            new Message(`Could not parse a valid datetimestamp from filename.`,"error");
            return;
        }

        if(!bValid) return;

        const dest = path.join(this.logsFolder, file.name);
        
        await this.client.delete(dest);
        new Message(`Deleting tmp file ${file.name}`, "note");
    }


    async downloadMatchLogs(){

        const test = path.join(this.targetFolder, "Logs");

        const files = await this.client.list(test);

        const lowerPrefix = logFilePrefix.toLowerCase();

        const extReg = /^.+\.(.+)$/i;
       
       // for(let i = 0; i < files.length; i++){
        for(const file of Object.values(files)){

            try{

                const f = file;

                const extResult = extReg.exec(f.name);

                if(extResult === null) continue;

                const ext = extResult[1].toLowerCase();

                if(ext !== "tmp" && ext !== "log") continue;

                if(ext === "tmp"){

                    await this.deleteTmpFile(file);
                    continue;
                }

                if(!f.name.toLowerCase().startsWith(lowerPrefix)) continue;

                if(this.bIgnoreDuplicates && await bLogAlreadyImported(f.name)){
                    new Message(`${f.name} has already been imported, skipping.`, "note");
                
                }else{

                    let dst = createWriteStream(`${importedLogsFolder}/${f.name}`);

                    const targetFile = path.join(this.logsFolder, f.name);
                    await this.client.get(targetFile, dst);
                    new Message(`Downloaded file ${importedLogsFolder}/${f.name}`,"pass"); 
                }

                if(this.bDeleteAfterImport === 1){
                    new Message(`Deleting file ${f.name} from ftp server.`,"note");
                    await this.client.delete(`${this.targetFolder}/Logs/${f.name}`);
                }

            }catch(err){
                console.log(`---`);
                new Message(err.toString(),"error");
            }
        }

    }
}