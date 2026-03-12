import { 
    getBasicMatchJSON, getMatchIdFromHash, getMatchKillsBasicJSON, 
    getMatchKillsDetailedJSON, getMatchFullPlayerStatsJSON,
    getMatchBasicPlayersJSON,
    getDetailedMatchJSON,
    getMatchCTFJSON

} from "../matches.mjs";

export default class ApiJSON{

    constructor(req, res){

        this.req = req;
        this.res = res;
    }


    throwErrorIfQueryUndefined(target){

        if(this.req.query[target] === undefined){
            throw new Error(`The command requires a ${target} key`);
        }
    }


    async processMatchRequests(cat){

        this.throwErrorIfQueryUndefined("id");

        let id = this.req.query.id;

        if(id.length === 32){
            id = await getMatchIdFromHash(id);
            if(id === null) throw new Error("Not a valid match hash");
        }

        if(cat === "help"){

            return {
                "basic": "Returns basic info such as team scores, match length, total players, total teams",
                "players": "Returns all the player match data",
                "help": "Shows list of commands"
            };

        }else if(cat === "basic"){

            return await getBasicMatchJSON(id);

        }else if(cat === "detailed"){
            
            return await getDetailedMatchJSON(id);
            
        }else if(cat === "ctf"){

            return await getMatchCTFJSON(id);
            
        }else if(cat === "players-full"){

            return await getMatchFullPlayerStatsJSON(id);

        }else if(cat === "players-basic"){
            return await getMatchBasicPlayersJSON(id);
            
        }else if(cat === "kills-basic"){

            return await getMatchKillsBasicJSON(id);

        }else if(cat === "kills-detailed"){
            return await getMatchKillsDetailedJSON(id);
        }

        return {"error": "Unknown Command"};
    }

    async init(){

        console.log(this.req.query);
        console.log(this.req.params);

        if(this.req.params.mode === undefined){
            throw new Error(`No mode provided`);
        }

        if(this.req.params.cat === undefined){
            throw new Error(`No category provided`);
        }

        //let mode = this.req.params.mode ?? "";

        const mode = this.req.params.mode.toLowerCase();
        const cat = this.req.params.cat.toLowerCase();
        console.log(mode);


        let json = {
            "error": "Does not match any commands"
        };

        if(mode === "match"){
            json = await this.processMatchRequests(cat);
        }



        return this.res.json(json);
    }
}