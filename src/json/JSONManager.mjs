import { getPlayerRecentMatches } from "../players.mjs";
import { getTotalMatches, getMatchesByHashes } from "../matches.mjs";
import  {getRecentMatches as getMapRecentMatches, getMapPlayerAverages} from "../maps.mjs";
import { getRankingsWithPlayerNames } from "../rankings.mjs";
import { getMapCTFTable, getMapUniqueGametypeLeagues } from "../ctfLeague.mjs";
import { getPlayersByHashes } from "../players.mjs";
import { getKillsGraphData } from "../kills.mjs";

export default class JSONManager{

    constructor(req, res, bPostRequest){

        this.req = req ?? {};
        this.res = res;
        this.bPostRequest = bPostRequest;

        if(this.bPostRequest && this.req.body === undefined){
            throw new Error(`body is required for post`);
        }

        this.mode = req?.params?.mode ?? "";


    }

    async playerRecentMatches(){

        const playerId = this.req.query?.playerId ?? "";
        let gametypeId = this.req.query?.gametypeId ?? 0; 
        let mapId = this.req.query?.mapId ?? 0; 

        let {page, perPage} = this.getPageAndPerPage();
        
        const data = await getPlayerRecentMatches(playerId, gametypeId, mapId, page, perPage);

        //const data = await getPlayerRecentMatches();
        return this.res.status(200).json(data);
    }

    getPageAndPerPage(){

        let page = this.querySanitizeInteger("page");
        let perPage = this.querySanitizeInteger("perPage");

        if(page < 1) page = 1;
        if(perPage < 5 || perPage > 100) perPage = 25;

        return {page, perPage};
    }

    throwErrorIfQueryMissingKey(key){

        if(this.req.query[key] === undefined){
            throw new Error(`There is no ${key} key in query object`);
        }
    }

    querySanitizeInteger(key){

        this.throwErrorIfQueryMissingKey(key);

        const value = parseInt(this.req.query[key]);
        if(value !== value) throw new Error(`${key} is not a valid integer`);

        return value;
    }

    querySanitizeString(key, bForceLowerCase){

        this.throwErrorIfQueryMissingKey(key);

        if(bForceLowerCase === undefined) bForceLowerCase = false;

        const value = this.req.query[key];

        if(typeof value !== "string") throw new Error(`${key} must be a string, ${value} provided`);

        return (bForceLowerCase) ? value.toLowerCase() : value
    }

    querySanitizeFloat(key){

        this.throwErrorIfQueryMissingKey(key);

        const value = parseFloat(this.req.query[key]);
        if(value !== value) throw new Error(`${key} must be a valid number`);

        return value;
    }

    async mapRecentMatches(){


        const id = this.querySanitizeInteger("id");

        const {page, perPage} = this.getPageAndPerPage();

        const data = await getMapRecentMatches(id, page, perPage);
        const totalMatches = await getTotalMatches(0, 0, id);

        return this.res.status(200).json({"data": data, "totalResults": totalMatches});
    }

    async mapRankings(){

        const id = this.querySanitizeInteger("id");

        const {page, perPage} = this.getPageAndPerPage();

        let timeRange = (this.req.query.timeRange !== undefined) ? parseInt(this.req.query.timeRange) : null;
        if(timeRange !== timeRange) timeRange = null;
        if(timeRange === null) throw new Error(`TimeRange must be an intger, example 5 would mean active players in last 5 days.`);

        const {data, totalResults} = await getRankingsWithPlayerNames(id, page, perPage, timeRange, "map");

        return this.res.status(200).json({data, totalResults});
   
    }


    async mapPlayerAverages(){

        const id = this.querySanitizeInteger("id");
        const cat = this.querySanitizeString("cat", true);
        const {page, perPage} = this.getPageAndPerPage();

        this.res.status(200).json(await getMapPlayerAverages(id, cat, page, perPage));
    }

    async mapPlayerCTFLeague(){

        const mapId = this.querySanitizeInteger("mapId");
        const gametypeId = this.querySanitizeInteger("gametypeId");
        const {page, perPage} = this.getPageAndPerPage();
        const range = this.querySanitizeInteger("range");

        const data = await getMapCTFTable(mapId, gametypeId, page, perPage, range);
 
        this.res.status(200).json({data});
    }

    async mapPlayerCTFLeagueGametypes(){

        const mapId = this.querySanitizeInteger("mapId");
        const range = this.querySanitizeInteger("range");

        const data = await getMapUniqueGametypeLeagues(mapId, range);
        this.res.status(200).json({data});
    }

    async getMatchesByHashes(){

        if(!this.bPostRequest) throw new Error(`getMatchesByHashes only enabled for post requests`);
        
        if(this.req.body.hashes === undefined) throw new Error(`No hashes array found`);

        const data = await getMatchesByHashes(this.req.body.hashes);
        this.res.status(200).json(data);
    }

    async getPlayersByHashes(){

        if(!this.bPostRequest) throw new Error(`getPlayersByHashes only enabled for post requests`);
        
        if(this.req.body.hashes === undefined) throw new Error(`No hashes array found`);

        const data = await getPlayersByHashes(this.req.body.hashes);
        this.res.status(200).json(data);
    }

    async getMatchKillsGraph(){

        const id = this.querySanitizeInteger("id");
        const timeframe = this.querySanitizeInteger("timeframe");

        const matchStart = this.querySanitizeFloat("start");
       // const bHardcore = this.querySanitizeInteger("hardcore");

        const data = await getKillsGraphData(id, matchStart, timeframe);

        this.res.status(200).json(data);
    }

    async init(){

        try{

            if(this.mode === "player-recent-matches"){

                return await this.playerRecentMatches();       
            }

            if(this.mode === "map-recent-matches"){

                return await this.mapRecentMatches();
            }

            if(this.mode === "map-rankings"){
                return await this.mapRankings();
            }

            if(this.mode === "map-player-averages"){

                //getMapPlayerAverages(mapId, category, initialPage, initialPerPage)
                return await this.mapPlayerAverages();
            }

            if(this.mode === "map-ctf-league-gametypes"){
                return await this.mapPlayerCTFLeagueGametypes();
            }

            if(this.mode === "map-ctf-league"){

                return await this.mapPlayerCTFLeague();
            }

            if(this.mode === "get-matches-by-hashes"){
                return await this.getMatchesByHashes();
            }

            if(this.mode === "get-players-by-hashes"){
                return await this.getPlayersByHashes();
            }

            if(this.mode === "match-kills-graph"){
                return await this.getMatchKillsGraph();
            }

            console.log(this.mode);

            //getPlayerRecentMatches(playerId, gametype, map, page, perPage)

           // this.res.setHeader("Content-Type", "application/json");
            this.res.status(200).json({"error": "Unknown Request"});

        }catch(err){
            this.res.status(200).json({"error": err.message});
        }
    }
}