import { removeDoubleEnforcer } from "../generic.mjs";
import { bulkInsertMatchStats } from "../classicWeaponStats.mjs";

//TODO: fix double enforcer stats overriding single

export default class ClassicWeaponStats{

    constructor(){

        this.bFoundData = false;

        this.lines = [];

        // playerID => weaponId => weaponStats
        this.data = {};

    }

    addLine(timestamp, subString){
        
        this.bFoundData = true;
        this.lines.push({"timestamp": timestamp, "data": subString});
      
    }


    updateAccuracy(stats){

        if(stats.shots === 0 || stats.hits === 0){
            stats.accuracy = 0;
            return;
        }

        if(stats.shots > 0 && stats.hits > 0){
            stats.accuracy = stats.hits / stats.shots * 100;
            return;
        }
    }

    setPlayerStats(weaponsManager, playerManager){

        const classicWeaponStatReg = /^weap_(.+?)\t(.+?)\t(\d+?)\t(.+?)$/i;

        for(let i = 0; i < this.lines.length; i++){

            const {data} = this.lines[i];

            const result = classicWeaponStatReg.exec(data);

            if(result === null) continue;

            const type = result[1];
            const name = removeDoubleEnforcer(result[2]);
            const playerId = parseInt(result[3]);
            const value = result[4];

            const weaponId = weaponsManager.getId(name);     

            if(weaponId === null){
                throw new Error(`weaponId is null! classicWeaponStats, ${name}`);
            }     

            const player = playerManager.getPlayerById(playerId);

            if(player === null){
                throw new Error(`Player is null! classicWeaponStats`);
            }

            const pStats = player.classicWeaponStats;


            if(pStats[weaponId] === undefined){

                pStats[weaponId] = {
                    "shots": 0,
                    "hits": 0,
                    "accuracy": 0,
                    "damage": 0
                };
            }
            const stats = pStats[weaponId];

            if(type === "accuracy") stats.accuracy = parseFloat(value);

            if(type === "damagegiven"){
                stats.damage += parseInt(value);
            }

            if(type === "shotcount"){
                stats.shots += parseInt(value);
                this.updateAccuracy(stats);
            }

            if(type === "hitcount"){
                stats.hits += parseInt(value);
                this.updateAccuracy(stats);
            }
        }

        
        //this.data.push({"timestamp": timestamp, "data": subString});
    }


    async insertMatchStats(matchId, mapId, gametypeId, playerManager, weaponsManager){



        await bulkInsertMatchStats(matchId, mapId, gametypeId, playerManager, weaponsManager);
        
    }
}