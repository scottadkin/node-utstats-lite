import { bulkInsert, simpleQuery, sqlInsertOnDuplicateUpdate } from "./database.mjs";
import Message from "./message.mjs";


export async function insertPlayerDamageWeaponStats(matchId, gametypeId, mapId, playerStats, playerManager){

    const insertVars = [];

    for(const [playerId, stats] of Object.entries(playerStats)){


        for(const [weaponId, damage] of Object.entries(stats)){

            const player = playerManager.getPlayerByMasterId(playerId);
            if(player === null){
                new Message(`Failed to getPlayer: playerWeaponDamage.insertPlayerDamageWeaponStats`, "warning");
                continue;
            }
            insertVars.push([matchId, player.playtime, gametypeId, mapId, playerId, weaponId, damage.damage ]);
        }
    }

    const query = `INSERT INTO nstats_match_player_weapon_damage (match_id, playtime, gametype_id, map_id, player_id,weapon_id,damage) VALUES ?`;

    await bulkInsert(query, insertVars);
    
}


export async function getMatchWeaponDamage(matchId){

    const query = `SELECT * FROM nstats_match_player_weapon_damage WHERE match_id=?`;

    return await simpleQuery(query, [matchId]);
}


export async function getPlayerWeaponDamageTotals(playerId, seasonId){

    const dT = `nstats_totals_player_weapon_damage`;
    const wT = `nstats_weapons`;
    const gT = `nstats_gametypes`;
    const mT = `nstats_maps`;

    const query = `SELECT 
    ${dT}.total_matches,
    ${dT}.total_playtime,
    ${dT}.gametype_id,
    ${dT}.map_id,
    ${dT}.weapon_id,
    ${dT}.damage,
    ${dT}.max_damage,
    ${dT}.avg_damage,
    ${dT}.damage_per_minute,
    IF(${dT}.weapon_id = 0, 'All', ${wT}.name) as weapon_name, 
    IF(${dT}.gametype_id = 0, 'All', ${gT}.name) as gametype_name, 
    IF(${dT}.map_id = 0, 'All', ${mT}.name) as map_name 
    FROM ${dT} 
    LEFT JOIN ${wT} on ${wT}.id = ${dT}.weapon_id
    LEFT JOIN ${gT} on ${gT}.id = ${dT}.gametype_id
    LEFT JOIN ${mT} on ${mT}.id = ${dT}.map_id
    WHERE ${dT}.player_id=? AND ${dT}.season_id=?`;

    return await simpleQuery(query, [playerId, seasonId]);
}

class PlayerWeaponDamageTotals{

    constructor(playerIds, seasonId, gametypeId, mapId){

        this.playerIds = playerIds;
        this.seasonId = parseInt(seasonId);
        if(this.seasonId !== this.seasonId) throw new Error(`seasonId must be valid integer`);
        this.gametypeId = gametypeId;
        this.mapId = mapId;

        this.rawData = [];
        this.totals = {};
    }

    updateTotals(playerId, gametypeId, mapId, weaponId, data){

        //playerId => gametypeId => mapId => weaponId

        if(this.totals[playerId] === undefined){

            this.totals[playerId] = {};
        }

        //
        if(this.totals[playerId][gametypeId] === undefined){
            this.totals[playerId][gametypeId] = {};
        }

        if(this.totals[playerId][gametypeId][mapId] === undefined){

            this.totals[playerId][gametypeId][mapId] = {};
        }

        if(this.totals[playerId][gametypeId][mapId][weaponId] === undefined){

            this.totals[playerId][gametypeId][mapId][weaponId] = {
                "playtime": 0,
                "totalMatches": 0,
                "damage": 0,
                "maxDamage": 0,
                "avgDamage": 0,
                "dpm": 0
            };
        }


        const t = this.totals[playerId][gametypeId][mapId][weaponId];

        t.playtime += data.playtime;
        t.totalMatches += data.total_matches;
        t.damage += data.total_damage;
        if(t.maxDamage < data.max_damage) t.maxDamage = data.max_damage;

        if(t.damage > 0 && t.totalMatches > 0){
            t.avgDamage = t.damage / t.totalMatches;
        }

        if(t.playtime > 0 && t.damage > 0){

            
            t.dpm = t.damage /( t.playtime / 60);
        }


    }

    async calcAllTotals(){


        for(let i = 0; i < this.rawData.length; i++){

            const d = this.rawData[i];

            //weaponID 0 is already in the match table

            this.updateTotals(d.player_id, d.gametype_id, d.map_id, d.weapon_id, d);

            this.updateTotals(d.player_id, 0, d.map_id, d.weapon_id, d);
            this.updateTotals(d.player_id, d.gametype_id, 0, d.weapon_id, d);

            this.updateTotals(d.player_id, 0, 0, d.weapon_id, d);

        }

       // console.log(this.totals);

        const insertVars = [];

        for(const [playerId, gametypeData] of Object.entries(this.totals)){

            for(const [gametypeId, mapData] of Object.entries(gametypeData)){

                for(const [mapId, weaponData] of Object.entries(mapData)){

                    
                    for(const [weaponId, data] of Object.entries(weaponData)){
                       // console.log(playerId, gametypeId, mapId, weaponId);
                        insertVars.push([
                            playerId, data.totalMatches, data.playtime, gametypeId, 
                            mapId, weaponId, data.damage, data.maxDamage, data.avgDamage, data.dpm,
                            this.seasonId
                        ]);
                    }
                }
            }
        }
        //console.log(insertVars);

        await sqlInsertOnDuplicateUpdate(
        "nstats_totals_player_weapon_damage", 
        [   "player_id", "total_matches", "total_playtime", 
            "gametype_id", "map_id", "weapon_id", "damage", "max_damage", "avg_damage", "damage_per_minute",
            "season_id"
        ]
        , insertVars, "player_id,season_id, gametype_id,map_id,weapon_id")
        
    }

    async init(){

        await this.getTotalsAlt();

        await this.calcAllTotals();


    }

    async getTotalsAlt(){

        const query = `SELECT 
        COUNT(*) as total_matches,
        SUM(playtime) as playtime, 
        player_id,
        gametype_id,
        map_id,
        weapon_id, 
        SUM(damage) as total_damage, 
        MAX(damage) as max_damage, 
        AVG(damage) as avg_damage,
        IF(SUM(playtime) > 0 AND SUM(damage) > 0, SUM(damage) / SUM(playtime) * 60, 0) as damage_per_minute
        FROM nstats_match_player_weapon_damage 
        WHERE player_id IN(?) AND EXISTS (
            SELECT 1 FROM nstats_matches WHERE nstats_matches.id = nstats_match_player_weapon_damage.match_id AND nstats_matches.season_id=?
        )
        GROUP BY player_id, gametype_id, map_id, weapon_id`;


        this.rawData = await simpleQuery(query, [this.playerIds, this.seasonId]);


    }
}


export async function updatePlayerWeaponDamageTotals(playerIds, seasonId, gametypeId, mapId){


    //await altApproach(playerIds);
    const test = new PlayerWeaponDamageTotals(playerIds, seasonId, gametypeId, mapId);

    await test.init();
    return;

   const start = performance.now();
    const [allTime, gametypeTotals, mapTotals, gametypeMapTotals] = await Promise.all([
        calculatePlayerWeaponDamageTotals(playerIds, 0, 0),
        calculatePlayerWeaponDamageTotals(playerIds, gametypeId, 0),
        calculatePlayerWeaponDamageTotals(playerIds, 0, mapId),
        calculatePlayerWeaponDamageTotals(playerIds, gametypeId, mapId)
    ]);

    

    //console.log(allTime);




    const insertVars = [...allTime, ...gametypeTotals, ...mapTotals, ...gametypeMapTotals];

    await sqlInsertOnDuplicateUpdate(
        "nstats_totals_player_weapon_damage", 
        ["player_id", "total_matches", "total_playtime", "gametype_id", "map_id", "weapon_id", "damage", "max_damage", "avg_damage", "damage_per_minute"]
        , insertVars, "player_id,gametype_id,map_id,weapon_id")

    const end = performance.now();

    console.log((end - start) * 0.001)
}

export async function calculatePlayerWeaponDamageTotals(playerIds, gametypeId, mapId){


    let where = ``;
    const vars = [playerIds];

    if(gametypeId !== 0){

        where += `AND gametype_id=? `
        vars.push(gametypeId);
    }

    if(mapId !== 0){

        where += `AND map_id=? `;
        vars.push(mapId);
    }
    

    const query = `SELECT 
    COUNT(*) as total_matches,
    SUM(playtime) as playtime, 
    player_id,
    weapon_id, 
    SUM(damage) as total_damage, 
    MAX(damage) as max_damage, 
    AVG(damage) as avg_damage,
    IF(SUM(playtime) > 0 AND SUM(damage) > 0, SUM(damage) / SUM(playtime) * 60, 0) as damage_per_minute
    FROM nstats_match_player_weapon_damage 
    WHERE player_id IN(?) ${where}
    GROUP BY player_id, weapon_id`;

    const result = await simpleQuery(query, vars);


    return result.map((r) =>{
        return [r.player_id, r.total_matches, r.playtime, gametypeId, mapId, r.weapon_id, r.total_damage, r.max_damage, r.avg_damage, r.damage_per_minute]
    });


    const insertVars = result.map((r) =>{
        return [r.player_id, r.total_matches, r.playtime, r.gametype_id, r.map_id, r.weapon_id, r.total_damage, r.max_damage, r.avg_damage, r.damage_per_minute];
    });


    await sqlInsertOnDuplicateUpdate(
        "nstats_totals_player_weapon_damage", 
        ["player_id", "total_matches", "total_playtime", "gametype_id", "map_id", "weapon_id", "damage", "max_damage", "avg_damage", "damage_per_minute"]
        , insertVars, "player_id,gametype_id,map_id,weapon_id")
}


function updateCurrentTotals(totals, rowData, gametypeId, mapId){

    const playerId = rowData.player_id;
   // const gametypeId = rowData.gametype_id;
   // const mapId = rowData.map_id;
    const weaponId = rowData.weapon_id;


    if(totals[playerId] === undefined){
        totals[playerId] = {};
    }

    if(totals[playerId][gametypeId] === undefined){
        totals[playerId][gametypeId] = {};
    }

    if(totals[playerId][gametypeId][mapId] === undefined){
        totals[playerId][gametypeId][mapId] = {};
    }


    //WE dont need to do all weapons(0) as already stored in match_table and will be in the rowData already
     if(totals[playerId][gametypeId][mapId][weaponId] === undefined){

        totals[playerId][gametypeId][mapId][weaponId] = {
            "totalPlaytime": 0,
            "totalDamage": 0,
            "totalMatches": 0,
            "maxDamage": 0,
            "avgDamage": 0,
            "damagePM": 0
        };
    }

    const t = totals[playerId][gametypeId][mapId][weaponId];

    t.totalMatches += rowData.total_matches;
    t.totalPlaytime += rowData.playtime;
    t.totalDamage += rowData.total_damage;

    if(t.totalMatches > 0 && t.totalDamage > 0){
        t.avgDamage = t.totalDamage / t.totalMatches;
    }else{
        t.avgDamage = 0;
    }

    if(rowData.max_damage > t.maxDamage){
        t.maxDamage = rowData.max_damage;
    }

    if(t.totalPlaytime > 0 && t.totalDamage > 0){
        t.damagePM = (t.totalDamage / t.totalPlaytime) * 60
    }else{
        t.damagePM = 0;
    }
}

async function deletePlayerTotals(seasonId){

    const query = `DELETE FROM nstats_totals_player_weapon_damage WHERE season_id=?`;

    return await simpleQuery(query, [seasonId]);
}


async function calculateTotals(seasonId){

    const query = `SELECT
    COUNT(*) as total_matches,
    SUM(playtime) as playtime, 
    gametype_id,
    map_id,
    player_id,
    weapon_id, 
    SUM(damage) as total_damage, 
    MAX(damage) as max_damage

    FROM nstats_match_player_weapon_damage 
    WHERE EXISTS(
        SELECT 1 FROM nstats_matches 
        WHERE nstats_matches.id = nstats_match_player_weapon_damage.match_id 
        AND nstats_matches.season_id=?
    )
    GROUP BY player_id,gametype_id,map_id,weapon_id`;

    const vars = [seasonId];

    const gametypeMapTotals = await simpleQuery(query, vars);

    const totals = {};

    for(let i = 0; i < gametypeMapTotals.length; i++){

        const t = gametypeMapTotals[i];

        //all time
        updateCurrentTotals(totals, t, 0, 0);
        //map all time
        updateCurrentTotals(totals, t, 0, t.map_id);
        //gametype all time
        updateCurrentTotals(totals, t, t.gametype_id, 0);
        //gametype map combo
        updateCurrentTotals(totals, t, t.gametype_id, t.map_id);

    }

    return totals;
}

export async function playerWeaponDamageRecalculateSeasonTotals(seasonId){

    seasonId = parseInt(seasonId);
    if(seasonId !== seasonId) throw new Error(`seasonId must be valid integer`);

    await deletePlayerTotals(seasonId);

    const start = performance.now();
    const totals = await calculateTotals(seasonId);
    const end = performance.now();
    console.log((end - start) * 0.001);
    

    const insertVars = [];

    for(const [playerId, playerData] of Object.entries(totals)){

        for(const [gametypeId, gametypeData] of Object.entries(playerData)){

            for(const [mapId, weaponData] of Object.entries(gametypeData)){

                for(const [weaponId, stats] of Object.entries(weaponData)){
                   
                    insertVars.push([

                        playerId, stats.totalMatches, 
                        stats.totalPlaytime, gametypeId, mapId, 
                        weaponId, stats.totalDamage, stats.maxDamage, 
                        stats.avgDamage, stats.damagePM, seasonId
                    ]);
                }
            }
        }
    }



    await sqlInsertOnDuplicateUpdate(
        "nstats_totals_player_weapon_damage", 
        [   "player_id", "total_matches", "total_playtime", 
            "gametype_id", "map_id", "weapon_id", "damage", "max_damage", "avg_damage", "damage_per_minute",
            "season_id"
        ]
        , insertVars, "player_id,season_id, gametype_id,map_id,weapon_id")

}