import { getWeaponId, createWeapon, bulkInsertMatchWeaponStats, updatePlayerTotals } from "../weapons.mjs";
import { removeDoubleEnforcer } from "../generic.mjs";

export class WeaponsManager{

    constructor(){

        this.tempNames = [];
        this.weapons = {};

        this.playerStats = {};
    }


    parseLine(line){

        const reg = /^(kill|teamkill)\t\d+?\t(.+?)\t\d+?\t(.+?)\t.+$/i;

        const result = reg.exec(line);

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
                "teamKills": 0
            };
        }

        return this.playerStats[playerId][weaponId];
    }

    setPlayerStats(kills){

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
}