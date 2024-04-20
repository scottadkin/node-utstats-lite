import { PlayerManager } from "./importer/playerManager.mjs";
import { createMatch } from "./matches.mjs";
import Message from "./message.mjs";
import {Match} from "./importer/match.mjs";
import { Server } from "./importer/server.mjs";
import { Gametype } from "./importer/gametype.mjs";
import { Map } from "./importer/map.mjs";
import { WeaponsManager } from "./importer/weaponsManager.mjs";
import { KillsManager } from "./importer/killsmanager.mjs";
import { scalePlaytime } from "./generic.mjs";
import { CTF } from "./importer/ctf.mjs";
import { Domination } from "./importer/domination.mjs";
import Items from "./importer/items.mjs";

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
        this.ctf = new CTF();
        this.dom = new Domination();
        this.items = new Items();

        this.matchStart = 0;
        this.matchEnd = 0;
        this.matchLength = 0;
        this.totalTeams = 0;
        this.teamScores = [0,0,0,0];
        this.soloWinner = 0;
        this.soloWinnerScore = 0;

        this.parseLines();

    }

    async main(){

        try{

            //append (insta) if game is instagib
            this.gametype.updateName();

            this.ctf.setPlayerStats(this.players);
            await this.dom.setPointIds();
            this.dom.setPlayerCapStats(this.players);
            this.kills.setPlayerSpecialEvents(this.players, this.gametype.bHardcore);
            this.items.setPlayerStats(this.players);

            this.players.mergePlayers();
            this.players.setPlayerPingStats();

            this.players.setCountries();
            this.players.matchEnded(this.matchStart, this.matchEnd);
            this.players.setPlayerPlaytime(this.matchStart, this.matchEnd);
            this.players.scalePlaytimes(this.gametype.bHardcore);


            await this.players.setPlayerMasterIds(this.match.date);

            const soloStats = this.players.getSoloWinner();

            if(soloStats !== null){

                this.soloWinner = soloStats.id;
                this.soloWinnerScore = soloStats.score;
            }

            await this.server.setId();
            await this.gametype.setId();
            await this.map.setId();

            this.matchLength = this.matchEnd - this.matchStart;
            if(this.gametype.bHardcore){
                this.matchLength = scalePlaytime(this.matchLength, true);
            }

            //serverId, gametypeId, mapId, date, players
            this.matchId = await createMatch(
                this.server.id, 
                this.gametype.id, 
                this.map.id, 
                this.gametype.bHardcore,
                this.gametype.bInsta,
                this.match.date, 
                this.matchLength,
                this.players.getTotalUniquePlayers(),
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

            await this.players.insertPlayerMatchData(this.matchId, this.match.date);
            await this.ctf.insertPlayerMatchData(this.players, this.matchId);
            await this.dom.insertPlayerMatchData(this.players.players, this.matchId);
            await this.weapons.setWeaponIds();
            this.kills.setWeaponIds(this.weapons.weapons);
            this.kills.setPlayerIds(this.players);
            await this.kills.insertKills(this.matchId);
            
           // this.players.debugListAllPlayers();

            this.weapons.setPlayerStats(this.kills.kills);
            await this.weapons.insertPlayerMatchStats(this.matchId);
            await this.weapons.updatePlayerTotals(this.players.mergedPlayers);


            await this.players.updatePlayerTotals(this.match.date);
            await this.players.updatePlayerFullTotals();

            await this.ctf.updatePlayerTotals(this.players);
            
            

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
        const playerReg =  /^player\t(.+)$/i;
        const statPlayerReg = /^stat_player\t(.+)$/i;

        const infoReg = /^info\t(.+)$/i;
        const gameReg = /^game\t(.+)$/i;        
        const mapReg = /^map\t(.+)$/i;
        const killReg = /^(kill|teamkill)\t(.+)$/i

        const teamScoreReg = /^teamscore\t(\d+)\t(.+)$/i;
        const headshotReg = /^headshot\t.+$/i;

        const endReg = /^game_end\t.+$/i;

        const firstBloodReg = /^first_blood\t(\d+)$/i;

        const ctfFlagReg = /^flag_(.+?)\t(.+)$/i;
        const domCapReg = /^controlpoint_capture\t.+$/i;

        const itemGetReg = /^item_get\t(.+)$/i;

        for(let i = 0; i < lines.length; i++){
            
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

                const subType = result[1].toLowerCase();

                if(subType === "realstart"){
                    this.matchStart = timestamp;
                    continue;
                }

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

            if(endReg.test(subString)){
                this.matchEnd = timestamp;
                continue;
            }

            if(headshotReg.test(subString)){
                this.kills.parseLine(timestamp, subString);
                continue;
            }

            if(firstBloodReg.test(subString)){

                const result = firstBloodReg.exec(subString);

                this.kills.setFirstBloodId(result[1]);
                continue;
            }

            if(ctfFlagReg.test(subString)){
                //ignore events in warm up
                if(timestamp < this.matchStart) continue;
                this.ctf.parseLine(timestamp, subString);
                continue;
            }

            if(domCapReg.test(subString)){

                this.dom.parseLine(timestamp, subString);
                continue;
            }

            if(itemGetReg.test(subString)){
                this.items.parseLine(timestamp, subString);
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

