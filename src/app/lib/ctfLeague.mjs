
import { simpleQuery } from "./database.mjs";
import { getMatchesTeamResults } from "./ctf.mjs";


async function getMapPlayerHistory(mapId){

    const query = `SELECT match_id,player_id,team FROM nstats_match_players WHERE time_on_server>0 AND spectator=0 AND map_id=?`;

    const result = await simpleQuery(query, [mapId]);

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
        this.points= 0;
        this.firstMatch = 0;
        this.lastMatch = 0;
        this.capOffset = 0;

    }


    update(myTeam, redScore, blueScore, winner){

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


        this.capOffset = this.capFor - this.capAgainst;
    }
}

export async function calcPlayersMapResults(mapId){



    const history = await getMapPlayerHistory(mapId);

    console.log(history);


    const matchResults = await getMatchesTeamResults(history.matchIds);

    console.log(matchResults);


    const testTable = {};

    for(let [matchId, d] of Object.entries(history.matchesToPlayers)){

        matchId = parseInt(matchId);
        
        //..console.log(matchResults[matchId]);
        console.log(d);

        for(let i = 0; i < d.length; i++){

            const {id, team} = d[i];
         
            if(testTable[id] === undefined){
                testTable[id] = new CTFLeaguePlayerObject(id);
            }

            const matchResult = matchResults[matchId];
            
            if(matchResult === undefined){
                throw new Error(`matchResult is undefined`);
            }
 

            testTable[id].update(team, matchResult.red, matchResult.blue, matchResult.winner);
        }

        //if(testTable[])
    }

    console.log(testTable);


}