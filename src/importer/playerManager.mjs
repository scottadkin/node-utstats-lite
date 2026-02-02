import { Player } from "./player.mjs";
import Message from "../message.mjs";
import { getPlayerMasterId, createMasterPlayer, updateMasterPlayers, 
    updatePlayerTotals, bulkInsertPlayerMatchData, updateMapAverages } from "../players.mjs";
import geoip from "geoip-lite";


export class PlayerManager{

    constructor(){

        this.players = [];

        this.mergedPlayers = {};


        this.renameHistory = [];

        this.idsToNames = {};
        this.namesToIds = {};
    }


    createPlayers(lines){

        const testPlayers = [];

        const namesToIds = {};
        const idsToNames = {};

        const timestampReg = /^(\d+?\.\d+?)\t(.+)$/i;
        const reg =  /^player\t(.+?)\t(.+)$/i;
        const renameReg = /^(.+)\t(\d+)$/i;
        const connectReg = /^(.+)\t(\d+?)\t.+$/i;
        const disConnectReg = /^(.+)\t(\d+?)$/i;

   
        const connectEvents = [];

        const targetKeys = ["connect", "disconnect", "rename"];

        for(let i = lines.length; i > 0; i--){

           // console.log(lines[i]);

            const line = lines[i];

            const timestampResult = timestampReg.exec(line);

            if(timestampResult === null) continue;

            const timestamp = parseFloat(timestampResult[1]);

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
                if(idsToNames[playerId] === undefined){

                    idsToNames[playerId] = nameResult[1];

                }

                connectEvents.push({
                    timestamp,
                    type,
                    "name": nameResult[1], 
                    "playerId": parseInt(nameResult[2])
                });
                //const player = this.getTestPlayer(testPlayers, playerId);

                //if(player === null){
                  //  testPlayers.push(new TestPlayer(playerId, nameResult[1]));
                //}
                continue;

            }else if(type === "connect"){

                //connectEvents.push(line);
                //console.log(connectReg.exec(result[2]));

                const cResult = connectReg.exec(result[2]);

                if(cResult === null) continue;

                console.log(cResult);
                //const playerName = cResult[1].toLowerCase();
                //const playerId = parseInt(cResult[2]);
                connectEvents.push({
                    timestamp,
                    type,
                    "name": cResult[1], 
                    "playerId": parseInt(cResult[2])
                });
                

            }else if(type === "disconnect"){

                //if disconnect before match start time set to spectator
            }

        }





        for(let [playerId, playerName] of Object.entries(idsToNames)){
            console.log(playerId, playerName);
            playerId = parseInt(playerId);
            const player = this.getPlayerByName(playerName);

            if(player === null){
                this.players.push(new Player(playerName, playerId));
            }else{
                player.matchIds.push(playerId);
            }

            
           // this.players.push(new Player());
        }

        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];
            console.log(p.name, p.matchIds);
        }
       // process.exit();
        //console.log(connectEvents);
        console.log(connectEvents);
        process.exit();
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

        const disconnectReg = /^disconnect\t(\d+)$/i;

        const typeResult = typeReg.exec(line);

        if(typeResult === null) return;

        const type = typeResult[2].toLowerCase();
        line = typeResult[1];

        /*if(type === "rename"){

            const result = playerNameReg.exec(line);
            if(result === null) return;

            this.namesToIds[result[1]] = parseInt(result[2]);
            //set bSPectator to true and on the connect event set to true(rename always happens before connect, but no connect for spectators)
            this.addPlayer(timestamp, result[1], parseInt(result[2]), true);
            return;
        }*/

        if(type === "connect"){

            const result = connectReg.exec(line);

            if(result === null) return;

            this.setConnectionEvent(parseInt(result[2]), timestamp);
            return;
        }

        if(type === "disconnect"){

            const result = disconnectReg.exec(line);

            if(result === null) return;

            this.setDisconnectEvent(parseInt(result[1]), timestamp);
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

       // create player if not exists, just set id set name and everything else to null

        id = parseInt(id);

        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];

            if(p.matchIds.indexOf(id) !== -1) return p;

            //if(p.id === id) return p;
        }

        return null;
    }

    /*addPlayer(timestamp, name, playerId, bSpectator){

        if(bSpectator === undefined) bSpectator = false;
        const testPlayer = this.getPlayerById(playerId);

        

        this.idsToNames[playerId] = name;

        if(testPlayer !== null){
            //process.exit();

            this.renameHistory.push({"playerId": playerId, "newName": name});
            testPlayer.name = name;
           // testPlayer.connected(timestamp);
            return;
        }

        this.players.push(new Player(timestamp, name, playerId));
    }*/

    setConnectionEvent(playerId, timestamp){

        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];

            if(p.id === playerId) p.connected(timestamp, true);
        }
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


    //lazy way for kills and other events, as kill data ids have not been merged into one
    setNonMergedPlayersMasterId(playerName, masterId){

        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];

            if(p.name === playerName) p.masterId = masterId;
        }
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


        await bulkInsertPlayerMatchData(this.mergedPlayers, matchId, matchDate, gametypeId, mapId);

        /*for(const p of Object.values(this.mergedPlayers)){

            await insertPlayerMatchData(p, matchId, matchDate);
        }*/
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
                "sprees": p.stats.sprees,
                "ctf": p.stats.ctf
            });
        }

        console.log(players);
    }


    //ignore spectators
    getTotalUniquePlayers(totalTeams){

        const uniqueNames = [];

        for(const p of Object.values(this.mergedPlayers)){

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
        
        for(const p of Object.values(this.mergedPlayers)){
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

    getLastUsedIndexByName(name){

        let max = -1;

        for(let [key, value] of Object.entries(this.idsToNames)){

            if(value !== name) continue;

            key = parseInt(key);

            if(key > max){
                max = key;
            }
        }

        return max;
    }


    //if a player joins the match as player and leaves before start the improter doesn't correct them as a spectator if they rejoin
    fixBSpectator(player, matchStart, totalTeams){

       /* if(player.connectEvents.length > 0){

            const last = player.connectEvents[player.connectEvents.length - 1];

            //if there is no connect event after the last disconnect event player was never active during matchtime
            if(last.type === "disconnect" && last.timestamp < matchStart){
                player.bSpectator = 1;
            }
        }

        console.log(player.disconnects[player.disconnects.length - 1], player.connects[player.connects.length - 1], player.name);*/

        player.bSpectator = 1;

        for(let i = 0; i < player.connectEvents.length; i++){

            const c = player.connectEvents[i];

            if(c.type === "connect"){
                player.bSpectator = 0;
            }else{
                if(c.timestamp < matchStart) player.bSpectator = 1;
            }

           // if(c.type === "connect")
        }

    }

    mergePlayers(matchStart, bUTStatsLiteLog, totalTeams, bFoundClassicWeaponData){

        //so old utstats logs still can import
        const legacyMergeKeys = ["frags", "kills", "deaths",
            "suicides", "teamKills"];

        //utstats lite merges everything but score mutator side

        let mergeKeys = [
            "score", "headshots"
        ];

        //we want all stat_player stuff to merge for old utstats
        if(!bUTStatsLiteLog){
            mergeKeys = [...mergeKeys, ...legacyMergeKeys];
        }


        const intTypes = [
            "score", "frags", "kills", "deaths",
            "suicides", "teamKills"
        ];
        
        const spreeMergeKeys = [
            "spree", "rampage", "dominating", "unstoppable", "godlike"
        ];

        const multiMergeKeys = [
            "double", "multi", "ultra", "monster"
        ];

        let ctfKeys = [];

        if(this.players.length > 0){

            ctfKeys = Object.keys(this.players[0].stats.ctf);

            const carryIndex = ctfKeys.indexOf("flagCarryTime");

            if(carryIndex !== -1){
                ctfKeys.splice(carryIndex, 1);
            }
        }


        const damageKeys = [
            "damageDelt",
            "damageTaken",
            "selfDamage",
            "teamDamageDelt",
            "teamDamageTaken",
            "fallDamage",
            "drownDamage",
            "cannonDamage"
        ];


        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];


            const finalName = this.idsToNames[p.id];    


            if(this.mergedPlayers[finalName] === undefined){
                this.mergedPlayers[finalName] = p;
                this.mergedPlayers[finalName].merges = 1;
                this.mergedPlayers[finalName].totalEff = parseFloat(p.stats.efficiency);
                this.mergedPlayers[finalName].totalTTL = parseFloat(p.stats.ttl);

                //if(p.playtime === 0) this.mergedPlayers[finalName].bSpectator = 0;

                //forgot to set this... :/
                if(!p.bHadConnectEvent){
                    this.mergedPlayers[finalName].bSpectator = 1;
                }


                this.fixBSpectator(this.mergedPlayers[finalName], matchStart);

                //if(p.playtime === 0) this.mergedPlayers[finalName].bSpectator = 1;
               // if(p.stats.timeOnServer > 0) this.mergedPlayers[finalName].bSpectator = 0;
                continue;
            }

            const master = this.mergedPlayers[finalName];
            master.merges += 1;

            if(master.hwid === "") master.hwid = p.hwid;
            if(master.mac1 === "") master.mac1 = p.mac1;
            if(master.mac2 === "") master.mac2 = p.mac2;

            if(master.bHadConnectEvent || p.bHadConnectEvent){
                //master.bHadConnectEvent = 1;
                master.bSpectator = 0;
            }else if(!master.bHadConnectEvent && !p.bHadConnectEvent){
                master.bSpectator = 1;
            }
            //if player played at any point don't mark them as a spectator even after reconnects
            if(master.bSpectator === 0 || p.bSpectator === 0) master.bSpectator = 0;


            master.team = p.team;
            
            
            //merge basic stats events
            for(let x = 0; x < mergeKeys.length; x++){

                const type = mergeKeys[x];

                if(intTypes.indexOf(type) !== -1){

                    master.stats[type] = parseInt(master.stats[type]);
                    master.stats[type] += parseInt(p.stats[type]);   
                }else{
                    master.stats[type] += p.stats[type];   
                }   
            }

            for(let x = 0; x < multiMergeKeys.length; x++){

                const type = multiMergeKeys[x];

                master.stats.multis[type] += p.stats.multis[type];
            }

            if(p.stats.multis.best > master.stats.multis.best){
                master.stats.multis.best = p.stats.multis.best;
            }

            if(p.stats.sprees.best > master.stats.sprees.best){
                master.stats.sprees.best = p.stats.sprees.best;
            }

            for(let x = 0; x < spreeMergeKeys.length; x++){

                const type = spreeMergeKeys[x];

                master.stats.sprees[type] += p.stats.sprees[type];
            }

            for(let x = 0; x < ctfKeys.length; x++){

                const type = ctfKeys[x];

                master.stats.ctf[type] += p.stats.ctf[type];
            }
            

            //
            if(master.stats.ctf.flagCarryTime.min > p.stats.ctf.flagCarryTime.min){

                master.stats.ctf.flagCarryTime.min = p.stats.ctf.flagCarryTime.min;
            }

            if(master.stats.ctf.flagCarryTime.max < p.stats.ctf.flagCarryTime.max){

                master.stats.ctf.flagCarryTime.max = p.stats.ctf.flagCarryTime.max;
            }

            master.stats.ctf.flagCarryTime.total += p.stats.ctf.flagCarryTime.total;


            for(const [pointId, pointCaps] of Object.entries(p.stats.dom.controlPoints)){
                
                if(master.stats.dom.controlPoints[pointId] === undefined){
                    master.stats.dom.controlPoints[pointId] = 0;
                }

                master.stats.dom.controlPoints[pointId] += pointCaps;
            }

            for(const [itemType, timesUsed] of Object.entries(p.stats.items)){

                master.stats.items[itemType] += timesUsed;
            }


            if(master.stats.kills > 0){

                if(master.stats.deaths > 0){
                    master.stats.efficiency = master.stats.kills / (master.stats.kills + master.stats.deaths) * 100;
                }else{
                    master.stats.efficiency = 100;
                }
            }else{
                master.stats.efficiency = 0;
            }


            if(master.stats.totalTTL > 0){
                master.stats.ttl = master.stats.totalTTL / master.stats.merges;
            }

            master.pings = [...master.pings, ...p.pings];

            master.connects = [... new Set([...master.connects, ...p.connects])];

            master.disconnects = [... new Set([...master.disconnects, ...p.disconnects])];

            master.connectEvents = [...master.connectEvents, ...p.connectEvents];
            
            //console.log(this.bDisconnectBeforeMatchStart(master, matchStart));

            //if(master.stats.timeOnServer > 0) master.bSpectator = 0;


            for(let x = 0; x < damageKeys.length; x++){

                const d = damageKeys[x];

                if(p.damageData === undefined) break;

                if(master.damageData === undefined){
                    master.damageData = p.damageData;
                    continue;
                }

                master.damageData[d] += p.damageData[d];
            }

            master.teamChanges = [...master.teamChanges, ...p.teamChanges];

            master.matchResult = p.matchResult;


            //classic utstats weapon stats
            if(bFoundClassicWeaponData){

                const mWS = master.classicWeaponStats;
                const masterWeaponKeys = Object.keys(master.classicWeaponStats);

                for(const [weaponId, weaponStats] of Object.entries(p.classicWeaponStats)){

                    const wIndex = masterWeaponKeys.indexOf(weaponId);

                    if(wIndex === -1){

                        mWS[weaponId] = weaponStats;
                        continue;

                    }else{


                        mWS[weaponId].shots += parseInt(weaponStats.shots);
                        mWS[weaponId].hits += parseInt(weaponStats.hits);
                        mWS[weaponId].damage += parseInt(weaponStats.damage);

                        let acc = 0;

                        if(mWS[weaponId].hits > 0){

                            if(mWS[weaponId].shots > 0){
                                acc = mWS[weaponId].hits / mWS[weaponId].shots * 100;
                            }else{
                                acc = 100;
                            }
                        }
                        mWS[weaponId].accuracy = acc;
                    }
                }
            }


            this.fixBSpectator(master, matchStart, totalTeams);
        }  



        for(const [name, playerData] of Object.entries(this.mergedPlayers)){

            //get around utstatslite behav
            if(playerData.merges > 1 && bUTStatsLiteLog){


                const lastUsedId = this.getLastUsedIndexByName(name);


                if(lastUsedId === playerData.id) continue;


                const latestData = this.getPlayerById(lastUsedId);

                playerData.stats.frags = parseInt(latestData.stats.frags);
                playerData.stats.kills = parseInt(latestData.stats.kills);
                playerData.stats.deaths = parseInt(latestData.stats.deaths);
                playerData.stats.suicides = parseInt(latestData.stats.suicides);
                playerData.stats.teamKills = parseInt(latestData.stats.teamKills);
                //playerData.stats.kills = latestData.stats.efficiency;


            if(playerData.stats.kills > 0){

                    if(playerData.stats.deaths > 0){
                        playerData.stats.efficiency = playerData.stats.kills / (playerData.stats.kills + playerData.stats.deaths) * 100;

                    }else{
                        playerData.stats.efficiency = 100;
                    }
                }else{
                    playerData.stats.efficiency = 0;
                }
            
            }
        }

    }

    matchEnded(matchStart, matchEnd){

        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];
            p.matchEnded(matchStart, matchEnd);
        }
    }


    setCountries(){

        for(const p of Object.values(this.mergedPlayers)){

            const lookup = geoip.lookup(p.ip);

            if(lookup !== null){
                if(lookup.country !== undefined) p.country = lookup.country.toLowerCase();
            }
        }
    }

    setPlayerPlaytime(matchStart, matchEnd, totalTeams){

        for(const p of Object.values(this.mergedPlayers)){

            p.setPlaytime(matchStart, matchEnd, totalTeams);
        }
    }

    /*scalePlaytimes(bHardcore){

        if(bHardcore === 0) return;

        for(const player of Object.values(this.mergedPlayers)){

            player.playtime = scalePlaytime(player.playtime, bHardcore);
        }
    }*/

    async updatePlayerTotals(date, gametypeId, mapId){

        const masterIds = [];
        const idsToCountries = {};

        for(const p of Object.values(this.mergedPlayers)){
            
            if(p.bSpectator === 0){
                masterIds.push(p.masterId);
                idsToCountries[p.masterId] = p.country;
            }
        }

        await updateMasterPlayers(masterIds, idsToCountries, date);

        await updatePlayerTotals(masterIds, gametypeId, mapId);
        
    }
    /**
     * Update totals that are used for player profiles
     */
    async updatePlayerFullTotals(){
        
    }


    setPlayerPingStats(){

        for(const player of Object.values(this.mergedPlayers)){

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


    getMergedPlayerIds(){

        const ids = [];

        for(const player of Object.values(this.mergedPlayers)){

            if(player.bSpectator === 1 && player.stats.timeOnServer === 0) continue;

            if(player.bBot === 0){
                ids.push(player.masterId);
            }

            if(player.bBot === 1 && !this.bIgnoreBots){
                ids.push(player.masterId);
            }
        }

        return ids;
    }

    getPlayerTeamAt(playerId, timestamp){

        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];

            if(p.id === playerId) return p.getTeamAt(timestamp);
        }

        return null;
    }


    async updateMapAverages(gametypeId, mapId){

        const playerIds = new Set();

        for(const player of Object.values(this.mergedPlayers)){

            playerIds.add(player.masterId);
        }

        await updateMapAverages([...playerIds], gametypeId, mapId);
    }


    setMatchResult(teamScores, soloWinner){

        if(soloWinner !== 0){

            for(const player of Object.values(this.mergedPlayers)){

                if(player.masterId === soloWinner){
                    player.matchResult = "w";
                }else{
                    if(player.playtime !== 0) player.matchResult = "l";
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

        for(const player of Object.values(this.mergedPlayers)){

            if(player.bSpectator === 1) continue;

            if(winningTeams.length === 1 && winningTeams.indexOf(player.team) !== -1){
                player.matchResult = "w";
                continue;
            }

            if(winningTeams.length > 1 && winningTeams.indexOf(player.team) !== -1){

                player.matchResult = "d";
                continue;
            }


            player.matchResult = "l";
        }
    }

}
