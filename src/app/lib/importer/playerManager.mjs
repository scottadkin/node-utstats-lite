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

        }

        if(type === "ip"){

            const result = ipReg.exec(line);

            if(result === null) return;

            const playerId = parseInt(result[1]);
            const ip = result[2];

            this.setPlayerProperty(playerId, "ip", ip);
        }
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

        console.log("ADDPLAYER");
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


    async setPlayerMasterIds(){

        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];
            console.log(p.name);

            const masterId = await getPlayerMasterId(p.name, p.hwid, p.mac1, p.mac2);

            if(masterId === null){
                new Message("Player doesn't exist", "note");

                await createMasterPlayer(p.name, p.ip, p.hwid, p.mac1, p.mac2);
            }else{


                await setMasterPlayerIP(masterId, p.ip);
                console.log("get player id");
                new Message("Player already exists", "note");
            }
            //console.log(await getPlayerMasterId(p.name));
        }
    }
}