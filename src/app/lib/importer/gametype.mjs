import { updateGametype } from "../gametypes.mjs";

export class Gametype{

    constructor(){

        this.name = "";
        this.bHardcore = 0;
        this.bInsta = 0;
    }

    parseLine(line){

        const reg = /^(.+?)\t(.+)$/i;

        const result = reg.exec(line);

        if(result === null) return;

        const type = result[1].toLowerCase();
        let value = result[2];

        if(type === "gamename"){
            this.name = value;
            return;
        }

        if(type === "hardcore"){

            value = value.toLowerCase();

            if(value === "true"){
                this.bHardcore = 1;
            }else{
                this.bHardcore = 0;
            }
            return;
        }

        if(type === "insta"){

            value = value.toLowerCase();

            if(value === "true"){
                this.bInsta = 1;
            }else{
                this.bInsta = 0;
            }

            return;
        }
    }

    async setId(){
        
        this.id = await updateGametype(this.name);
    }


    updateName(){

        if(this.bInsta === 0) return;

        this.name = `${this.name} (Instagib)`;
    }
}