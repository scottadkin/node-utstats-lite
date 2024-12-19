import Message from "../message.mjs";
import { insertPlayerMatchData, updatePlayerTotals, insertCaps } from "../ctf.mjs";
import ctfFlag from "./ctfFlag.mjs";
import { bulkInsert, simpleQuery } from "../database.mjs";
import { getTeamName, scalePlaytime } from "../generic.mjs";

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

        if(type === "flag_returned_timeout"){

            this.parseTimeout(timestamp, subString);
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

    parseTimeout(timestamp, flagTeam){

        this.events.push({"type": "timeout", "playerId": null, "timestamp": timestamp, "teamId": parseInt(flagTeam)}); 
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

                if(e.type === "timeout") continue;

                new Message(`player is null ctf.setPlayerStats`,"warning");
                continue;
            }

            if(e.type === "taken" || e.type === "pickedup"){
                player.lastFlagPickupTime = e.timestamp;
            }

            if(e.type === "dropped" || e.type === "capture"){

                const diff = e.timestamp - player.lastFlagPickupTime;

                if(diff > player.stats.ctf.flagCarryTime.max){
                    player.stats.ctf.flagCarryTime.max = diff;
                }

                if(player.stats.ctf.flagCarryTime.min === -1 || diff < player.stats.ctf.flagCarryTime.min){
                    player.stats.ctf.flagCarryTime.min = diff;
                }

                player.stats.ctf.flagCarryTime.total += diff;
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

    async insertPlayerMatchData(playerManager, matchId, gametypeId, mapId){

        if(this.bAnyCTFEvents(playerManager.mergedPlayers)){
            await insertPlayerMatchData(playerManager, matchId, gametypeId, mapId);
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


    async processFlagEvents(playerManager, killsManager, matchId, mapId, gametypeId, bHardcore){

        for(let i = 0; i < this.events.length; i++){

            //teamId is dependent on event type, taken/pickedup is the flag team id
            const {type, playerId, timestamp, teamId } = this.events[i];

            const correctedTimestamp = timestamp//scalePlaytime(timestamp, bHardcore);

            const flag = this.flags[teamId];

            if(flag === undefined) continue;
            
            const playerTeam = playerManager.getPlayerTeamAt(playerId, timestamp);

            if(playerTeam === null && playerId !== null){
                new Message(`ctf.processFlagEvents(): Failed to get playerTeam is null`,"error");
            }

            if(playerId === null && type === "timeout"){
                continue;
            }

            if(type === "taken" || type === "pickedup"){

                flag.taken(correctedTimestamp, playerId, type === "taken", playerTeam);
                continue;
            }

            //ignore mid/close as they are also logged as return at smae timestamp
            if(type === "return"){

                flag.returned(correctedTimestamp, playerId);
                continue;
            }

            if(type === "dropped"){

                flag.dropped(correctedTimestamp, playerId);
                continue;            
            }
            
            if(type === "cover"){
                //do same with seals
                //Only capped covers are saved atm that's why the don't match SCOTT!!
                for(let x = 0; x < this.flags.length; x++){

                    const f = this.flags[x];

                    if(f.enemyTeam === playerTeam){
                        this.flags[x].cover(correctedTimestamp, playerId);
                    }
                }

                continue;
            }

            if(type === "capture"){

                flag.captured(playerManager, killsManager, correctedTimestamp, playerId, playerTeam);
                continue;
            }
        }

        const caps = [...this.flags[0].caps, ...this.flags[1].caps, ...this.flags[2].caps, ...this.flags[3].caps];


        await insertCaps(playerManager, matchId, mapId, gametypeId, caps);
    }

}

