import { bulkInserKills } from "../kills.mjs";
import { scalePlaytime } from "../generic.mjs";

export class KillsManager{

    constructor(){

        this.lines = [];

        this.kills = [];
        this.teamKills = [];
    }

    parseLine(timestamp, line){

        const reg = /^(kill|teamkill)\t(\d+?)\t(.+?)\t(\d+?)\t(.+?)\t(.+)$/i;

        const result = reg.exec(line);

        const killType = result[1].toLowerCase();
        const killerId = parseInt(result[2]);
        const killerWeapon = result[3];
        const victimId = parseInt(result[4]);
        const victimWeapon = result[5];

        const kill = {
            timestamp,
            killerId,
            killerWeapon,
            victimId,
            victimWeapon
        }

        if(killType === "kill"){
            this.kills.push(kill);
        }else{
            this.teamKills.push(kill);
        }
    }


    getId(weapons, name){
        
        for(const [weaponId, weaponName] of Object.entries(weapons)){
            if(weaponName === name) return parseInt(weaponId);
        }

        return null;
    }

    setWeaponIds(weapons){

        const types = ["kills", "teamKills"];

        for(let x = 0; x < types.length; x++){

            for(let i = 0; i < this[types[x]].length; i++){

                const k = this[types[x]][i];

                k.killerWeaponId = this.getId(weapons, k.killerWeapon);
                k.victimWeaponId =  this.getId(weapons, k.victimWeapon);
            }
        }
    }

    setPlayerIds(playerManager){

        const types = ["kills", "teamKills"];

        for(let x = 0; x < types.length; x++){

            for(let i = 0; i < this[types[x]].length; i++){

                const k = this[types[x]][i];

                const killer = playerManager.getPlayerById(k.killerId);
                const victim = playerManager.getPlayerById(k.victimId);

                k.killerMasterId = killer.masterId;
                k.victimMasterId = victim.masterId;
            }
        }
    }


    async insertKills(matchId){

        const allKills = [];

        const types = ["kills", "teamKills"];

        for(let x = 0; x < types.length; x++){

            for(let i = 0; i < this[types[x]].length; i++){

                const k = this[types[x]][i];

                k.type = x;

                allKills.push(k);
            }
        }

        await bulkInserKills(allKills, matchId);
    }


    /**
     * set players multi kills and sprees
     */
    setPlayerSpecialEvents(playerManager, bHardcore){

        for(let i = 0; i < this.kills.length; i++){

            const k = this.kills[i];

            const killer = playerManager.getPlayerById(k.killerId);
            const victim = playerManager.getPlayerById(k.victimId);

            let timestamp = k.timestamp;
            if(bHardcore) timestamp = scalePlaytime(timestamp);

            killer.killed(k.timestamp);
        }

        playerManager.matchEnded();
    }
}