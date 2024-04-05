import { updateGametype } from "../gametypes.mjs";

export class Gametype{

    constructor(){

        this.name = "";
    }

    async setGametypeId(){


        this.id = await updateGametype(this.name);
    }
}