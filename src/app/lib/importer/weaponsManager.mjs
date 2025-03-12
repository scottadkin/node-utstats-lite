import { getWeaponId, createWeapon, bulkInsertMatchWeaponStats, updatePlayerTotals, calcMapWeaponsTotals } from "../weapons.mjs";
import { removeDoubleEnforcer } from "../generic.mjs";

export class WeaponsManager{

    constructor(){

        this.tempNames = [];
        this.weapons = {};

        this.playerStats = {};
    }


    addWeaponToTempNames(weaponName){

        const weapon = removeDoubleEnforcer(weaponName);
        if(this.tempNames.indexOf(weapon) === -1) this.tempNames.push(weapon);
    }

    //do this just in case there is no kill/death events
    classicAddWeaponNameFromLine(line){
 
        const reg = /^weap_.+?\t(.+?)\t\d+?\t.+?$/i;

        const result = reg.exec(line);

        if(result === null) return;

        this.addWeaponToTempNames(result[1]);
    }

    parseLine(line){

        const reg = /^(kill|teamkill)\t\d+?\t(.+?)\t\d+?\t(.+?)\t.+$/i;

        const result = reg.exec(line);
        
        if(result === null){

            const suicideReg = /^suicide\t(\d+?)\t(.+?)\t.+$/i;
            const sResult = suicideReg.exec(line);

            if(sResult === null){
                this.classicAddWeaponNameFromLine(line);
                return;
            }

            //const weapon = removeDoubleEnforcer(sResult[2]);
           // if(this.tempNames.indexOf(weapon) === -1) this.tempNames.push(weapon);
            this.addWeaponToTempNames(sResult[2]);
            return;
        }

        //const killType = result[1].toLowerCase();
        const killerWeapon = removeDoubleEnforcer(result[2]);
        const victimWeapon = removeDoubleEnforcer(result[3]);

        if(this.tempNames.indexOf(killerWeapon) === -1) this.tempNames.push(killerWeapon);
        if(this.tempNames.indexOf(victimWeapon) === -1) this.tempNames.push(victimWeapon);
    }

    async setWeaponIds(){

        for(let i = 0; i < this.tempNames.length; i++){

            let name = this.tempNames[i];

            let id = await getWeaponId(name);

            if(id === null){
                id = await createWeapon(name);
            }

            this.weapons[id] = name;
        }
    }

    getPlayerWeaponStats(playerId, weaponId){

        if(this.playerStats[playerId] === undefined){
            this.playerStats[playerId] = {};
        }

        if(this.playerStats[playerId][weaponId] === undefined){

            this.playerStats[playerId][weaponId] = {
                "kills": 0,
                "deaths": 0,
                "teamKills": 0,
                "suicides": 0
            };
        }

        return this.playerStats[playerId][weaponId];
    }

    setPlayerStats(kills, suicides){

        for(let i = 0; i < kills.length; i++){

            const k = kills[i];

            const killerStats = this.getPlayerWeaponStats(k.killerMasterId, k.killerWeaponId);
            const victimStats = this.getPlayerWeaponStats(k.victimMasterId, k.victimWeaponId);

            if(k.type === 0){
                killerStats.kills++;
            }else if(k.type === 1){
                killerStats.teamKills++;
            }
            
            victimStats.deaths++;       
        }

        for(let i = 0; i < suicides.length; i++){

            const s = suicides[i];

            const weaponStats = this.getPlayerWeaponStats(s.playerMasterId, s.weaponId);

            weaponStats.suicides++;
        }
    }


    async insertPlayerMatchStats(matchId, gametypeId, mapId){

        await bulkInsertMatchWeaponStats(this.playerStats, matchId, gametypeId, mapId);
    }

    async updatePlayerTotals(players){

        const playerIds = [];

        for(const player of Object.values(players)){

            playerIds.push(player.masterId);
        }

        await updatePlayerTotals(playerIds);
    }

    async updateMapTotals(mapId){

        await calcMapWeaponsTotals(mapId);
    }

    getId(name){
        
        for(const [weaponId, weaponName] of Object.entries(this.weapons)){
            if(weaponName === name) return parseInt(weaponId);
        }

        return null;
    }
}