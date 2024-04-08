import { Player } from "./player.mjs";
import Message from "../message.mjs";
import { getPlayerMasterId, createMasterPlayer, insertPlayerMatchData } from "../players.mjs";

export class PlayerManager{

    constructor(){

        this.players = [];

        this.mergedPlayers = {};
    }

    parseLine(timestamp, line){

        const typeReg = /^player\t((.+?)\t.+)$/i;

        const playerNameReg = /^rename\t(.+)\t(\d+)$/i;
        const isABotReg = /^isabot\t(.+)\t(.+)$/i;
        const teamReg = /^team\t(\d+?)\t(\d+)$/i;
        const ipReg = /^ip\t(\d+?)\t(.+)$/i;
        const genericReg = /^(.+?)\t(\d+?)\t(.+)$/i;
        //87.97	player	Connect	Illana	16	False
        const connectReg = /^connect\t(.+?)\t(\d+)\t.+$/i;

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

        if(type === "connect"){

            const result = connectReg.exec(line);

            if(result === null) return;

            const playerName = result[1];

            this.setConnectionEvent(playerName);
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

    setConnectionEvent(playerName){

        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];

            if(p.name === playerName) p.connected();
        }
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

        player.stats[key] = value;
    }


    //lazy way for kills and other events, as kill data ids have not been merged into one
    setNonMergedPlayersMasterId(playerName, masterId){

        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];

            if(p.name === playerName) p.masterId = masterId;
        }
    }

    async setPlayerMasterIds(){

        for(const p of Object.values(this.mergedPlayers)){

            let masterId = await getPlayerMasterId(p.name, p.hwid, p.mac1, p.mac2);

            if(masterId === null){

                masterId = await createMasterPlayer(p.name, p.ip, p.hwid, p.mac1, p.mac2);

            }

            masterId = parseInt(masterId);
            if(masterId !== masterId) throw new Error(`Player masterId is not a valid integer`);

            p.masterId = masterId;
            //we need to make sure duplicates have there master ids set correctly
            this.setNonMergedPlayersMasterId(p.name, masterId);

        }
        
    }


    async insertPlayerMatchData(matchId){

        for(const p of Object.values(this.mergedPlayers)){

            await insertPlayerMatchData(p, matchId);
        }
    }


    debugListAllPlayers(){

        const players = [];

        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];

            players.push({
                "name": p.name,
                "hwid": p.hwid,
                "mac1": p.mac1,
                "mac2": p.mac2,
                "bSpectator": p.bSpectator,
                "multis": p.stats.multis,
                "sprees": p.stats.sprees
            });
        }

        console.log(players);
    }


    //ignore spectators
    getTotalUniquePlayers(){

        const uniqueNames = [];

        for(const p of Object.values(this.mergedPlayers)){
            if(p.bSpectator === 0 && p.bBot === 0) uniqueNames.push(p.name);
        }
    
        return uniqueNames.length;
    }



    getSoloWinner(){

        const mergedScores = {};

        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];

            if(p.bSpectator) continue;

            if(mergedScores[p.name] === undefined){
                mergedScores[p.name] = {"score": parseInt(p.stats.score), "deaths": parseInt(p.stats.deaths)};
            }else{
                mergedScores[p.name].score += parseInt(p.stats.score);
                mergedScores[p.name].deaths += parseInt(p.stats.deaths);
            }
        }

        const orderedPlayers = [];

        for(const [name, stats] of Object.entries(mergedScores)){

            orderedPlayers.push({
                "name": name,
                "score": stats.score,
                "deaths": stats.deaths
            });
        }

        orderedPlayers.sort((a, b) =>{

            if(a.score < b.score) return 1;
            if(a.score > b.score) return -1;
            if(a.deaths > b.deaths) return 1;
            if(a.deaths < b.deaths) return -1;

            return 0;
        });

        if(orderedPlayers.length === 0) return null;

        return {"name": orderedPlayers[0].name, "score": orderedPlayers[0].score};
    }


    mergePlayers(){

        const mergeKeys = [
            "score", "frags", "kills", "deaths",
            "suicides", "teamKills", "timeOnServer"
        ];

        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];

            if(this.mergedPlayers[p.name] === undefined){
                this.mergedPlayers[p.name] = p;
                this.mergedPlayers[p.name].merges = 1;
                this.mergedPlayers[p.name].totalEff = p.stats.efficiency;
                this.mergedPlayers[p.name].totalTTL = p.stats.ttl;
                continue;
            }

            const master = this.mergedPlayers[p.name];
            master.merges += 1;

            if(master.hwid === "") master.hwid = p.hwid;
            if(master.mac1 === "") master.mac1 = p.mac1;
            if(master.mac2 === "") master.mac2 = p.mac2;

            if(master.bHadConnectEvent || p.bHadConnectEvent) master.bHadConnectEvent = true;
            //if player played at any point don't mark them as a spectator even after reconnects
            if(master.bSpectator === 0 || p.bSpectator === 0) master.bSpectator = 0;

            master.stats.totalEff += p.stats.efficiency;
            master.stats.totalTTL += p.stats.ttl;

            if(master.stats.totalEff > 0){
                master.stats.efficiency = master.stats.totalEff / master.stats.merges;
            }

            if(master.stats.totalTTL > 0){
                master.stats.ttl = master.stats.totalTTL / master.stats.merges;
            }

            for(let x = 0; x < mergeKeys.length; x++){

                const type = mergeKeys[x];

                master.stats[type] += p.stats[type];
                
            }
        }
    }

    matchEnded(){

        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];
            p.matchEnded();
        }
    }
}