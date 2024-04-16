import {simpleQuery} from "./database.mjs";
import {getMultipleMatchDetails} from "./matches.mjs";

export async function getPlayerMasterId(playerName/*, hwid, mac1, mac2*/){

    //const query = `SELECT id FROM nstats_players WHERE name=? AND hwid=? AND mac1=? AND mac2=?`;
    const query = `SELECT id FROM nstats_players WHERE name=?`;

    const result = await simpleQuery(query, [playerName]);

    if(result.length === 0) return null;

    return result[0].id;
}

export async function createMasterPlayer(name, ip, hwid, mac1, mac2){

    const query = `INSERT INTO nstats_players VALUES(NULL,?,"",0,0,0,0,0,0,0,0,0,0)`;

    //const result = await simpleQuery(query, [name, ip, hwid, mac1, mac2]);
    const result = await simpleQuery(query, [name]);

    return result.insertId;
}

async function getMasterPlayersStats(playerIds){

    if(playerIds.length === 0) return null;

    const query = `SELECT 
    player_id,
    COUNT(*) as total_matches,
    SUM(score) as total_score,
    SUM(frags) as total_frags,
    SUM(kills) as total_kills,
    SUM(deaths) as total_deaths,
    SUM(suicides) as total_suicides,
    AVG(TTL) as total_ttl,
    SUM(time_on_server) as total_playtime
    FROM nstats_match_players
    WHERE player_id IN (?) GROUP BY player_id`;

    const result = await simpleQuery(query, [playerIds]);

    return result;
}

async function updateMasterPlayer(totals, country, date){

    const query = `UPDATE nstats_players SET 
    country=?,matches=?,score=?,frags=?,kills=?,deaths=?,suicides=?,eff=?,ttl=?,playtime=?,
    last_active = IF(last_active IS NULL, ?, IF(last_active < ?, ?, last_active)) 
    WHERE id=?`;

    const t = totals;

    let eff = 0;

    const totalKills = parseInt(t.total_kills);
    const allDeaths = parseInt(t.total_deaths) + parseInt(t.total_suicides);

    if(totalKills > 0){
 
        if(allDeaths === 0){
            eff = 100;
        }else{
            eff = (totalKills / (totalKills + allDeaths)) * 100;
        }
    }

    const vars = [country, t.total_matches, t.total_score, t.total_frags, totalKills, 
        t.total_deaths, t.total_suicides, eff, t.total_ttl, t.total_playtime, 
        date, date, date,
        t.player_id
    ];
    
    await simpleQuery(query, vars);
}

export async function updateMasterPlayers(playerIds, idsToCountries, date){

    const totals = await getMasterPlayersStats(playerIds);

    if(totals === null) return;

    for(let i = 0; i < totals.length; i++){

        const t = totals[i];

        await updateMasterPlayer(t, idsToCountries[t.player_id], date);
    }
}


export async function insertPlayerMatchData(playerData, matchId){

    const p = playerData;

    const query = `INSERT INTO nstats_match_players VALUES(NULL,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,
    ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

    const vars = [
        p.masterId,
        p.bSpectator,
        p.ip,
        p.country,
        p.hwid,
        p.mac1,
        p.mac2,
        matchId,
        p.bBot,
        p.team,
        p.stats.score,
        p.stats.frags,
        p.stats.kills,
        p.stats.deaths,
        p.stats.suicides,
        p.stats.teamKills,
        p.stats.efficiency,
        p.playtime,
        p.stats.ttl,
        p.bFirstBlood,
        p.stats.sprees.spree,
        p.stats.sprees.rampage,
        p.stats.sprees.dominating,
        p.stats.sprees.unstoppable,
        p.stats.sprees.godlike,
        p.stats.sprees.best,
        p.stats.multis.double,
        p.stats.multis.multi,
        p.stats.multis.ultra,
        p.stats.multis.monster,
        p.stats.multis.best,
        p.stats.headshots,
        p.stats.items.amp,
        p.stats.items.belt,
        p.stats.items.boots,
        p.stats.items.body,
        p.stats.items.pads,
        p.stats.items.invis,
        p.stats.items.shp
    ];

    await simpleQuery(query, vars);
}


export async function getPlayersById(ids){

    if(ids.length === 0) return {};

    const query = `SELECT * FROM nstats_players WHERE id IN(?)`;

    const result = await simpleQuery(query, [ids]);

    const data = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        data[r.id] = r.name;
    }

    return data;
}

export async function getPlayerById(id){

    const query = `SELECT * FROM nstats_players WHERE id=?`;

    const result = await simpleQuery(query, [id]);

    if(result.length > 0) return result[0];

    return null;
}


export async function getBasicPlayerInfo(ids){

    if(ids.length === 0) return {};

    const query = `SELECT id,name,country FROM nstats_players WHERE id IN(?)`;

    const result = await simpleQuery(query, [ids]);

    const data = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];
        data[r.id] = r;
    }

    return data;
}

export async function getTotalPlayers(name){

    const query = `SELECT COUNT(*) as total_players FROM nstats_players WHERE name LIKE ?`;
    const result = await simpleQuery(query, [`%${name}%`]);

    return result[0].total_players;
}


export async function searchPlayers(name, sortBy, order, page, perPage){

    sortBy = sortBy.toLowerCase();
    order = order.toUpperCase();
    perPage = parseInt(perPage);
    page = parseInt(page);

    if(page !== page) page = 1;
    page--;

    if(page < 0) page = 0;

    if(perPage !== perPage) perPage = 25;
    if(perPage < 0) perPage = 25;
    if(perPage > 100) perPage = 100;

    if(order !== "ASC" && order !== "DESC"){
        order = "ASC";
    }

    const validSortBys = [
        "name", "last_active", "score", "frags", "kills", "deaths",
        "suicides", "eff", "matches", "playtime"
    ];

    const sortIndex = validSortBys.indexOf(sortBy);

    if(sortIndex === -1){
        throw new Error(`${sortBy} is not a valid sortBy option`);
    }

    let start = page * perPage;

    const query = `SELECT * FROM nstats_players WHERE name LIKE ? ORDER BY ${validSortBys[sortIndex]} ${order} LIMIT ?, ?`;

    const totalPlayers = await getTotalPlayers(name);
    const result = await simpleQuery(query, [`%${name}%`, start, perPage]);

    return {"players": result, "totalPlayers": totalPlayers};
}


async function getPlayersAllMatchData(playerIds){

    if(playerIds.length === 0) return [];

    const totalQuery = `SELECT 
    player_id,
    match_id,
    score,
    frags,
    kills,
    deaths,
    suicides,
    team_kills,
    time_on_server,
    ttl,
    first_blood,
    spree_1,
    spree_2,
    spree_3,
    spree_4,
    spree_5,
    spree_best,
    multi_1,
    multi_2,
    multi_3,
    multi_4,
    multi_best,
    headshots,
    item_amp,
    item_belt,
    item_boots,
    item_body,
    item_pads,
    item_invis,
    item_shp
    FROM nstats_match_players WHERE player_id IN (?)`;

    const result = await simpleQuery(totalQuery, [playerIds]);

    const matchIds = [... new Set(result.map((r) =>{
        return r.match_id;
    }))]


    return {"data": result, "matchIds": matchIds}
}

function _updateTotals(totals, gametypeId, playerData){

    if(totals[playerData.player_id] === undefined){
        totals[playerData.player_id] = {};
    }

    if(totals[playerData.player_id][gametypeId] === undefined){

        totals[playerData.player_id][gametypeId] = {
            "matches": 1,
            "playtime": playerData.time_on_server,
            "totalTtl": playerData.ttl,
            ...playerData
        };

        return;
    }

    const mergeTypes = [
      "score",
      "frags",
      "kills",
      "deaths",
      "suicides",
      "team_kills",
      "time_on_server",
      //ttl,
      "first_blood",
      "spree_1",
      "spree_2",
      "spree_3",
      "spree_4",
      "spree_5",
      //spree_best,
      "multi_1",
      "multi_2",
      "multi_3",
      "multi_4",
      //multi_best,
      "headshots",
      "item_amp",
      "item_belt",
      "item_boots",
      "item_body",
      "item_pads",
      "item_invis",
      "item_shp"
    ];

    const higherBetter = [
        "spree_best",
        "multi_best"
    ];

    const t = totals[playerData.player_id][gametypeId];

    t.matches++;

    for(let i = 0; i < mergeTypes.length; i++){

        const m = mergeTypes[i];

        t[m] += playerData[m];
    }

    for(let i = 0; i < higherBetter.length; i++){

        const h = higherBetter[i];

        if(t[h] < playerData[h]){
            t[h] = playerData[h];
        }
    }

    t.totalTtl += playerData.ttl;

    if(t.totalTtl !== 0){
        t.ttl = t.totalTtl / t.matches;
    }

}

/**
 * 
 * @param {*} playerId 
 * @returns 
 */
export async function calcPlayerTotals(playerIds){

    if(playerIds.length === 0) return [];

    const matchData = await getPlayersAllMatchData(playerIds);

    //get gametype and map id for every played match
    const matchTypeIds = await getMultipleMatchDetails(matchData.matchIds);

    //playerId => gametypes => gametypeId => gametypeTotals
    const totals = {};

    for(let i = 0; i < matchData.data.length; i++){

        const m = matchData.data[i];

        const gametypeId = matchTypeIds[m.match_id].gametype;
        //const mapId = matchTypeIds[m.match_id].map;
        //console.log(gametypeId, mapId);

        //all time totals
        _updateTotals(totals, 0, m);
        //gametype totals
        _updateTotals(totals, gametypeId, m);
        
    }

    console.log(totals);
}