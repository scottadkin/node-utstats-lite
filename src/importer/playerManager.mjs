import { Player } from "./player.mjs";
import Message from "../message.mjs";
import { updateMasterPlayers, 
    updatePlayerTotals, bulkInsertPlayerMatchData, updateMapAverages, 
    getMultiplePlayersMasterId,
    getHWIDForceNames,
    getForcedByMacNames,
    getForceNamesByBoth,
    bulkInsertPlayerForceRenameHistory,
    autoAssignHWIDToName
} from "../players.mjs";
import geoip from "geoip-lite";
import { createRandomString, scalePlaytime } from "../generic.mjs";
import { bImportRandomizeNames } from "../../config.mjs";


export class PlayerManager{

    constructor(bAutoAssignHWIDToName){

        this.players = [];

        this.renameHistory = [];

        this.idsToNames = {};
        this.playerNames = [];
        this.bAutoAssignHWIDToName = bAutoAssignHWIDToName;

        this.nameOverrideHistory = [];
    }



    rename(timestamp, mainResult, idsToNames, namesToIds, connectEvents){

        let playerName = "PLAYER";
        let playerId = -1;

        //normal rename/connect not broken by random chars in name
        const normalReg = /^\t(.+?)\t(\d+)$/i;
        const brokenReg = /^(.+?)(\d+)$/i;

        if(normalReg.test(mainResult[1])){

            const result = normalReg.exec(mainResult[1]);

            playerName = result[1];
            playerId = parseInt(result[2]);

        }else if(brokenReg.test(mainResult[1])){

            const result = brokenReg.exec(mainResult[1]);

            playerName = result[1];
            playerId = parseInt(result[2]);

        }else{

            new Message(`rename normalreg and brokenreg didn't work`, "error");
            return;
            //throw new Error(`rename normalreg and brokenreg didn't work`);
        }

        if(namesToIds[playerName] === undefined){
            namesToIds[playerName] = [playerId];
        }else{
            namesToIds[playerName].push(playerId);
        }

        //we only care about the last used name for each id
        if(idsToNames[playerId] === undefined) idsToNames[playerId] = playerName;

        connectEvents.unshift({
            timestamp,
            "type": "rename",
            "name": playerName, 
            "playerId": playerId
        });
    }

    connect(timestamp, mainResult, connectEvents){

        const normalReg = /^\t(.+?)\t(\d+)\t.+$/i;
        const brokenReg = /^(.+?)(\d+)\t.+$/i;

        let playerName = "PLAYER";
        let playerId = -1;


        if(normalReg.test(mainResult[1])){

            const result = normalReg.exec(mainResult[1]);

            playerName = result[1];
            playerId = result[2];

        }else if(brokenReg.test(mainResult[1])){

            const result = brokenReg.exec(mainResult[1]);
            playerName = result[1];
            playerId = result[2];

        }else{
            throw new Error(`Both normalReg and brokenReg failed to match`);
        }

        connectEvents.unshift({
            timestamp,
            "type": "connect",
            "name": playerName, 
            "playerId": parseInt(playerId)
        });
    }

    createPlayers(lines, matchStart, matchEnd, gameSpeed){

        const namesToIds = {};
        const idsToNames = {};

        const timestampReg = /^(\d+?\.\d+?)\t(.+)$/i;
        const reg = /^player\t(.+?)\t(.+)$/i;
        //const renameReg = /^(.+)\t(\d+)$/i;
        //const connectReg = /^(.+)\t(\d+?)\t.+$/i;


        const renameReg2 = /^player\trename(.+)$/i;
        const connectReg2 = /^player\tconnect(.+)$/i;

        const connectEvents = [];

        const targetKeys = ["disconnect"];

        for(let i = lines.length; i > 0; i--){


            const line = lines[i];

            const timestampResult = timestampReg.exec(line);

            if(timestampResult === null) continue;
            
            const timestamp = scalePlaytime(parseFloat(timestampResult[1]), gameSpeed);

            const subString = timestampResult[2];


            //work around rename/connects with weird characters
            if(renameReg2.test(subString)){

                const nameResult = renameReg2.exec(subString);
                this.rename(timestamp, nameResult, idsToNames, namesToIds, connectEvents);

                continue;

            }else if(connectReg2.test(subString)){

                const connectResult = connectReg2.exec(subString);

                this.connect(timestamp, connectResult, connectEvents);
                continue;
            }

            const result = reg.exec(subString);

            if(result === null) continue;
 
            const type = result[1].toLowerCase();

            if(targetKeys.indexOf(type) === -1){

                continue;
            }

            if(type === "disconnect"){

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

            const p = this.players[i];
    
            this.playerNames.push(p.name);
            p.disconnect(matchEnd, matchStart, null);

            if(bImportRandomizeNames){

                const index = this.playerNames.indexOf(p.name);

                p.name = createRandomString(20);

                if(index !== -1){
                    this.playerNames[index] = p.name;
                }else{
                    new Message(`Failed to find this.playerNames index for value ${p.name}`,"warning");
                }          
            }
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


        player.stats[key] = value;
    }

    getAllHWIDS(){

        const found = new Set();

        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];

            if(p.hwid === "" || p.hwid.toLowerCase() === "n/a") continue;

            found.add(p.hwid.toUpperCase());
        }


        return [...found];

    }

    getAllMACs(){

        const found = new Set();

        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];

            if(p.mac1 !== ""){
                found.add(p.mac1);
     
            }

            if(p.mac2 !== ""){
                found.add(p.mac2);
    
            }
        }


        return [...found];
    }


    getNamesByHWID(hwids){

        if(hwids.length === 0) return {};

        const data = {};

        for(let x = 0; x < this.players.length; x++){

            const p = this.players[x];

            if(p.hwid === "") continue;
            
            if(hwids.indexOf(p.hwid) !== -1){
                data[p.hwid] = p.name;
            }
       
        }

        return data;
    }


    fixDuplicateOverrideNames(names){

        const total = Object.values(names).length;
        const unique = new Set(Object.keys(names));

        console.log(unique);
        console.log(unique.size, total);

        if(total === unique.size) return;

        new Message(`${total - unique.size} Duplicate Names Found!`,"warning");

        const inUse = [];

        for(const [key, value] of Object.entries(names)){

            if(inUse.indexOf(value.toLowerCase()) !== -1){

                console.log("ALREADY IN USE");
            }
        }
    }

    async forceHWIDNames(){

        const hwids = this.getAllHWIDS();

        const hwidForceNames = await getHWIDForceNames(hwids);

        const missing = [...hwids];

        for(const key of Object.keys(hwidForceNames)){

            const index = missing.indexOf(key);
            if(index === -1) continue;

            missing.splice(index, 1);

        }

        if(this.bAutoAssignHWIDToName && missing.length > 0){

            const missingNamesToHWIDs = this.getNamesByHWID(missing);

            for(const [hwid, name] of Object.entries(missingNamesToHWIDs)){

                hwidForceNames[hwid] = await autoAssignHWIDToName(hwid, name);
            }  
        }

        //console.log(hwidForceNames);
        //this.fixDuplicateOverrideNames(hwidForceNames);

        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];

            //hwid and mac combo has highest priority
            if(p.bNameForcedByHWIDAndMAC) continue;

            if(hwidForceNames[p.hwid] === undefined){
                //this.playerNames.push(p.name);
                p.bNameForcedByHWID = false;
                continue;
            }

            new Message(`Force player name by HWID ${p.name} changed to ${hwidForceNames[p.hwid]}`,"note");
            this.nameOverrideHistory.push({"oldName": p.name, "newName": hwidForceNames[p.hwid], "type": "HWID"});
            this.updatePlayerNamesList(p.name, hwidForceNames[p.hwid]);
            p.name = hwidForceNames[p.hwid];
            p.bNameForcedByHWID = true;
           
        }
    }

    updatePlayerNamesList(oldName, newName){

        const index = this.playerNames.indexOf(oldName);

        if(index === -1){
            new Message(`Could not find name in player list`,"error");
            return;
        }

        this.playerNames[index] = newName;
    }

    async forceMACNames(){

        const macs = this.getAllMACs();

        const forcedData = await getForcedByMacNames(macs);


        forcedData.sort((a, b) =>{

            a = a.name;
            b = b.name;

            if(a === "FORCE BY MAC BOTH" && b === "FORCE BY MAC SINGLE"){
                return -1;
            }else if(a === "FORCE BY MAC SINGLE" && b === "FORCE BY MAC BOTH"){
                return 1;
            }
            return 0;
        });

        for(let i = 0; i < forcedData.length; i++){

            const forced = forcedData[i];

            for(let x = 0; x < this.players.length; x++){

                const p = this.players[x];

                //highest priority
                if(p.bNameForcedByHWIDAndMAC) continue;
                //hwid has higher priority
                if(p.bNameForcedByHWID) continue;
                //2 mac address combination has higher priority
                if(p.bNameForcedByMACCombination) continue;

                //only do the first single MAC match and ignore the rest
                //if(p.bNameForcedBySingleMAC) continue;

                if(p.mac1 === "" && p.mac2 === "") continue;

                if(p.mac1 === ""){
                    //new Message("mac1 can't be an empty string", "warning");
                    continue;
                }

                if(p.mac1 !== forced.mac1 && p.mac2 !== forced.mac1 && p.mac1 !== forced.mac2 && p.mac2 !== forced.mac1){
                    continue;
                }


                if(forced.mac2 === ""){
                    new Message(`MAC single address forced name, applied to ${p.name}, changed to ${forced.name}`,"note");

                    

                    this.nameOverrideHistory.push({"oldName": p.name, "newName": forced.name, "type": "MAC-SINGLE"});
                    this.updatePlayerNamesList(p.name, forced.name);
                    p.name = forced.name;
                    p.bNameForcedBySingleMAC = true;
                    continue;
                }

                const currentMacs = [p.mac1, p.mac2];

                const bFoundM1 = currentMacs.indexOf(forced.mac1) !== -1;
                const bFoundM2 = currentMacs.indexOf(forced.mac2) !== -1;


                if(bFoundM1 && bFoundM2){

                    new Message(`MAC addresses combination forced name, applied to ${p.name}, changed to ${forced.name}`,"note");
                    this.nameOverrideHistory.push({"oldName": p.name, "newName": forced.name, "type": "MAC-BOTH"});
                    this.updatePlayerNamesList(p.name, forced.name);
                    p.name = forced.name;    
                    p.bNameForcedByMACCombination = true;
                    continue;
                }
                
                // This won't be needed, can't have partial matches
                /*if(bFoundM1 || bFoundM2){
                    new Message(`MAC single address forced name, applied to ${p.name}, changed to ${forced.name}`,"note");
                    p.name = forced.name;
                    p.bNameForcedBySingleMAC = true;
                }*/
                
            }
        }

    }


    async forceHWIDAndMACNames(){

        const targets = [];

        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];

            //always need a HWID
            if(p.hwid === "") continue;
            //mac1 cant be an empty string
            if(p.mac1 === "") continue;

            targets.push({"hwid": p.hwid, "mac1": p.mac1, "mac2": p.mac2});
        }


        const result = await getForceNamesByBoth(targets);

        if(result.length === 0) return;

        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];

            for(let x = 0; x < result.length; x++){

                const r = result[x];

                if(p.hwid === "") continue;

                if(p.hwid !== r.hwid) continue;
                if(p.mac1 === "") continue;
                if(p.mac1 !== r.mac1 && p.mac1 !== r.mac2) continue;
                if(p.mac2 !== r.mac1 && p.mac2 !== r.mac2) continue;

                new Message(`Force name by HWID and MAC addresses, ${p.name} changed to ${r.name}`,"note");
                this.nameOverrideHistory.push({"oldName": p.name, "newName": r.name, "type": "HWID-MAC"});
                this.updatePlayerNamesList(p.name, r.name);
                p.name = r.name;
                p.bNameForcedByHWIDAndMAC = true;
            }
        }

    }


    setForceNameHistoryPlayerId(name, masterId){

        name = name.toLowerCase();

        for(let i = 0; i < this.nameOverrideHistory.length; i++){

            const h = this.nameOverrideHistory[i];

            if(h.newName.toLowerCase() === name){

                h.playerId = masterId;
                //return;
            }
        }

    }

    async setPlayerMasterIds(){

        await this.forceHWIDAndMACNames();

        await this.forceHWIDNames();

        await this.forceMACNames();

        const masterIds = await getMultiplePlayersMasterId(this.playerNames);

        
        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];

            for(let x = 0; x < masterIds.length; x++){

                if(masterIds[x].name === p.name){
                    p.masterId = masterIds[x].id;
                    this.setForceNameHistoryPlayerId(p.name, p.masterId);
                    break;
                }
            }
        } 
    }


    //change to bulkinsert
    async insertPlayerMatchData(matchId, matchDate, gametypeId, mapId){

        await bulkInsertPlayerMatchData(this.players, matchId, matchDate, gametypeId, mapId);

        await bulkInsertPlayerForceRenameHistory(matchId, this.nameOverrideHistory);

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

        if(totalTeams >= 2) return null;

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

    async updatePlayerTotals(){

        const masterIds = [];
        const idsToCountries = {};

        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];

            if(p.playtime > 0){
                masterIds.push(p.masterId);
                idsToCountries[p.masterId] = p.country;
            }
        }

        return await Promise.all([updateMasterPlayers(masterIds, idsToCountries), updatePlayerTotals(masterIds)]);
        
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


    async updateMapAverages(gametypeId, mapId, bCTF, bDom){

        const playerIds = this.getUniquePlayerIds();

        await updateMapAverages(playerIds, gametypeId, mapId, bCTF, bDom);
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
