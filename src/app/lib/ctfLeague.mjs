
import { simpleQuery, bulkInsert } from "./database.mjs";
import { getMatchesTeamResults } from "./ctf.mjs";
import { getBasicPlayerInfo, applyBasicPlayerInfoToObjects } from "./players.mjs";
import { DAY, setInt } from "./generic.mjs";
import { getUniqueMapGametypeCombosInPastDays } from "./matches.mjs";
import Message from "./message.mjs";


async function getMapPlayerHistory(mapId, gametypeId, maxAgeDays){

    const query = `SELECT match_id,player_id,team FROM nstats_match_players 
    WHERE time_on_server>0 AND spectator=0 AND map_id=? AND gametype_id=? AND match_date>=? ORDER BY match_date DESC`;

    const now = Date.now();
    const minDate = new Date(now - maxAgeDays * DAY);

    const result = await simpleQuery(query, [mapId, gametypeId, minDate]);

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

async function deleteAllMapEntries(mapId, gametypeId){

    const query = `DELETE FROM nstats_player_map_ctf_league WHERE map_id=? AND gametype_id=?`;

    return await simpleQuery(query, [mapId, gametypeId]);
}

async function bulkInsertMapEntries(mapId, gametypeId, tableData){

    const insertVars = [];

    for(const d of Object.values(tableData)){

        insertVars.push([
            d.playerId, gametypeId, mapId, 
            d.firstMatch, d.lastMatch, d.matches,
            d.wins, d.draws, d.losses, 0, 
            d.capFor, d.capAgainst, d.capOffset,
            d.points
        ]);
    }

    const query = `INSERT INTO nstats_player_map_ctf_league (player_id,gametype_id,map_id,first_match,last_match,
    total_matches,wins,draws,losses,winrate,cap_for,cap_against,cap_offset,points) VALUES ?`;

    await bulkInsert(query, insertVars);
}

export async function calcPlayersMapResults(mapId, gametypeId, maxMatches, maxDays){

    if(maxMatches === undefined) maxMatches = 5;
    if(maxDays === undefined) maxDays = 180;

    const history = await getMapPlayerHistory(mapId, gametypeId, maxDays);
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
                table[id].update(team, matchResult.red, matchResult.blue, matchResult.winner, matchResult.date, matchResult.playtime);
            }
        }  
    }

    await deleteAllMapEntries(mapId, gametypeId);
    await bulkInsertMapEntries(mapId, gametypeId, table);
}


async function getMapTotalPossibleResults(mapId, gametypeId){

    const query = `SELECT COUNT(*) as total_players FROM nstats_player_map_ctf_league WHERE map_id=? 
    AND gametype_id=? ORDER BY points DESC, wins DESC, draws DESC, losses ASC, cap_offset ASC`;

    const result = await simpleQuery(query, [mapId, gametypeId]);

    return result[0].total_players;
}

export async function getMapTable(mapId, gametypeId, page, perPage){

    const totalMatches = await getMapTotalPossibleResults(mapId, gametypeId);

    if(totalMatches === 0) return {};

    const query = `SELECT player_id,first_match,last_match,total_matches,wins,draws,losses,
    cap_for,cap_against,cap_offset,points FROM nstats_player_map_ctf_league WHERE map_id=? 
    AND gametype_id=? ORDER BY points DESC, total_matches ASC, wins DESC, draws DESC, losses ASC, cap_offset DESC LIMIT ?, ?`;
    

    const start = page * perPage;
    const result = await simpleQuery(query, [mapId, gametypeId, start, perPage]);


    const playerIds = new Set(result.map((r) =>{
        return r.player_id;
    }));

    const playerInfo = await getBasicPlayerInfo([...playerIds]);

    applyBasicPlayerInfoToObjects(playerInfo, result);
    
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

        settings[r.name] = {"category": r.category, "type": r.type, "value": value}
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
    
            const vars = [v, setting.category, key];
    
            await simpleQuery(query, vars);
        }
    }  
}



export async function refreshAllMapTables(){

    const settings = await getLeagueCategorySettings("maps");

    if(settings["Enable League"] === undefined) throw new Error(`CTF Map League Missing Setting, Enable League`);

    if(settings["Enable League"].value === "false"){
        new Message(`Player CTF Map League is disabled, skipping.`,"note");
        return;
    }


    const lastImport = Math.floor(new Date(settings["Last Whole League Refresh"].value));
    const now = new Date(Date.now());

    const timeSinceLastRefresh = now - lastImport;

    if(timeSinceLastRefresh < DAY){
        new Message(`Less than 24 hours have passed since last CTF map league refresh, skipping.`,"note");
        return;
    }

    if(settings["Maximum Match Age In Days"] === undefined) throw new Error(`CTF Map League Missing Setting, Maximum Match Age In Days`);

    const maxDays = settings["Maximum Match Age In Days"].value;

    const uniqueCombos = await getUniqueMapGametypeCombosInPastDays(maxDays);

    const maxMatches = setInt(settings["Maximum Matches Per Player"], 20);

    for(let i = 0; i < uniqueCombos.length; i++){

        const u = uniqueCombos[i];
        new Message(`Recalculating CTF League table for gametype=${u.gametype_id} and map=${u.map_id}`,"note");
        await calcPlayersMapResults(u.map_id, u.gametype_id, maxMatches, maxDays)
    }

    const newData = {"maps":{"Last Whole League Refresh": {"value": now.toISOString(), "category": "maps"}}};
    await updateSettings(newData);
}



export async function getPlayerMapsLeagueData(playerId){

    const query = `SELECT gametype_id,map_id,total_matches,wins,draws,losses,cap_for,cap_against,cap_offset,points
    FROM nstats_player_map_ctf_league WHERE player_id=?`;

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

    const query = `SELECT COUNT(*) as pos FROM nstats_player_map_ctf_league 
    WHERE gametype_id=? AND map_id=? AND points>=? 
    ORDER BY points DESC, total_matches ASC, wins DESC, draws DESC, losses ASC, cap_offset DESC`;

    for(let i = 0; i < targetData.length; i++){
        const t = targetData[i];
        const pos = await simpleQuery(query, [t.gametype_id, t.map_id, t.points]);
        if(pos.length > 0) t.pos = pos[0].pos;
    }
}