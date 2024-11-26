import Message from "../message.mjs";
import { insertPlayerMatchData, updatePlayerTotals } from "../ctf.mjs";
import ctfFlag from "./ctfFlag.mjs";

export class CTF{

    constructor(){

        this.events = [];

        this.flags = [];

        for(let i = 0; i < 4; i++){

            this.flags.push(new ctfFlag(i));
        }

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
 
            this.events.push({
                "type": "capture", 
                "playerId": parseInt(result[1]), 
                "timestamp": timestamp,
                "teamId": parseInt(result[2])
            });

            return;
        }

        /*if(type === "flag_kill"){
            this.events.push({"type": "kill", "playerId": parseInt(subString), "timestamp": timestamp});
            return;
        }*/

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

        this.events.push({"type": type, "playerId": playerId, "timestamp": timestamp, "teamId": parseInt(result[2])}); 
    }

    parseSeal(timestamp, string){

        const reg = /^(\d+?)\t(\d+)\t\d+$/i;

        const result = reg.exec(string);

        if(result === null) return;

        const playerId = parseInt(result[1]);

        this.events.push({"type": "seal", "playerId": playerId, "timestamp": timestamp}); 
    }


    setPlayerStats(playerManager, killsManager){

        for(let i = 0; i < this.events.length; i++){

            const e = this.events[i];

            const player = playerManager.getPlayerById(e.playerId);
    
            if(player === null){
                new Message(`player is null ctf.setPlayerStats`,"warning");
                continue;
            }

            player.stats.ctf[e.type]++;
        }

        this.setFlagKills(playerManager, killsManager);
    }

    bAnyCTFEvents(players){

        let keys = null;

        for(const playerData of Object.values(players)){

            if(keys === null) keys = Object.keys(playerData.stats.ctf);

            for(let i = 0; i < keys.length; i++){

                if(playerData.stats.ctf[keys[i]] !== 0) return true;
            }
        }

        return false;
    }

    async insertPlayerMatchData(playerManager, matchId){

        if(this.bAnyCTFEvents(playerManager.mergedPlayers)){
            await insertPlayerMatchData(playerManager, matchId);
        }
    }


    async updatePlayerTotals(playerManager){

        if(this.bAnyCTFEvents(playerManager.mergedPlayers)){

            const playerIds = [];

            for(const player of Object.values(playerManager.mergedPlayers)){

                playerIds.push(player.masterId);
            }

            await updatePlayerTotals(playerIds);
        }
    }


    setFlagKills(playerManager, killsManager){

        for(let i = 0; i < this.events.length; i++){

            const e = this.events[i];

            let killer = null;

            const player = playerManager.getPlayerById(e.playerId);

            const deathInfo = killsManager.getDeath(e.timestamp, e.playerId);

            if(deathInfo !== null){

                killer = playerManager.getPlayerById(deathInfo.killer);
                //suicide
                if(killer === null){
                    player.bHasFlag = false;
                    //new Message(`ctf deathInfo killer is null`,"warning");
                    continue;
                }

                if(player.bHasFlag && !deathInfo.bTeamKill){

                    killer.stats.ctf.kill++;
                    player.bHasFlag = false;
                    continue;
                }
            }
            

            if(e.type === "taken" || e.type === "pickedup"){
                player.bHasFlag = true;      
                continue; 
            }

            if(e.type === "dropped"){
                player.bHasFlag = false;
                continue;
            }

            if(e.type === "capture"){
                player.bHasFlag = false;
            }
        }
    }


    processFlagEvents(playerManager){

        console.table(this.events);

        for(let i = 0; i < this.events.length; i++){

            //teamId is dependent on event type, taken/pickedup is the flag team id
            const {type, playerId, timestamp, teamId } = this.events[i];

            const flag = this.flags[teamId];

            if(flag === undefined){

                continue;
            }

            const playerTeam = playerManager.getPlayerTeamAt(playerId, timestamp);

            if(playerTeam === null){
                new Message(`ctf.processFlagEvents(): Failed to get playerTeam is null`,"error");
            }

            if(type === "taken" || type === "pickedup"){

                flag.taken(timestamp, playerId, type === "taken");
                continue;
            }

            //ignore mid/close as they are also logged as return at smae timestamp
            if(type === "return"){

                flag.returned(timestamp, playerId);
                continue;
            }

            if(type === "dropped"){

                flag.dropped(timestamp, playerId);
                continue;            
            }


            if(type === "cover"){
                flag.cover(timestamp, playerId);
                continue;
            }

            if(type === "capture"){

                const playerTeam = playerManager.getPlayerTeamAt(playerId, timestamp);
                flag.captured(timestamp, playerId, playerTeam);
                continue;
            }


            //TODO: need to check if disconnect logs a flag_drop
        }
    }

}

