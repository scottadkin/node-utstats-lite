import { testInsertPlayerWeaponStats } from "../testWeaponDamage.mjs";

export default class TestWeaponDamage{

    constructor(){

        this.playerStats = {};
    }

    parseLine(line){

        //149.59	wd	13	enforcer	25

        const reg = /^wd\t(\d+)\t(.+)\t(\d+)$/i;
        const result = reg.exec(line);

        if(result === null) return false;


        const playerId = result[1];
        const weaponClass = result[2].toLowerCase();
        const damage = parseInt(result[3]);


        if(this.playerStats[playerId] === undefined){
            this.playerStats[playerId] = {};
        }

        if(this.playerStats[playerId][weaponClass] === undefined){

            this.playerStats[playerId][weaponClass] = {
                "damage": 0
            };
        }

        this.playerStats[playerId][weaponClass].damage += damage;
        return true;
    }

    async insertPlayerMatchData(matchId, playerManager){

        await testInsertPlayerWeaponStats(matchId, this.playerStats, playerManager);

    }
}

