import { simpleQuery, bulkInsert } from "../database.mjs";
import Message from "../message.mjs";


export default class DamageManager{

    constructor(){

        this.data = {};
    }

    parseString(string){

        //              pid,   damageDelt taken selfdamage teamdamagedelt teamdamagetaken falldamage drowndamage caannondamaage
        const reg = /^d\t(\d+?)\t(\d+?)\t(\d+?)\t(\d+?)\t(\d+?)\t(\d+?)\t(\d+?)\t(\d+?)\t(\d+)$/i;
    
        const result = reg.exec(string);
    
        if(result === null) return false;
    
        const playerId = parseInt(result[1]);
        const damageDelt = parseInt(result[2]);
        const damageTaken = parseInt(result[3]);
        const selfDamage = parseInt(result[4]);
        const teamDamageDelt = parseInt(result[5]);
        const teamDamageTaken = parseInt(result[6]);
        const fallDamage = parseInt(result[7]);
        const drownDamage = parseInt(result[8]);
        const cannonDamage = parseInt(result[9]);


        this.data[playerId] = {
            damageDelt,
            damageTaken,
            selfDamage,
            teamDamageDelt,
            teamDamageTaken,
            fallDamage,
            drownDamage,
            cannonDamage
        };
    
        return true;
    }

    setPlayerDamage(playerManager){

        for(const [playerId, damageData] of Object.entries(this.data)){

            const player = playerManager.getPlayerById(playerId);

            if(player === null){
                new Message(`setPlayerDamage player is null`,"warning");
                continue;
            }

            player.damageData = damageData;
        }
    }

    async insertMatchData(playerManager, matchId){

        const insertVars = [];

        const query = `INSERT INTO nstats_damage_match 
        (player_id,match_id,damage_delt,damage_taken,self_damage,team_damage_delt,team_damage_taken,fall_damage,drown_damage,cannon_damage) VALUES ?`;

        for(const p of Object.values(playerManager.mergedPlayers)){

            const d = p.damageData;

            if(d === undefined) continue;

            insertVars.push([
                p.masterId,
                matchId,
                d.damageDelt,
                d.damageTaken,
                d.selfDamage,
                d.teamDamageDelt,
                d.teamDamageTaken,
                d.fallDamage,
                d.drownDamage,
                d.cannonDamage
            ]);
        }

        await bulkInsert(query, insertVars);
    }

}
