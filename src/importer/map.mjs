import { createRandomString, removeUNR } from "../generic.mjs";
import { updateMap, updateTotals } from "../maps.mjs";
import { bImportRandomizeNames } from "../../config.mjs";

export class Map{

    constructor(){

        this.name = "";
    }

    parseLine(line){

        const reg = /^(.+?)\t(.+)$/i;
        const result = reg.exec(line);

        if(result === null) return;

        const type = result[1].toLowerCase();
        const value = result[2];

        if(type === "name"){
            this.name = removeUNR(result[2]);
        }
    }


    async setId(){

        if(bImportRandomizeNames){
            this.name = createRandomString(20);
        }
        
        this.id = await updateMap(this.name);
    }

    async updateTotals(){
        await updateTotals(this.id);
    }

}