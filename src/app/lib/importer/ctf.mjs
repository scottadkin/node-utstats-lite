import Message from "../message.mjs";
import { insertPlayerMatchData } from "../ctf.mjs";

export class CTF{

    constructor(){

        this.events = [];
    }

    parseLine(timestamp, line){

        const typeReg = /^(.+?)\t(.+)$/i;

        const typeResult = typeReg.exec(line);

        if(typeResult === null) return;

        const type = typeResult[1].toLowerCase();
        const subString = typeResult[2];
        
        if(type === "flag_captured"){
      
            const reg = /(\d+?)\t(\d+)/i;
            const result = reg.exec(subString);
       
            if(result === null) return;

            this.events.push({"type": "capture", "playerId": parseInt(result[1]), "timestamp": timestamp});
            return;
        }

        if(type === "flag_kill"){
            this.events.push({"type": "kill", "playerId": parseInt(subString), "timestamp": timestamp});
            return;
        }

        if(type === "flag_cover"){

            this.parseFlagCover(timestamp, subString);
            return;
        }

        if(type === "flag_taken"){

            this.parseGeneric(timestamp, subString, "taken");
            return;
        }

        if(type === "flag_dropped"){
            this.parseGeneric(timestamp, subString, "dropped");
            return;
        }

        if(type === "flag_assist"){
            this.parseGeneric(timestamp, subString, "assist");
            return;
        }

        if(type === "flag_returned"){
            this.parseGeneric(timestamp, subString, "return");
            return;
        }

        if(type === "flag_return_base"){
            this.parseGeneric(timestamp, subString, "returnBase");
            return;
        }

        if(type === "flag_return_mid"){
            this.parseGeneric(timestamp, subString, "returnMid");
            return;
        }

        if(type === "flag_return_enemybase"){
            this.parseGeneric(timestamp, subString, "returnEnemyBase");
            return;
        }

        if(type === "flag_return_closesave"){
            this.parseGeneric(timestamp, subString, "returnSave");
            return;
        }

        if(type === "flag_pickedup"){
            this.parseGeneric(timestamp, subString, "pickedup");
            return;
        }

        if(type === "flag_seal"){

            this.parseSeal(timestamp, subString);
            return;
        }
    }

    parseFlagCover(timestamp, line){

        const reg = /^(\d+?)\t(\d+?)\t(.+)$/i;

        const result = reg.exec(line);
        if(result === null) return;

        const killerId = parseInt(result[1]);
        const teamId = parseInt(result[3]);

        this.events.push({"type": "cover", "playerId": killerId, "teamId": teamId, "timestamp": timestamp});
    }

    parseGeneric(timestamp, string, type){

        const reg = /^(\d+?)\t(\d+)$/i;

        const result = reg.exec(string);

        if(result === null) return;

        const playerId = parseInt(result[1]);

        this.events.push({"type": type, "playerId": playerId, "timestamp": timestamp}); 
    }

    parseSeal(timestamp, string){

        const reg = /^(\d+?)\t(\d+)\t\d+$/i;

        const result = reg.exec(string);

        if(result === null) return;

        const playerId = parseInt(result[1]);

        this.events.push({"type": "seal", "playerId": playerId, "timestamp": timestamp}); 
    }


    setPlayerStats(playerManager){

        for(let i = 0; i < this.events.length; i++){

            const e = this.events[i];

            const player = playerManager.getPlayerById(e.playerId);
    
            if(player === null){
                new Message(`player is null ctf.setPlayerStats`,"warning");
                continue;
            }

            player.stats.ctf[e.type]++;
        }
    }

    async insertPlayerMatchData(playerManager, matchId){

        await insertPlayerMatchData(playerManager, matchId);
    }

}

