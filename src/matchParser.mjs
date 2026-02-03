import { PlayerManager } from "./importer/playerManager.mjs";
import { createMatch, setMatchHash } from "./matches.mjs";
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
import {calculateRankings} from "./rankings.mjs";
import DamageManager from "./importer/damageManager.mjs";
import ClassicWeaponStats from "./importer/classicWeaponStats.mjs";


export class MatchParser{

    constructor(rawData, bIgnoreBots, bIgnoreDuplicates, minPlayers, minPlaytime, bAppendTeamSizes){

        this.rawData = rawData;
        this.bIgnoreBots = bIgnoreBots;
        this.bIgnoreDuplicates = bIgnoreDuplicates;
        this.minPlayers = minPlayers;
        this.minPlaytime = minPlaytime;
        this.bAppendTeamSizes = bAppendTeamSizes;
        this.lines = [];

        const lineReg = /^(.+?)$/img;
        this.lines = rawData.match(lineReg);

        this.players = new PlayerManager();
        //console.log(`${this.rawData}`);
        this.match = new Match();
        this.server = new Server();
        this.gametype = new Gametype();
        this.map = new Map();
        this.weapons = new WeaponsManager();
        this.kills = new KillsManager();

        this.kills.playerManager = this.players;
        this.ctf = new CTF();
        this.dom = new Domination();
        this.items = new Items();
        this.damageManager = new DamageManager();
        this.classicWeaponStats = new ClassicWeaponStats();

        this.bMapChangeEnd = false;
        this.matchStart = -1;
        this.matchEnd = -1;
        this.matchLength = 0;
        this.totalTeams = 0;
        this.teamScores = [0,0,0,0];
        this.soloWinner = 0;
        this.soloWinnerScore = 0;


        //check if utstats-lite log because stat_player behaves differently(merges player stats into one for multiple reconnects) 
        this.bUTStatsLiteLog = false;
        

    }


    async main(){

        //set matchStart, matchEnd, hardcore, skip parsing log in some conditions
        this.preliminaryChecks();

        

        this.players.createPlayers(this.lines, this.matchStart, this.matchEnd, this.bHardcore);
 
        this.parseLines();

        if(this.bMapChangeEnd){
            new Message(`Match end type was map change, skipping log parsing.`,"error");
            throw new Error("MAP CHANGE END");
        }


        if(this.matchStart === -1){
            new Message(`There was no match start event in this log.`, "error");
            throw new Error("NO START");
        }

        if(this.matchEnd === -1){
            new Message(`There was no match end event in this log.`, "error");
            throw new Error("NO END");
        }

        this.matchLength = this.matchEnd - this.matchStart;

        if(this.matchLength < this.minPlaytime){

            new Message(`Match length is shorter than minPlaytime (${this.minPlaytime} seconds).`,"error");
            throw new Error("MIN PLAYTIME");
        }   


        this.players.bIgnoreBots = this.bIgnoreBots;

        await this.players.setPlayerMasterIds(this.match.date);


        this.kills.setAllDeaths();
        //append (insta) if game is instagib
        this.gametype.updateName();

        //console.log(this.ctf.flags);
        this.ctf.setPlayerStats(this.players, this.kills);

        
        this.ctf.bAnyCTFEvents(this.players.players);
        await this.dom.setPointIds();
        this.dom.setPlayerCapStats(this.players);
        
        this.kills.setPlayerSpecialEvents(this.players);
        this.items.setPlayerStats(this.players);

        this.damageManager.setPlayerDamage(this.players);

        await this.weapons.setWeaponIds();

        this.classicWeaponStats.setPlayerStats(this.weapons, this.players);
        
        this.players.setPlayerPingStats();

        this.players.setCountries();
        this.players.matchEnded(this.matchStart, this.matchEnd);

        const totalPlayers = this.players.getTotalUniquePlayers(this.totalTeams);

        if(totalPlayers < this.minPlayers){
            new Message(`Match has less then the minimum players limit (found ${totalPlayers} out of a target of ${this.minPlayers}).`,"error");
            throw new Error("MIN PLAYERS");
        }        
       
        const soloStats = this.players.getSoloWinner(this.totalTeams);

        if(soloStats !== null){

            this.soloWinner = soloStats.id;
            this.soloWinnerScore = soloStats.score;
        }

        await this.server.setId();
        await this.gametype.setId(this.totalTeams, totalPlayers, this.bAppendTeamSizes);
        await this.map.setId();


        this.matchId = await createMatch(
            this.server.id, 
            this.gametype.id, 
            this.map.id, 
            this.bHardcore,
            this.gametype.bInsta,
            this.match.date, 
            this.matchLength,
            this.matchStart, 
            this.matchEnd,
            this.players.getTotalUniquePlayers(this.totalTeams),
            this.totalTeams,
            this.teamScores[0],
            this.teamScores[1],
            this.teamScores[2],
            this.teamScores[3],
            this.soloWinner,
            this.soloWinnerScore,
            this.gametype.targetScore,
            this.gametype.timeLimit,
            this.gametype.mutators
        );

        if(this.matchId === null){
            new Message(`Failed to create match id.`,"error")
            return;
        }

        await this.server.updateTotals();
        await this.gametype.updateTotals();

        //set player to w, d, or l
        this.players.setMatchResult(
            [
                this.teamScores[0],
                this.teamScores[1],
                this.teamScores[2],
                this.teamScores[3]
            ],
            this.soloWinner
        );
        await this.players.insertPlayerMatchData(this.matchId, this.match.date, this.gametype.id, this.map.id);

        //TODO add gametype & map ids to weapons, CTF AND DOM TABLES
        await this.ctf.insertPlayerMatchData(this.players.players, this.matchId, this.gametype.id, this.map.id);
        await this.dom.insertPlayerMatchData(this.players.players, this.matchId, this.gametype.id, this.map.id);
       // await this.weapons.setWeaponIds();
        this.kills.setWeaponIds(this.weapons);
        this.kills.setPlayerIds(this.players);
        await this.kills.insertKills(this.matchId);
        
        // this.players.debugListAllPlayers();

        this.weapons.setPlayerStats(this.kills.kills, this.kills.suicides);
        await this.weapons.insertPlayerMatchStats(this.matchId, this.gametype.id, this.map.id);
        await this.weapons.updatePlayerTotals(this.players.players);


        await this.players.updatePlayerTotals(this.match.date, this.gametype.id, this.map.id);
        //await this.players.updatePlayerFullTotals();

        await this.ctf.updatePlayerTotals(this.players.players);


        await this.ctf.processFlagEvents(this.players, this.kills, this.matchId, this.map.id, this.gametype.id);
        await this.map.updateTotals();

        const uniquePlayerIds = this.players.getUniquePlayerIds();

        await calculateRankings(this.gametype.id, uniquePlayerIds);
        await calculateRankings(this.map.id, uniquePlayerIds, "map");
        

        const hashVars = [this.map.name, 
            this.gametype.name, 
            this.server.name, 
            this.match.date, 
            this.gametype.mutators,
            this.totalTeams,
            this.teamScores[0],
            this.teamScores[1],
            this.teamScores[2],
            this.teamScores[3],
            this.soloWinner,
            this.soloWinnerScore,
            this.gametype.targetScore,
            this.gametype.timeLimit
        ];



        await setMatchHash(this.matchId, hashVars.toString());


        await this.damageManager.insertMatchData(this.players.players, this.matchId, this.map.id, this.gametype.id);
        await this.damageManager.updatePlayerTotals(this.players.players, this.gametype.id);


        await this.players.updateMapAverages(this.gametype.id, this.map.id);
       
        //await calcPlayersMapResults(this.map.id, this.gametype.id);

        await this.weapons.updateMapTotals(this.map.id);

        await this.classicWeaponStats.insertMatchStats(this.matchId, this.map.id, this.gametype.id, this.players.players, this.weapons);


       // this.players.debugListAllPlayers();
    }


    preliminaryChecks(){


        this.bHardcore = false;

        const reg = /\d+\.\d+\tgame\thardcore\t(.+)\s/i;
        const result = reg.exec(this.rawData);

        const value = result[1].toLowerCase();

        if(value === "true") this.bHardcore = true;

        const startReg = /(\d+\.\d+)\tgame\trealstart\s/i;
        const startResult = startReg.exec(this.rawData);

        if(startResult === null) return;
        this.matchStart = scalePlaytime(parseFloat(startResult[1]), this.bHardcore);

        const endReg = /(\d+\.\d+)\tgame_end\t(.+?)\s/i
        const endResult = endReg.exec(this.rawData);

        if(endResult === null) return;

        if(endResult[2].toLowerCase() === "mapchange"){

            this.matchStart = -1;
            this.matchEnd = -1;
            this.bMapChangeEnd = true;
            return
        }

        this.matchEnd = scalePlaytime(parseFloat(endResult[1]), this.bHardcore);

    }


    parseLines(){

        if(this.matchStart === -1) return;
        if(this.matchEnd === -1) return;

        const logStandardReg = /^.+info\tLog_Standard\t(.+)$/i;

        //check if utstats-lite log because stat_player behaves differently(merges player stats into one for multiple reconnects) 

        const timestampReg = /^(\d+?\.\d+?)\t(.+)$/i;
        const playerReg =  /^player\t(.+)$/i;
        const statPlayerReg = /^stat_player\t(.+)$/i;

        const infoReg = /^info\t(.+)$/i;
        const gameReg = /^game\t(.+)$/i;        
        const mapReg = /^map\t(.+)$/i;
        const killReg = /^(kill|teamkill)\t(.+)$/i
        const suicideReg = /^suicide\t(.+)$/i;

        const teamScoreReg = /^teamscore\t(\d+)\t(.+)$/i;
        const headshotReg = /^headshot\t.+$/i;

        const firstBloodReg = /^first_blood\t(\d+)$/i;

        const ctfFlagReg = /^flag_(.+?)\t(.+)$/i;
        const domCapReg = /^controlpoint_capture\t.+$/i;

        const itemGetReg = /^item_get\t(.+)$/i;

        const liteReg = /lite/i;

        const classWeaponStatReg = /^weap_.+?\t(.+?)\t(\d+?)\t(.+?)$/i;

        for(let i = 0; i < this.lines.length; i++){
            
            const line = this.lines[i];

            //lazy way to get around fileEncoding info at start of file
            if(logStandardReg.test(line)){
  
                const result = logStandardReg.exec(line);
           
                if(liteReg.test(result[1])){
                    this.bUTStatsLiteLog = true;
                }
                if(result === null) throw new Error(`Failed to get log standard`);
    
            }

            const timestampResult = timestampReg.exec(line);

            if(timestampResult === null) continue;

            const timestamp = (this.bHardcore) ? parseFloat(scalePlaytime(timestampResult[1], this.bHardcore).toFixed(2)) : parseFloat(timestampResult[1]);
            const subString = timestampResult[2];

            if(classWeaponStatReg.test(timestampResult[2])){
                this.classicWeaponStats.addLine(timestamp, timestampResult[2]);
                this.weapons.parseLine(timestampResult[2]);
                continue;
            }

            

            if(playerReg.test(subString)){

                this.players.parseLine(timestamp, subString);
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


            if(statPlayerReg.test(subString)){
                //this.players.statLines.push({"timestamp": timestamp, "line": subString});
                this.players.parseStatLine(timestamp, subString);
                continue;
            }


            //ignore these events before realstart
            if(timestamp < this.matchStart) continue;

            if(headshotReg.test(subString)){

                this.kills.parseHeadshot(timestamp, subString);
                continue;
            }


            if(killReg.test(subString)){

                this.kills.parseLine(timestamp, subString);
                this.weapons.parseLine(subString);
                continue;
            }

            if(suicideReg.test(subString)){
                this.kills.parseSuicide(timestamp, subString);
                this.weapons.parseLine(subString);
                continue;
            }

            if(teamScoreReg.test(subString)){

                this.setTeamScores(teamScoreReg.exec(subString));
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


            if(this.damageManager.parseString(subString)){
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

