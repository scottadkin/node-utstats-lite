import { simpleQuery, bulkInsert } from "./database.mjs";


export async function insertPlayerMatchData(playerManager, matchId){

    const query = `INSERT INTO nstats_match_ctf (
    match_id,player_id,flag_taken,flag_pickup,flag_drop,
    flag_assist,flag_cover,flag_seal,flag_cap,flag_kill,
    flag_return,flag_return_base,flag_return_mid,
    flag_return_enemy_base,flag_return_save) VALUES ?`;

    const insertVars = [];

    for(const player of Object.values(playerManager.mergedPlayers)){
        
        const s = player.stats.ctf;

        insertVars.push([
            matchId, player.masterId, s.taken, s.pickedup, s.dropped,
            s.assist, s.cover, s.seal, s.capture, s.kill,
            s.return, s.returnBase, s.returnMid, s.returnEnemyBase,
            s.returnSave 
        ]);
    }


    await bulkInsert(query, insertVars);
}

