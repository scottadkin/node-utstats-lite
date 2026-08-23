import Message from "../message.mjs";
import { insertPlayerDamageWeaponStats } from "../playerWeaponDamage.mjs";
import { removeDoubleEnforcer } from "../generic.mjs";

export default class PlayerWeaponDamage{

    constructor(playerManager, weaponsManager){

        this.uniqueWeapons = new Set(); 
        this.playerManager = playerManager;
        this.weaponsManager = weaponsManager;
        this.bFoundData = false;
        this.playerStats = {};
    }

    parseLine(line){

        //149.59	wd	13	enforcer	25

        const reg = /^wd\t(\d+)\t(.+)\t(\d+)$/i;
        const result = reg.exec(line);

        if(result === null) return false;

        this.bFoundData = true;
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

                masterData[pId] = {
                    "0": {
                        "damage": 0
                    }
                };
            }

            for(const [weaponName, weaponData] of Object.entries(playerStats)){

                const weaponId = this.weaponsManager.getId(weaponName);

                if(weaponId === null){
                    new Message(`weaponId is null createMasterPlayersData, looking for ${weaponName}`,"warning");
                    continue;
                }

                //console.log(`weaponId ${weaponId}`);

                //combined total
                masterData[pId][0].damage += weaponData.damage;

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

    async insertPlayerMatchData(matchId, gametypeId, mapId){


        if(!this.bFoundData) return;
        const finalData = this.createMasterPlayersData();

        await insertPlayerDamageWeaponStats(matchId, gametypeId, mapId, finalData, this.playerManager);

    }
}

