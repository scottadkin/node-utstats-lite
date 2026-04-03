import { updateServer, updateServerTotals } from "../servers.mjs";
import { bImportRandomizeNames } from "../../config.mjs";
import { createRandomString } from "../generic.mjs";

export class Server{

    constructor(){

        this.name = "server name";
        this.ip = "";
        this.port = 7777;
    }

    async setId(){

        if(bImportRandomizeNames){
            this.name = `${createRandomString(1)}${this.name}`;
        }
        this.id = await updateServer(this.name, this.ip, this.port);
    }

    async updateTotals(){

        await updateServerTotals(this.id);
    }
}