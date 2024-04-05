import { updateServer } from "../servers.mjs";

export class Server{

    constructor(){

        this.name = "server name";
        this.ip = "";
        this.port = 7777;
    }

    async setServerId(){

        this.id = await updateServer(this.name, this.ip, this.port);
    }
}