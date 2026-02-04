import { Player } from "./player.mjs";
import Message from "../message.mjs";
import { getPlayerMasterId, createMasterPlayer, updateMasterPlayers, 
    updatePlayerTotals, bulkInsertPlayerMatchData, updateMapAverages } from "../players.mjs";
import geoip from "geoip-lite";
import { scalePlaytime } from "../generic.mjs";


export class PlayerManager{

    constructor(){

        this.players = [];

        this.renameHistory = [];

        this.idsToNames = {};
        this.namesToIds = {};
    }


    createPlayers(lines, matchStart, matchEnd, bHardcore){

        const namesToIds = {};
        const idsToNames = {};

        const timestampReg = /^(\d+?\.\d+?)\t(.+)$/i;
        const reg =  /^player\t(.+?)\t(.+)$/i;
        const renameReg = /^(.+)\t(\d+)$/i;
        const connectReg = /^(.+)\t(\d+?)\t.+$/i;

        const connectEvents = [];

        const targetKeys = ["connect", "disconnect", "rename"];

        for(let i = lines.length; i > 0; i--){


            const line = lines[i];

            const timestampResult = timestampReg.exec(line);

            if(timestampResult === null) continue;

            const timestamp = scalePlaytime(parseFloat(timestampResult[1]), bHardcore);

            const subString = timestampResult[2];

            const result = reg.exec(subString);

            if(result === null) continue;

            const type = result[1].toLowerCase();

            if(targetKeys.indexOf(type) === -1) continue;

            if(type === "rename"){

                const nameResult = renameReg.exec(result[2]);
                const playerId = parseInt(nameResult[2]);
                const playerName = nameResult[1].toLowerCase();

                if(namesToIds[playerName] === undefined){
                    namesToIds[playerName] = [playerId];
                }else{
                    namesToIds[playerName].push(playerId);
                }

                //we only care about the last used name for each id
                if(idsToNames[playerId] === undefined) idsToNames[playerId] = nameResult[1];

                connectEvents.unshift({
                    timestamp,
                    type,
                    "name": nameResult[1], 
                    "playerId": parseInt(nameResult[2])
                });
 
   
            }else if(type === "connect"){

                const cResult = connectReg.exec(result[2]);

                if(cResult === null) continue;

                connectEvents.unshift({
                    timestamp,
                    type,
                    "name": cResult[1], 
                    "playerId": parseInt(cResult[2])
                });
                

            }else if(type === "disconnect"){

                const playerId = parseInt(result[2]);

                connectEvents.unshift({type, timestamp, "playerId": playerId});
            }
        }





        for(let [playerId, playerName] of Object.entries(idsToNames)){
      
            playerId = parseInt(playerId);

            const player = this.getPlayerByName(playerName);

            if(player === null){
                this.players.push(new Player(playerName, playerId));
            }else{
                player.matchIds.push(playerId);
            }    
        }

        

        for(let i = 0; i < connectEvents.length; i++){

            const {timestamp, type, playerId} = connectEvents[i];
        
            const player = this.getPlayerById(playerId);

            if(player === null){
                new Message(`Player is null, playerManager->createPlayers()`, "error");
                continue;
            }

            if(type === "connect"){

                player.connected(timestamp, matchStart, playerId);

            }else if(type === "disconnect"){

                player.disconnect(timestamp, matchStart, playerId);
            }
        }


       for(let i = 0; i < this.players.length; i++){
 
            this.players[i].disconnect(matchEnd, matchStart, null);
       }
    }

    parseLine(timestamp, subString){

        const typeReg = /^player\t((.+?)\t.+)$/i;

        const playerNameReg = /^rename\t(.+)\t(\d+)$/i;
        const isABotReg = /^isabot\t(.+)\t(.+)$/i;
        const teamReg = /^team\t(\d+?)\t(\d+)$/i;
        const ipReg = /^ip\t(\d+?)\t(.+)$/i;
        const genericReg = /^(.+?)\t(\d+?)\t(.+)$/i;

        const typeResult = typeReg.exec(subString);

        if(typeResult === null) return;

        const type = typeResult[2].toLowerCase();
        const line = typeResult[1];

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


            const player = this.getPlayerById(playerId);

            if(player === null) return;


            if(teamId === 255 && player.team !== 255){
               // console.log(`Player was on a team but then went to spec`);
                return;  
            }

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


        if(type === "ping"){
            this.parsePing(line);
            return;
        }

        if(type === "teamchange"){
            this.parseTeamChange(timestamp, line);
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

    parseTeamChange(timestamp, line){

        const reg = /^teamchange\t(\d+?)\t(\d+)$/i;

        const result = reg.exec(line);

        if(result === null) return;

        const playerId = parseInt(result[1]);
        const team = parseInt(result[2]);

        const player = this.getPlayerById(playerId);

        if(player === null){

            //this.addPlayer(timestamp, "", playerId);
            //new Message(`Failed to get player by id ${playerId}, parseTeamChange()`,"warning");
            return;
        }

        player.changeTeam(team, timestamp);
    }

    parsePing(line){

        const reg = /^ping\t(\d+?)\t(\d+)$/i;

        const result = reg.exec(line);

        if(result === null) return;

        const playerId = parseInt(result[1]);
        const ping = parseInt(result[2]);

        if(ping === 0) return;

        const player = this.getPlayerById(playerId);

        if(player === null){
            //sometimes ping with playerid 0 is logged even though there is no player connected yet?
            if(playerId === 0) return;
            new Message(`Failed to get player by id ${playerId}, parsePing()`,"warning");
            return;
        }

        player.pings.push(ping);

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

                return;
                type = "timeOnServer";
                break;
            }
        }

        if(type === "teamKills") return;

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

        id = parseInt(id);

        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];

            if(p.matchIds.indexOf(id) !== -1) return p;

        }

        return null;
    }

    setConnectionEvent(playerId, timestamp){

        const player = this.getPlayerById(playerId);

        if(player === null){
            new Message(`Failed to get player by id setConnectionEvent`,"warning");
            return;
        }

        player.connected(timestamp, true)
        
    }

    setDisconnectEvent(playerId, timestamp){

        const player = this.getPlayerById(playerId);

        if(player === null){
            new Message(`Failed to get player by id setDisconnectEvent`,"warning");
            return;
        }

        player.disconnect(timestamp);
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

        if(key === "timeOnServer") value = parseFloat(value);

        if(player === null){
            new Message(`Failed to get player by id ${playerId}, setPlayerStatProperty()`,"error");
            return;
        } 
;

        player.stats[key] = value;
    }

    async setPlayerMasterIds(matchDate){

        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];

            //console.log(p.name);

            let masterId = await getPlayerMasterId(p.name);

            if(masterId === null){

                masterId = await createMasterPlayer(p.name);

            }

            masterId = parseInt(masterId);
            if(masterId !== masterId) throw new Error(`Player masterId is not a valid integer`);

            p.masterId = masterId;

        }
        
    }


    //change to bulkinsert
    async insertPlayerMatchData(matchId, matchDate, gametypeId, mapId){

        await bulkInsertPlayerMatchData(this.players, matchId, matchDate, gametypeId, mapId);

    }


    debugListAllPlayers(){

        const players = [];

        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];

            players.push({
                "name": p.name,
                "playtime": p.playtime,
                "hwid": p.hwid,
                "mac1": p.mac1,
                "mac2": p.mac2,
                "bSpectator": p.bSpectator,
               // "multis": p.stats.multis,
                //"sprees": p.stats.sprees,
               // "ctf": p.stats.ctf
            });
        }

        console.log(players);
    }


    //ignore spectators
    getTotalUniquePlayers(totalTeams){

        const uniqueNames = [];

        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];

            if(p.playtime === 0) continue;

            //players set to spectators by a mutator?
            if(totalTeams > 1 && p.team === 255) continue;
            
            if(p.bSpectator === 1 && p.playtime === 0) continue;

            if(p.bBot === 0){
                uniqueNames.push(p.name);
            }

            if(p.bBot === 1 && !this.bIgnoreBots){
                uniqueNames.push(p.name);
            }
        }  
        
        return uniqueNames.length;
    }



    getSoloWinner(totalTeams){

        if(totalTeams >= 2) return {"id": 0, "score": 0};

        const basicPlayers = [];

        for(let i = 0; i < this.players.length; i++){
            const p = this.players[i];
            basicPlayers.push({"id": p.masterId, "score": parseInt(p.stats.score), "deaths": parseInt(p.stats.deaths)});
        }
        

        basicPlayers.sort((a, b) =>{

            if(a.score > b.score) return -1;
            if(a.score < b.score) return 1;

            if(a.deaths < b.score) return 1;
            if(a.deaths > b.score) return -1;
            return 0;
        });

        if(basicPlayers.length > 0){
            return basicPlayers[0];
        }

        return {"id": 0, "score": 0}
    }


    getFinalName(oldName){

        if(this.renameHistory.length === 0) return oldName;

        let lastName = null;

        for(let i = 0; i < this.renameHistory.length; i++){

            const h = this.renameHistory[i];

            if(h.oldName.toLowerCase() === oldName.toLowerCase()){
                lastName = h.newName;
            }
        }

        if(lastName !== null) return lastName;

        return oldName;
    }

    matchEnded(matchStart, matchEnd){

        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];
            p.matchEnded(matchStart, matchEnd);
        }
    }


    setCountries(){

        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];
            const lookup = geoip.lookup(p.ip);

            if(lookup !== null && lookup.country !== undefined){
                p.country = lookup.country.toLowerCase();
            }
            
        }
    }

    async updatePlayerTotals(date, gametypeId, mapId){

        const masterIds = [];
        const idsToCountries = {};

        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];

            if(p.playtime > 0){
                masterIds.push(p.masterId);
                idsToCountries[p.masterId] = p.country;
            }
        }

        await updateMasterPlayers(masterIds, idsToCountries, date);

        await updatePlayerTotals(masterIds);
        
    }

    setPlayerPingStats(){

        for(let i = 0; i < this.players.length; i++){

            const player = this.players[i];

            if(player.playtime === 0) continue;

            let total = 0;
            let min = -1;
            let avg = -1;
            let max = -1;

            for(let i = 0; i < player.pings.length; i++){

                const p = player.pings[i];

                if(i === 0 || p < min){
                    min = p;
                }

                if(i === 0 || p > max){
                    max = p;
                }

                total += p;
            }

            if(total !== 0 && player.pings.length > 0){
                avg = Math.round(total / player.pings.length);
            }

            player.ping.min = min;
            player.ping.avg = avg;
            player.ping.max = max;
        }
    }


    /**
     * Only get players with playtime
     */
    getUniquePlayerIds(){

        const found = [];

        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];

            if(p.playtime > 0) found.push(p.masterId);

        }

        return found;
    }

    getPlayerTeamAt(playerId, timestamp){

        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];

            if(p.matchIds.indexOf(playerId) !== -1) return p.getTeamAt(timestamp);
        }

        return null;
    }


    async updateMapAverages(gametypeId, mapId){

        const playerIds = this.getUniquePlayerIds();

        await updateMapAverages(playerIds, gametypeId, mapId);
    }


    setMatchResult(teamScores, soloWinner){

        if(soloWinner !== 0){

            for(let i = 0; i < this.players.length; i++){

                const p = this.players[i];

                if(p.playtime === 0) continue;

                if(p.masterId === soloWinner){
                    p.matchResult = "w";
                }else{
                    if(p.playtime !== 0) p.matchResult = "l";
                }
            }

            return;
        }

        let winningTeams = [];
        let winningTeamScore = 0;

        for(let i = 0; i < teamScores.length; i++){

            const t = teamScores[i];
            if(i === 0 || t > winningTeamScore){
                winningTeamScore = t;
                winningTeams = [i];
                continue;
            }

            if(t === winningTeamScore) winningTeams.push(i);
        }

        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];

            if(p.playtime === 0) continue;

            if(winningTeams.length === 1 && winningTeams.indexOf(p.team) !== -1){
                p.matchResult = "w";
                continue;
            }

            if(winningTeams.length > 1 && winningTeams.indexOf(p.team) !== -1){

                p.matchResult = "d";
                continue;
            }


            p.matchResult = "l";
        }
    }

}
