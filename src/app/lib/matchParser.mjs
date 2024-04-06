import { PlayerManager } from "./importer/playerManager.mjs";
import { createMatch } from "./matches.mjs";
import Message from "./message.mjs";
import {Match} from "./importer/match.mjs";
import { Server } from "./importer/server.mjs";
import { Gametype } from "./importer/gametype.mjs";
import { Map } from "./importer/map.mjs";

export class MatchParser{

    constructor(rawData){

        this.rawData = rawData;

        this.players = new PlayerManager();
        //console.log(`${this.rawData}`);
        this.match = new Match();
        this.server = new Server();
        this.gametype = new Gametype();
        this.map = new Map();

        this.parseLines();

    }

    async main(){


        try{

            await this.players.setPlayerMasterIds();

            await this.server.setId();
            await this.gametype.setId();
            await this.map.setId();

            //serverId, gametypeId, mapId, date, players
            this.matchId = await createMatch(this.server.id, this.gametype.id, this.map.id, this.match.date, 0);

            if(this.matchId === null){
                new Message(`Failed to create match id.`,"error")
                return;
            }

            await this.players.insertPlayerMatchData(this.matchId);

        }catch(err){
            console.trace(err);
            new Message(err.toString(),"error");
        }
        
        
    }

    parseLines(){

        const test = this.rawData;

        const lineReg = /^(.+?)$/img;
        const lines = test.match(lineReg);


        const timestampReg = /^(\d+?\.\d+?)\t(.+)$/i;
        //38.49	player	Rename	Archon	1

        const playerReg =  /^player\t(.+)$/i;
        const statPlayerReg = /^stat_player\t(.+)$/i;

        const infoReg = /^info\t(.+)$/i;
        const gameReg = /^game\t(.+)$/i;        
        const mapReg = /^map\t(.+)$/i;

        for(let i = 0; i < lines.length; i++){
            

            //console.log(i);
            const line = lines[i];

            const timestampResult = timestampReg.exec(line);

            if(timestampResult === null) continue;

            const timestamp = parseFloat(timestampResult[1]);
            const subString = timestampResult[2];

            if(playerReg.test(subString)){

                this.players.parseLine(timestamp, subString);
                continue;
            }

            if(statPlayerReg.test(subString)){

                this.players.parseStatLine(timestamp, subString);
                continue;
            }

            if(infoReg.test(subString)){

                const result = infoReg.exec(subString);
                
                this.parseMatchInfo(result[1]);
                continue;
            }


            if(gameReg.test(subString)){

                const result = gameReg.exec(subString);

                this.gametype.parseLine(result[1]);
                continue;
            }

            if(mapReg.test(subString)){

                const result = mapReg.exec(subString);
                this.map.parseLine(result[1]);
                continue;
            }

            //console.log(playerNameReg.test(line));
            
        }


        console.log(this.players.players);


        //console.log(lines);
    }


    parseMatchInfo(line){

        if(line === null) return;

        const typeReg = /^(.+?)\t(.*)$/i;

        const result = typeReg.exec(line);

        if(result === null) return;


        const type = result[1].toLowerCase();
        const value = result[2];

        //0.00	info	Server_ServerName	Dogs have wet noses

        if(type === "absolute_time"){
            this.match.setDate(value);    
        }

        if(type === "server_servername"){
            this.server.name = value;
        }
    }

    
}

