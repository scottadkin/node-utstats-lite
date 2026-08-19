import { testInsertPlayerWeaponStats } from "../testWeaponDamage.mjs";

export default class TestWeaponDamage{

    constructor(weaponsManager){

        this.uniqueWeapons = new Set(); 
        this.weaponsManager = weaponsManager;
        this.playerStats = {};
    }

    parseLine(line){

        //149.59	wd	13	enforcer	25

        const reg = /^wd\t(\d+)\t(.+)\t(\d+)$/i;
        const result = reg.exec(line);

        if(result === null) return false;


        const playerId = result[1];
        const weaponName = result[2];
        const damage = parseInt(result[3]);

        this.weaponsManager.addWeaponToTempNames(weaponName);

        this.uniqueWeapons.add(weaponName);

        if(this.playerStats[playerId] === undefined){
            this.playerStats[playerId] = {};
        }

        if(this.playerStats[playerId][weaponName] === undefined){

            this.playerStats[playerId][weaponName] = {
                "damage": 0
            };
        }

        this.playerStats[playerId][weaponName].damage += damage;
        return true;
    }

    async insertPlayerMatchData(matchId, playerManager){


        /*const damageWeapons = [...this.uniqueWeapons];

        

        for(let i = 0; i < damageWeapons.length; i++){

            console.log(weaponManager.getId(damageWeapons[i]), damageWeapons[i]);

            thisaddWeaponToTempNames(damageWeapons[i]);
        }*/

       // await weaponManager.set

        for(const [playerId, playerStats] of Object.entries(this.playerStats)){

            
        }

        await testInsertPlayerWeaponStats(matchId, this.playerStats, playerManager);

    }
}

