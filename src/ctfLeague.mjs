
import { simpleQuery, bulkInsert } from "./database.mjs";
import { getCTFGametypes, getMatchesTeamResults } from "./ctf.mjs";
import { getBasicPlayerInfo, applyBasicPlayerInfoToObjects } from "./players.mjs";
import { DAY, getPlayer, sanitizePagePerPage, setInt } from "./generic.mjs";
import { getUniqueMapGametypeCombosInPastDays, getUniqueGametypesInPastDays } from "./matches.mjs";
import Message from "./message.mjs";


async function getPlayerHistory(mapId, gametypeId, maxAgeDays, ctfGametypes){


    const now = Date.now();
    const minDate = new Date(now - maxAgeDays * DAY);

    let query = `SELECT match_id,player_id,team FROM nstats_match_players`;
    let vars = [minDate];

    let where = ` WHERE time_on_server>0 AND spectator=0 AND match_date>=?`;

    if(mapId !== 0){

        where += ` AND map_id=?`;
        vars.push(mapId);
    }

    if(gametypeId !== 0){
        where += ` AND gametype_id=?`;
        vars.push(gametypeId);
    }

    if(gametypeId === 0){
        where += ` AND gametype_id IN(?)`;
        vars.push(ctfGametypes);
    }

    const result = await simpleQuery(`${query}${where}`, vars);

    const matchIds = new Set();
    const matchesToPlayers = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];
        matchIds.add(r.match_id);
        
        if(matchesToPlayers[r.match_id] === undefined){
            matchesToPlayers[r.match_id] = [];
        }

        matchesToPlayers[r.match_id].push({"id": r.player_id, "team": r.team});
    }

    return {"matchIds": [...matchIds], matchesToPlayers}
    
}

class CTFLeaguePlayerObject{

    constructor(playerId){

        this.playerId = playerId;
        this.matches = 0;
        this.wins = 0;
        this.draws = 0;
        this.losses = 0;
        this.capFor = 0;
        this.capAgainst = 0;
        this.points = 0;
        this.firstMatch = 0;
        this.lastMatch = 0;
        this.capOffset = 0;
        this.playtime = 0;

    }

    update(myTeam, redScore, blueScore, winner, date, playtime){

        this.matches++;

        if(winner !== -1){

            if(myTeam === winner){
                this.wins++;
                this.points+=3;
            }

            if(myTeam !== winner) this.losses++;

        }else{
            this.draws++;
            this.points++;
        }
        
        if(myTeam === 0){
            this.capFor += redScore;
            this.capAgainst += blueScore;
        }else{
            this.capFor += blueScore;
            this.capAgainst += redScore;
        }

        if(this.firstMatch === 0 || this.firstMatch > date){
            this.firstMatch = date;
        }

        if(this.lastMatch === 0 || this.lastMatch < date){
            this.lastMatch = date;
        }


        this.capOffset = this.capFor - this.capAgainst;
        this.playtime += playtime;
    }
}

async function deleteAllEntries(mapId, gametypeId){

    const query = `DELETE FROM nstats_player_ctf_league WHERE map_id=? AND gametype_id=?`;
    const vars = [mapId, gametypeId];

    return await simpleQuery(query, vars);
}

async function bulkInsertEntries(mapId, gametypeId, tableData){

    const insertVars = [];

    for(const d of Object.values(tableData)){

        insertVars.push([
            d.playerId, gametypeId, mapId, 
            d.firstMatch, d.lastMatch, d.matches,
            0, d.wins, d.draws, d.losses, 0, 
            d.capFor, d.capAgainst, d.capOffset,
            d.points
        ]);
    }

    const query = `INSERT INTO nstats_player_ctf_league (player_id,gametype_id,map_id,first_match,last_match,
    total_matches,playtime,wins,draws,losses,winrate,cap_for,cap_against,cap_offset,points) VALUES ?`;

    await bulkInsert(query, insertVars);
}

export async function calcPlayersMapResults(mapId, gametypeId, maxMatches, maxDays){

    if(maxMatches === undefined) maxMatches = 5;
    if(maxDays === undefined) maxDays = 180;

    const ctfGametypes = await getCTFGametypes();

    const history = await getPlayerHistory(mapId, gametypeId, maxDays, ctfGametypes);
    const matchResults = await getMatchesTeamResults(history.matchIds);
    const table = {};

    for(let [matchId, d] of Object.entries(history.matchesToPlayers)){

        matchId = parseInt(matchId);

        for(let i = 0; i < d.length; i++){

            const {id, team} = d[i];
         
            if(table[id] === undefined){
                table[id] = new CTFLeaguePlayerObject(id);
            }

            const matchResult = matchResults[matchId];
            
            if(matchResult === undefined){
                throw new Error(`matchResult is undefined`);
            }
 
            if(table[id].matches < maxMatches){

                table[id].update(
                    team, 
                    matchResult.red, 
                    matchResult.blue, 
                    matchResult.winner, 
                    matchResult.date, 
                    matchResult.playtime
                );
            }
        }  
    }


    await deleteAllEntries(mapId, gametypeId);
    await bulkInsertEntries(mapId, gametypeId, table);
}


async function getMapTotalPossibleResults(mapId, gametypeId, minDate){

    const query = `SELECT COUNT(*) as total_players FROM nstats_player_ctf_league WHERE map_id=? 
    AND gametype_id=? AND last_match>=? ORDER BY points DESC, wins DESC, draws DESC, losses ASC, cap_offset ASC`;

    const result = await simpleQuery(query, [mapId, gametypeId, minDate]);

    return result[0].total_players;
}

export async function getMapCTFTable(mapId, gametypeId, page, perPage, timeRange){

    page--;
    if(page < 0) page = 0;
    timeRange = parseInt(timeRange);
    if(timeRange !== timeRange) throw new Error("timeRange must be an integer");
    if(timeRange < 1) timeRange = 1;

    const now = new Date();
    const minDate = new Date(now - 60 * 60 * 24 * 1000 * timeRange);

    const totalMatches = await getMapTotalPossibleResults(mapId, gametypeId, minDate);

    if(totalMatches === 0) return {"data": [], "totalResults": 0};

    const query = `SELECT 
    nstats_player_ctf_league.player_id,
    nstats_player_ctf_league.first_match,
    nstats_player_ctf_league.last_match,
    nstats_player_ctf_league.total_matches,
    nstats_player_ctf_league.wins,
    nstats_player_ctf_league.draws,
    nstats_player_ctf_league.losses,
    nstats_player_ctf_league.cap_for,
    nstats_player_ctf_league.cap_against,
    nstats_player_ctf_league.cap_offset,
    nstats_player_ctf_league.points, 
    nstats_players.name,
    nstats_players.country
    FROM nstats_player_ctf_league 
    LEFT JOIN nstats_players ON nstats_players.id = nstats_player_ctf_league.player_id
    WHERE nstats_player_ctf_league.map_id=? AND nstats_player_ctf_league.gametype_id=? 
    AND nstats_player_ctf_league.last_match>=?
    ORDER BY nstats_player_ctf_league.points DESC, 
    nstats_player_ctf_league.total_matches ASC, 
    nstats_player_ctf_league.wins DESC, 
    nstats_player_ctf_league.draws DESC, 
    nstats_player_ctf_league.losses ASC, 
    nstats_player_ctf_league.cap_offset DESC LIMIT ?, ?`;
    

    const start = page * perPage;
    const result = await simpleQuery(query, [mapId, gametypeId, minDate, start, perPage]);
    
    return {"data": result, "totalResults": totalMatches};
}

/**
 * Used for admin tools, use getLeagueCategorySettings for importer
 * @returns 
 */
export async function getLeagueSiteSettings(){

    const query = `SELECT category,name,type,value FROM nstats_ctf_league_settings`;

    const result = await simpleQuery(query);

    const settings = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];
        let value = r.value;

        if(r.type === "bool"){

            if(value === "false"){
                value = 0;
            }else{
                value = 1;
            }
        }

        if(settings[r.category] === undefined){
            settings[r.category] = {}; 
        }

        settings[r.category][r.name] = {"type": r.type, "value": value}
    }

    return settings;
}


export async function getLeagueCategorySettings(cat){

    const query = `SELECT category,name,type,value FROM nstats_ctf_league_settings WHERE category=?`;
    const result = await simpleQuery(query, [cat]);

    const settings = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];
        settings[r.name] = {"type": r.type, "name": r.name, "value": r.value};
    }

    return settings;
}


export async function updateSettings(data){

    const query = `UPDATE nstats_ctf_league_settings SET value=? WHERE category=? AND name=?`;

    for(const [categoryName, category] of Object.entries(data)){

        if(categoryName === "totalChanges") continue;

        for(const [key, setting] of Object.entries(category)){

            let v = setting.value.toString();
    
            const vars = [v, categoryName, key];
    
            await simpleQuery(query, vars);
        }
    }  
}


/**
 * Get only valid CTF gametypes based on data stored in player match_ctf table
 */
export async function getValidGametypes(){

    const query = `SELECT DISTINCT gametype_id FROM nstats_match_ctf`;

    const result = await simpleQuery(query);

    return result.map((r) =>{
        return r.gametype_id;
    });
}

/**
 * Get only valid CTF maps based on data stored in player match_ctf table
 */

export async function getValidMaps(){

    const query = `SELECT DISTINCT map_id FROM nstats_match_ctf`;

    const result = await simpleQuery(query);

    return result.map((r) =>{
        return r.map_id;
    });
}

export async function refreshAllTables(bOverrideTimeLimit, type){

    if(bOverrideTimeLimit === undefined) bOverrideTimeLimit = false;

    if(type === undefined) throw new Error(`Refresh all tables requires a type`);

    const settings = await getLeagueCategorySettings(type);

    if(settings["Enable League"] === undefined) throw new Error(`CTF ${type} League Missing Setting, Enable League`);

    if(settings["Enable League"].value === "false"){
        new Message(`Player CTF ${type} League is disabled, skipping.`,"note");
        return;
    }


    const lastImport = Math.floor(new Date(settings["Last Whole League Refresh"].value));
    const now = new Date(Date.now());

    const timeSinceLastRefresh = now - lastImport;

    if(!bOverrideTimeLimit && timeSinceLastRefresh < DAY){
        new Message(`Less than 24 hours have passed since last CTF ${type} league refresh, skipping.`,"note");
        return;
    }

    if(settings["Maximum Match Age In Days"] === undefined) throw new Error(`CTF ${type} League Missing Setting, Maximum Match Age In Days`);

    const maxDays = settings["Maximum Match Age In Days"].value;

    let uniqueCombos = [];
    if(type === "maps"){
        uniqueCombos = await getUniqueMapGametypeCombosInPastDays(maxDays);
    }else if(type === "gametypes"){
        uniqueCombos = await getUniqueGametypesInPastDays(maxDays);
    }

    const maxMatches = setInt(settings["Maximum Matches Per Player"], 20);

    if(type !== "combined"){

        for(let i = 0; i < uniqueCombos.length; i++){

            const u = uniqueCombos[i];

            let message = "";

            if(type === "maps"){
                message = `Recalculating CTF Map League table for gametype=${u.gametype_id} and map=${u.map_id}`;
            }else{
                message = `Recalculating CTF Gametype League table for gametype=${u.gametype_id} `;
            }

            new Message(message, "note");

            let mapId = (type === "maps") ? u.map_id : 0;

            await calcPlayersMapResults(mapId, u.gametype_id, maxMatches, maxDays);
        }
        
    }else{

        new Message(`Recalculating CTF Lifetime League table`, "note");
        await calcPlayersMapResults(0, 0, maxMatches, maxDays);
    }

    const newData = {};
    
    newData[type] = {"Last Whole League Refresh": {"value": now.toISOString(), "category": type}};
    await updateSettings(newData);
}



export async function getPlayerMapsLeagueData(playerId){

    const query = `SELECT gametype_id,map_id,total_matches,wins,draws,losses,cap_for,cap_against,cap_offset,points
    FROM nstats_player_ctf_league WHERE player_id=?`;

    const result = await simpleQuery(query, [playerId]);


    await getPlayerMapsPosition(playerId, result);

    return result;
}


/**
 * probably not an efficent way of doing this...
 * @param {*} playerId 
 * @param {*} targetData 
 */
export async function getPlayerMapsPosition(playerId, targetData){

    const query = `SELECT COUNT(*) as pos FROM nstats_player_ctf_league 
    WHERE gametype_id=? AND map_id=? AND points>?
    ORDER BY points DESC, wins DESC, draws DESC, losses ASC, cap_offset DESC`;

    for(let i = 0; i < targetData.length; i++){
        const t = targetData[i];
        const pos = await simpleQuery(query, [t.gametype_id, t.map_id, t.points]);
        if(pos.length > 0) t.pos = pos[0].pos;
    }
}


/**
* Only return gametypes with mapId=0
*/
export async function getUniqueGametypeLeagues(){

    const query = `SELECT DISTINCT gametype_id FROM nstats_player_ctf_league WHERE map_id=0`;

    const result = await simpleQuery(query);

    return result.map((r) =>{
        return r.gametype_id;
    });
}

export async function getUniqueMapLeagues(){

    const query = `SELECT DISTINCT map_id FROM nstats_player_ctf_league WHERE map_id!=0`;

    const result = await simpleQuery(query);

    return result.map((r) =>{
        return r.map_id;
    });
}


/**
 * get top x for every gametype specified
 */
export async function getGametypesTopX(gametypeIds, max){

    if(gametypeIds.length === 0) return {};
    max = setInt(max, 10);

    const query = `SELECT player_id,first_match,last_match,total_matches,wins,draws,losses,
    cap_for,cap_against,cap_offset,points FROM nstats_player_ctf_league WHERE gametype_id=? AND map_id=0 ORDER BY points DESC LIMIT ?`;

    const data = {};
    const uniquePlayers = new Set();

    for(let i = 0; i < gametypeIds.length; i++){

        const g = parseInt(gametypeIds[i]);
        if(g !== g) continue;
        const result = await simpleQuery(query, [g, max]); 
        data[g] = result;

        for(let x = 0; x < result.length; x++){

            uniquePlayers.add(result[x].player_id);
        }
    }

    const playerNames = await getBasicPlayerInfo([...uniquePlayers]);

    return {"data": data, "playerNames": playerNames};

}


export async function getMapPlayedValidGametypes(mapId){

    if(mapId === 0) return {};

    const query = `SELECT gametype_id,COUNT(*) as total_matches FROM nstats_player_ctf_league WHERE map_id=? GROUP BY gametype_id`;
    const result = await simpleQuery(query, [mapId]);
    const data = {};

    for(let i = 0; i < result.length; i++){

        data[result[i].gametype_id] = result[i].total_matches;
    }

    return data;
}

export async function getLatestMapGametypePlayed(){

    const query = `SELECT gametype_id,map_id FROM nstats_player_ctf_league WHERE map_id!=0 AND gametype_id!=0 ORDER by id DESC LIMIT 1`;

    const result = await simpleQuery(query);

    if(result.length > 0) return result[0];

    return null;
}

export async function getTotalEntries(gametypeId, mapId){

    const query = `SELECT COUNT(*) as total_matches FROM nstats_player_ctf_league WHERE gametype_id=? AND map_id=?`;

    const result = await simpleQuery(query, [gametypeId, mapId]);

    if(result.length > 0) return result[0].total_matches;

    return 0;
}

export async function getSingleCTFLeague(gametypeId, mapId, dirtyPage, dirtyPerPage, bOnlyCombined){

    const [page, perPage, start] = sanitizePagePerPage(dirtyPage, dirtyPerPage);

    const query = `SELECT * FROM nstats_player_ctf_league 
    WHERE map_id=? AND gametype_id=? ORDER BY points DESC LIMIT ?, ?`;

    const result = await simpleQuery(query, [mapId, gametypeId, start, perPage]);

    const playerIds = [...new Set(result.map((p) =>{
        return p.player_id;
    }))];

    const playerNames = await getBasicPlayerInfo(playerIds);


    for(let i = 0; i < result.length; i++){

        const r = result[i];
        r.player = getPlayer(playerNames, r.player_id);
    }

    const totalRows = await getTotalEntries(gametypeId, mapId);

    return {"data": result, totalRows};
}



export async function getLeaguesEnabledStatus(){

    const query = `SELECT category,value FROM nstats_ctf_league_settings WHERE name="Enable League"`;
    const result = await simpleQuery(query);

    const data = {};

    for(let i = 0; i < result.length; i++){

        const {category, value} = result[i];

        data[category] = value === "true";
    }

    return data;
}

export async function getMapUniqueGametypeLeagues(mapId, timeframe){

    timeframe = parseInt(timeframe);
    if(timeframe !== timeframe) throw new Error("Timeframe must be an integer");

    const range = timeframe * 60 * 60 * 24 * 1000;

    const now = Date.now();
    const minDate = new Date(now - range);

    const query = `SELECT DISTINCT 
    nstats_player_ctf_league.gametype_id as id,
    nstats_gametypes.name as name 
    FROM nstats_player_ctf_league 
    LEFT JOIN nstats_gametypes ON nstats_gametypes.id = nstats_player_ctf_league.gametype_id
    WHERE nstats_player_ctf_league.map_id=? 
    AND nstats_player_ctf_league.last_match>=? ORDER BY name ASC`;

    return await simpleQuery(query, [mapId, minDate]);
}

export async function adminGetAllCTFLeagueSettings(){

    const query = `SELECT * FROM nstats_ctf_league_settings`;

    return await simpleQuery(query);

}

/**
 * update by id
 * @param {*} changes array of changes id => value
 */
export async function adminUpdateCTFLeagueSettings(changes){

    if(changes.length === 0) return;

    const query = `UPDATE nstats_ctf_league_settings SET value=? WHERE id=?`;

    for(let i = 0; i < changes.length; i++){

        const {id, value} = changes[i];

        await simpleQuery(query, [value, id]);
    }
}


export async function deleteMatch(mapId, gametypeId){

    const settings = await getLeagueSiteSettings();

    if(settings.maps["Enable League"].value){

        //map all time 
        await calcPlayersMapResults(
            mapId, 
            0, 
            settings.maps["Maximum Matches Per Player"].value,
            settings.maps["Maximum Match Age In Days"].value
        );

        //map + gametype 
        await calcPlayersMapResults(
            mapId, 
            gametypeId, 
            settings.maps["Maximum Matches Per Player"].value,
            settings.maps["Maximum Match Age In Days"].value
        );
    }


    if(settings.gametypes["Enable League"].value){

        //gametype all time
        await calcPlayersMapResults(
            0, 
            gametypeId, 
            settings.gametypes["Maximum Matches Per Player"].value,
            settings.gametypes["Maximum Match Age In Days"].value
        );
    }

    if(settings.combined["Enable League"].value){

        //lifetime
        await calcPlayersMapResults(
            0, 
            0, 
            settings.combined["Maximum Matches Per Player"].value,
            settings.combined["Maximum Match Age In Days"].value
        );
    }
}