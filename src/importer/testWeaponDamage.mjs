import Message from "../message.mjs";
import { testInsertPlayerWeaponStats } from "../testWeaponDamage.mjs";
import { removeDoubleEnforcer } from "../generic.mjs";

export default class TestWeaponDamage{

    constructor(playerManager, weaponsManager){

        this.uniqueWeapons = new Set(); 
        this.playerManager = playerManager;
        this.weaponsManager = weaponsManager;
        this.playerStats = {};
    }

    parseLine(line){

        //149.59	wd	13	enforcer	25

        const reg = /^wd\t(\d+)\t(.+)\t(\d+)$/i;
        const result = reg.exec(line);

        if(result === null) return false;


        const playerId = result[1];
        const weaponName = removeDoubleEnforcer(result[2]);

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

    /**
     * merge duplicate match players into one object
     */
    createMasterPlayersData(){

        const masterData = {};

        for(const [playerId, playerStats] of Object.entries(this.playerStats)){

            const player = this.playerManager.getPlayerById(playerId);

            if(player === null) process.exit();
            
            const pId = player.masterId;

            if(masterData[pId] === undefined){

                masterData[pId] = {};
            }

            for(const [weaponName, weaponData] of Object.entries(playerStats)){

                const weaponId = this.weaponsManager.getId(weaponName);

                if(weaponId === null){
                    new Message(`weaponId is null createMasterPlayersData, looking for ${weaponName}`,"warning");
                    continue;
                }

                //console.log(`weaponId ${weaponId}`);

                if(masterData[pId][weaponId] === undefined){
                    masterData[pId][weaponId] = weaponData;
                    continue;
                }

                masterData[pId][weaponId].damage += weaponData.damage;
                //console.log("merge", `added ${weaponData.damage} to weaponId ${weaponId}`);
            }
        }


        return masterData;
    }

    async insertPlayerMatchData(matchId){


        const finalData = this.createMasterPlayersData();

        await testInsertPlayerWeaponStats(matchId, this.playerStats, this.playerManager);

    }
}

