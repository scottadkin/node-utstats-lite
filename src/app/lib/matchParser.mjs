import { PlayerManager } from "./importer/playerManager.mjs";
import { createMatch } from "./matches.mjs";
import Message from "./message.mjs";
import {Match} from "./importer/match.mjs";
import { Server } from "./importer/server.mjs";
import { Gametype } from "./importer/gametype.mjs";
import { Map } from "./importer/map.mjs";
import { WeaponsManager } from "./importer/weaponsManager.mjs";
import { KillsManager } from "./importer/killsmanager.mjs";

export class MatchParser{

    constructor(rawData){

        this.rawData = rawData;

        this.players = new PlayerManager();
        //console.log(`${this.rawData}`);
        this.match = new Match();
        this.server = new Server();
        this.gametype = new Gametype();
        this.map = new Map();
        this.weapons = new WeaponsManager();
        this.kills = new KillsManager();


        this.totalTeams = 0;
        this.teamScores = [0,0,0,0];
        this.soloWinner = 0;
        this.soloWinnerScore = 0;

        this.bHardscore = null;

        this.parseLines();

    }

    async main(){

        try{

            await this.players.setPlayerMasterIds();

            await this.server.setId();
            await this.gametype.setId();
            await this.map.setId();

            //serverId, gametypeId, mapId, date, players
            this.matchId = await createMatch(
                this.server.id, 
                this.gametype.id, 
                this.map.id, 
                this.match.date, 
                0,
                this.totalTeams,
                this.teamScores[0],
                this.teamScores[1],
                this.teamScores[2],
                this.teamScores[3],
                this.soloWinner,
                this.soloWinnerScore
            );

            if(this.matchId === null){
                new Message(`Failed to create match id.`,"error")
                return;
            }

            await this.players.insertPlayerMatchData(this.matchId);
            await this.weapons.setWeaponIds();
            this.kills.setWeaponIds(this.weapons.weapons);
            this.kills.setPlayerIds(this.players);
            await this.kills.insertKills(this.matchId);


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
        const killReg = /^(kill|teamkill)\t(.+)$/i

        const teamScoreReg = /^teamscore\t(\d+)\t(.+)$/i;

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

            if(killReg.test(subString)){

                this.kills.parseLine(timestamp, subString);
                this.weapons.parseLine(subString);
                continue;
            }

            if(teamScoreReg.test(subString)){

                this.setTeamScores(teamScoreReg.exec(subString));
                continue;
            }    
        }
    }


    parseMatchInfo(line){

        if(line === null) return;

        const typeReg = /^(.+?)\t(.*)$/i;

        const result = typeReg.exec(line);

        if(result === null) return;

        const type = result[1].toLowerCase();
        const value = result[2];

        if(type === "absolute_time"){
            this.match.setDate(value);    
        }

        if(type === "server_servername"){
            this.server.name = value;
        }
    }


    setTeamScores(regResult){

        if(regResult === null) return;

        const teamId = parseInt(regResult[1]);
        const teamScore = parseInt(regResult[2]);

        if(teamId + 1 > this.totalTeams){
            this.totalTeams = teamId + 1;
        }

        this.teamScores[teamId] = teamScore;
    }

    
}

