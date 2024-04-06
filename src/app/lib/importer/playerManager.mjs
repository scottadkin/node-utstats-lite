import { Player } from "./player.mjs";
import Message from "../message.mjs";
import { getPlayerMasterId, createMasterPlayer, setMasterPlayerIP } from "../players.mjs";

export class PlayerManager{

    constructor(){

        this.players = [];
    }

    parseLine(timestamp, line){

        const typeReg = /^player\t((.+?)\t.+)$/i;

        const playerNameReg = /^rename\t(.+)\t(\d+)$/i;
        const isABotReg = /^isabot\t(.+)\t(.+)$/i;
        const teamReg = /^team\t(\d+?)\t(\d+)$/i;
        const ipReg = /^ip\t(\d+?)\t(.+)$/i;
        const genericReg = /^(.+?)\t(\d+?)\t(.+)$/i;

        const typeResult = typeReg.exec(line);

        if(typeResult === null) return;

        const type = typeResult[2].toLowerCase();
        line = typeResult[1];

        if(type === "rename"){

            const result = playerNameReg.exec(line);
            if(result === null) return;

            this.addPlayer(timestamp, result[1], parseInt(result[2]));
            return;
        }

        if(type === "isabot"){

            const result = isABotReg.exec(line);
            if(result === null) return;

            const playerId = parseInt(result[1]);
            let bBot = result[2].toLowerCase();

            if(bBot === "true"){
                bBot = 1;
            }else{
                bBot = 0;
            }

            this.setPlayerProperty(playerId, "bBot", bBot);
            return;
        }

        if(type === "team"){

            const result = teamReg.exec(line);

            if(result === null) return;

            const playerId = parseInt(result[1]);
            const teamId = parseInt(result[2]);

            this.setPlayerProperty(playerId, "team", teamId);
            return;

        }

        if(type === "ip"){

            const result = ipReg.exec(line);

            if(result === null) return;

            const playerId = parseInt(result[1]);
            const ip = result[2];

            this.setPlayerProperty(playerId, "ip", ip);
            return;
        }


        const genericResult = genericReg.exec(line);

        if(genericResult === null) return;

        const subType = genericResult[1].toLowerCase();

        const targets = ["hwid", "mac1", "mac2"];

        if(targets.indexOf(subType) === -1) return;

        const playerId = parseInt(genericResult[2]);
        const subValue = genericResult[3];
        
        this.setPlayerProperty(playerId, subType, subValue);
        
    }


    parseStatLine(timestamp, line){

        const reg = /^stat_player\t(.+?)\t(.+?)\t(.+?)$/i;

        const result = reg.exec(line);

        if(result === null) return;

        let type = result[1].toLowerCase();
        const playerId = parseInt(result[2]);
        const value = result[3];

        switch(type){
            case "teamkills": {
                type = "teamKills";
                break;
            }
            case "time_on_server": {
                type = "timeOnServer";
                break;
            }
        }

        this.setPlayerStatProperty(playerId, type, value)
    }


    getPlayerByName(name){

        name = name.toLowerCase();

        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];

            if(p.name.toLowerCase() === name) return p;
        }

        return null;
    }

    getPlayerById(id){

        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];

            if(p.id === id) return p;
        }

        return null;
    }

    addPlayer(timestamp, name, playerId){

        this.players.push(new Player(timestamp, name, playerId));
    }

    /**
     * Use setPlayerStatsProperty() for anything stats related
     * @param {*} playerId 
     * @param {*} key 
     * @param {*} value 
     * @returns 
     */
    setPlayerProperty(playerId, key, value){

        const player = this.getPlayerById(playerId);

        if(player === null){
            new Message(`Failed to get player by id ${playerId}, setPlayerProperty()`,"error");
            return;
        }

        player[key] = value;
    }

    setPlayerStatProperty(playerId, key, value){

        const player = this.getPlayerById(playerId);

        if(player === null){
            new Message(`Failed to get player by id ${playerId}, setPlayerStatProperty()`,"error");
            return;
        }

        player.stats[key] = value;
    }


    async setPlayerMasterIds(){

        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];

            const masterId = await getPlayerMasterId(p.name, p.hwid, p.mac1, p.mac2);

            if(masterId === null){

                //new Message("Player doesn't exist", "note");
                await createMasterPlayer(p.name, p.ip, p.hwid, p.mac1, p.mac2);

            }else{

                await setMasterPlayerIP(masterId, p.ip);
                //new Message("Player already exists", "note");
            }
            //console.log(await getPlayerMasterId(p.name));
        }
    }
}