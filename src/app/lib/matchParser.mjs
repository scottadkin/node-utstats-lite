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

        this.matchStart = -1;
        this.matchEnd = -1;
        this.matchLength = 0;
        this.totalTeams = 0;
        this.teamScores = [0,0,0,0];
        this.soloWinner = 0;
        this.soloWinnerScore = 0;


        //check if utstats-lite log because stat_player behaves differently(merges player stats into one for multiple reconnects) 
        this.bUTStatsLiteLog = false;
        

        //scale timestamps at the start for hardcore instead of over and over in different methodd
        this.setBHardcore();

        this.parseLines();

    }

    setBHardcore(){

        this.bHardcore = false;

        //0.00	game	HardCore	True

        const reg = /^\d+?\.\d+?\tgame\thardcore\t(.+)$/igm;

        const result = reg.exec(this.rawData);

        if(result === null) return;

        const value = result[1].toLowerCase();

        if(value === "true") this.bHardcore = true;
    }

    async main(){

        if(this.matchStart === -1){
            new Message(`There was no match start event in this log.`, "error");
            throw new Error("NO START");
        }

        if(this.matchEnd === -1){
            new Message(`There was no match end event in this log.`, "error");
            throw new Error("NO END");
        }

        this.matchLength = this.matchEnd - this.matchStart;

        /*if(this.gametype.bHardcore){
            this.matchLength = scalePlaytime(this.matchLength, true);
        }*/
        

        if(this.matchLength < this.minPlaytime){

            new Message(`Match length is shorter than minPlaytime (${this.minPlaytime} seconds).`,"error");
            throw new Error("MIN PLAYTIME");
        }   


        this.players.bIgnoreBots = this.bIgnoreBots;


        this.kills.setAllDeaths();
        //append (insta) if game is instagib
        this.gametype.updateName();

        //console.log(this.ctf.flags);
        this.ctf.setPlayerStats(this.players, this.kills);
        await this.dom.setPointIds();
        this.dom.setPlayerCapStats(this.players);
        
        this.kills.setPlayerSpecialEvents(this.players, this.gametype.bHardcore);
        this.items.setPlayerStats(this.players);

        this.damageManager.setPlayerDamage(this.players);

        await this.weapons.setWeaponIds();

        this.classicWeaponStats.setPlayerStats(this.weapons, this.players);


        this.players.mergePlayers(this.matchStart, this.bUTStatsLiteLog, this.totalTeams, this.classicWeaponStats.bFoundData);
        
        this.players.setPlayerPingStats();

        this.players.setCountries();
        this.players.matchEnded(this.matchStart, this.matchEnd);
        this.players.setPlayerPlaytime(this.matchStart, this.matchEnd, this.totalTeams);

        const totalPlayers = this.players.getTotalUniquePlayers(this.totalTeams);

        if(totalPlayers < this.minPlayers){
            new Message(`Match has less then the minimum players limit (found ${totalPlayers} out of a target of ${this.minPlayers}).`,"error");
            throw new Error("MIN PLAYERS");
        }        
       
        //this.players.scalePlaytimes(this.gametype.bHardcore);


        await this.players.setPlayerMasterIds(this.match.date);

        const soloStats = this.players.getSoloWinner(this.totalTeams);

        if(soloStats !== null){

            this.soloWinner = soloStats.id;
            this.soloWinnerScore = soloStats.score;
        }

        await this.server.setId();
        await this.gametype.setId(this.totalTeams, totalPlayers, this.bAppendTeamSizes);
        await this.map.setId();


        //serverId, gametypeId, mapId, date, players
        this.matchId = await createMatch(
            this.server.id, 
            this.gametype.id, 
            this.map.id, 
            this.gametype.bHardcore,
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

        await this.players.insertPlayerMatchData(this.matchId, this.match.date, this.gametype.id, this.map.id);

        //TODO add gametype & map ids to weapons, CTF AND DOM TABLES
        await this.ctf.insertPlayerMatchData(this.players, this.matchId, this.gametype.id, this.map.id);
        await this.dom.insertPlayerMatchData(this.players.players, this.matchId, this.gametype.id, this.map.id);
       // await this.weapons.setWeaponIds();
        this.kills.setWeaponIds(this.weapons);
        this.kills.setPlayerIds(this.players);
        await this.kills.insertKills(this.matchId);
        
        // this.players.debugListAllPlayers();

        this.weapons.setPlayerStats(this.kills.kills, this.kills.suicides);
        await this.weapons.insertPlayerMatchStats(this.matchId, this.gametype.id, this.map.id);
        await this.weapons.updatePlayerTotals(this.players.mergedPlayers);


        await this.players.updatePlayerTotals(this.match.date);
        //await this.players.updatePlayerFullTotals();

        await this.ctf.updatePlayerTotals(this.players);


        await this.ctf.processFlagEvents(this.players, this.kills, this.matchId, this.map.id, this.gametype.id, this.gametype.bHardcore);
        await this.map.updateTotals();

        const validMergedPlayerIds = this.players.getMergedPlayerIds();

        await calculateRankings(this.gametype.id, validMergedPlayerIds);
        await calculateRankings(this.map.id, validMergedPlayerIds, "map");
        

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


        await this.damageManager.insertMatchData(this.players, this.matchId, this.map.id, this.gametype.id);
        await this.damageManager.updatePlayerTotals(this.players, this.gametype.id);


        await this.players.updateMapAverages(this.gametype.id, this.map.id);
        await this.weapons.updateMapTotals(this.map.id);

        await this.classicWeaponStats.insertMatchStats(this.matchId, this.map.id, this.gametype.id, this.players, this.weapons);



    }

    parseLines(){

        const test = this.rawData;

        const lineReg = /^(.+?)$/img;
        const lines = test.match(lineReg);

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

        const endReg = /^game_end\t.+$/i;

        const firstBloodReg = /^first_blood\t(\d+)$/i;

        const ctfFlagReg = /^flag_(.+?)\t(.+)$/i;
        const domCapReg = /^controlpoint_capture\t.+$/i;

        const itemGetReg = /^item_get\t(.+)$/i;

        const liteReg = /lite/i;

        const classWeaponStatReg = /^weap_.+?\t(.+?)\t(\d+?)\t(.+?)$/i;

        for(let i = 0; i < lines.length; i++){
            
            const line = lines[i];

            //lazy way to get around fileEncoding info at start of file
            if(logStandardReg.test(lines[i])){
  
                const result = logStandardReg.exec(lines[i]);
           
                if(liteReg.test(result[1])){
                    this.bUTStatsLiteLog = true;
                }
                if(result === null) throw new Error(`Failed to get log standard`);
    
            }

            const timestampResult = timestampReg.exec(line);

            if(timestampResult === null) continue;

            const timestamp = (this.bHardcore) ? parseFloat(scalePlaytime(timestampResult[1], this.bHardcore).toFixed(2)) : parseFloat(timestampResult[1]);
            
            if(classWeaponStatReg.test(timestampResult[2])){
                this.classicWeaponStats.addLine(timestamp, timestampResult[2]);
                continue;
            }

            const subString = timestampResult[2];

            if(playerReg.test(subString)){

                //this.players.lines.push({"timestamp": timestamp, "line": subString});

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


            if(statPlayerReg.test(subString)){
                //this.players.statLines.push({"timestamp": timestamp, "line": subString});
                this.players.parseStatLine(timestamp, subString);
                continue;
            }

            if(endReg.test(subString)){
                this.matchEnd = timestamp;
                continue;
            }

            if(this.matchStart !== -1 && headshotReg.test(subString)){

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

