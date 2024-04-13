import { bulkInserKills } from "../kills.mjs";
import { scalePlaytime, removeDoubleEnforcer } from "../generic.mjs";

export class KillsManager{

    constructor(){

        this.lines = [];

        this.kills = [];
        this.teamKills = [];
        this.headshots = [];
        this.firstBloodId = -1;
    }

    parseLine(timestamp, line){

        const reg = /^(kill|teamkill)\t(\d+?)\t(.+?)\t(\d+?)\t(.+?)\t(.+)$/i;
    
        const result = reg.exec(line);

        if(result === null){
            this.parseHeadshot(timestamp, line);
            return;
        }

        const killType = result[1].toLowerCase();
        const killerId = parseInt(result[2]);
        const killerWeapon = removeDoubleEnforcer(result[3]);
        const victimId = parseInt(result[4]);
        const victimWeapon = removeDoubleEnforcer(result[5]);

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

    parseHeadshot(timestamp, line){

        const reg = /^headshot\t(\d+?)\t.+$/i;

        const result = reg.exec(line);

        if(result === null) return;

        this.headshots.push({
            "timestamp": timestamp,
            "killerId": parseInt(result[1])
        });
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
     * set players multi kills, sprees, and headshots
     */
    setPlayerSpecialEvents(playerManager, bHardcore){

        for(let i = 0; i < this.kills.length; i++){

            const k = this.kills[i];

            const killer = playerManager.getPlayerById(k.killerId);
            const victim = playerManager.getPlayerById(k.victimId);

            let timestamp = k.timestamp;
            if(bHardcore) timestamp = scalePlaytime(timestamp);

            killer.killed(k.timestamp);
            victim.died(k.timestamp);
        }


        for(let i = 0; i < this.teamKills.length; i++){

            const k = this.teamKills[i];

            const killer = playerManager.getPlayerById(k.killerId);
            const victim = playerManager.getPlayerById(k.victimId);

            let timestamp = k.timestamp;
            if(bHardcore) timestamp = scalePlaytime(timestamp);

            //dont count team kills for sprees and multis
            //killer.killed(k.timestamp);
            killer.teamKill();
            victim.died(k.timestamp);
        }


        for(let i = 0; i < this.headshots.length; i++){

            const h = this.headshots[i];
            const killer = playerManager.getPlayerById(h.killerId);
            killer.headshot();
        }

        //playerManager.matchEnded();

        if(this.firstBloodId !== -1){
            const firstBloodPlayer = playerManager.getPlayerById(this.firstBloodId);

            if(firstBloodPlayer !== null){
                firstBloodPlayer.bFirstBlood = 1;
            }
        }
    }


    setFirstBloodId(id){
        this.firstBloodId = parseInt(id);
    }
}