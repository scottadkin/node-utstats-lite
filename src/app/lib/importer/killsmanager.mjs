import { bulkInserKills } from "../kills.mjs";
import { removeDoubleEnforcer } from "../generic.mjs";

export class KillsManager{

    constructor(){

        this.lines = [];

        this.kills = [];
        this.teamKills = [];
        this.headshots = [];
        this.suicides = [];

        //all deaths used for CTF
        this.deaths = [];

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


    parseSuicide(timestamp, line){

        const suicideReg = /^suicide\t(\d+)\t(.+?)\t.+$/i;

        const result = suicideReg.exec(line);

        if(result === null) return;

        const playerId = parseInt(result[1]);

        const weapon =  removeDoubleEnforcer(result[2]);

        this.suicides.push({"timestamp": parseFloat(timestamp), "playerId": playerId, "weapon": weapon});
    }


    setWeaponIds(weapons){

        const types = ["kills", "teamKills", "suicides"];

        for(let x = 0; x < types.length; x++){

            for(let i = 0; i < this[types[x]].length; i++){

                const k = this[types[x]][i];
                
                if(x !== 2){
                    k.killerWeaponId = weapons.getId(k.killerWeapon);
                    k.victimWeaponId =  weapons.getId(k.victimWeapon);
                }else{
                    k.weaponId = weapons.getId(k.weapon);
                }
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


        for(let i = 0; i < this.suicides.length; i++){

            const s = this.suicides[i];

            const player = playerManager.getPlayerById(s.playerId);

            s.playerMasterId = player.masterId;
            
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

            //let timestamp = k.timestamp;
            //if(bHardcore) timestamp = scalePlaytime(timestamp);

            killer.killed(k.timestamp);
            victim.died(k.timestamp);
        }


        for(let i = 0; i < this.teamKills.length; i++){

            const k = this.teamKills[i];

            const killer = playerManager.getPlayerById(k.killerId);
            const victim = playerManager.getPlayerById(k.victimId);

            let timestamp = k.timestamp;
            //if(bHardcore) timestamp = scalePlaytime(timestamp);

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



    setAllDeaths(){

        for(let i = 0; i < this.kills.length; i++){

            const k = this.kills[i];
            this.deaths.push({"timestamp": k.timestamp, "victim": k.victimId, "killer": k.killerId, "bTeamKill": false});
        }

        for(let i = 0; i < this.teamKills.length; i++){

            const k = this.teamKills[i];
            this.deaths.push({"timestamp": k.timestamp, "victim": k.victimId, "killer": k.killerId, "bTeamKill": true});
        }

        for(let i = 0; i < this.suicides.length; i++){

            const s = this.suicides[i];

            this.deaths.push({"timestamp": s.timestamp, "victim": s.playerId});
        }


        this.deaths.sort((a, b) =>{

            a = a.timestamp;
            b = b.timestamp;

            if(a < b) return -1;
            if(a > b) return 1;
            return 0;
        });
    }

    getDeath(timestamp, playerId){

        for(let i = 0; i < this.deaths.length; i++){

            const d = this.deaths[i];

            if(d.timestamp > timestamp) return null;

            if(d.timestamp === timestamp && d.victim === playerId){
                return d;
            }
        }

        return null;
    }


    getTypeBetween(type, start, end){

        const data = [];

        let events = [];

        if(type === "kills"){
            events = this.kills;
        }else if(type === "suicides"){
            events = this.suicides;
        }

        for(let i = 0; i < events.length; i++){

            const k = events[i];

            if(k.timestamp < start) continue;
            if(k.timestamp > end) break;


            
            

            if(type === "kills"){

                const killerTeam = this.playerManager.getPlayerTeamAt(k.killerId, k.timestamp);
                const victimTeam = this.playerManager.getPlayerTeamAt(k.victimId, k.timestamp);

                data.push({
                    "timestamp": k.timestamp, 
                    "killer": k.killerMasterId, 
                    "victim": k.victimMasterId, 
                    "killerTeam": killerTeam, 
                    "victimTeam": victimTeam
                });

            }else if(type === "suicides"){

                const playerTeam = this.playerManager.getPlayerTeamAt(k.playerId, k.timestamp);

                data.push({
                    "timestamp": k.timestamp, 
                    "player": k.playerMasterId,
                    "playerTeam": playerTeam, 
                });
            }

            
        }


        return data;
    }


    getKillsBetween(start, end){

        return this.getTypeBetween("kills", start, end);    
    }

    getSuicidesBetween(start, end){
        return this.getTypeBetween("suicides", start, end);
    }
}