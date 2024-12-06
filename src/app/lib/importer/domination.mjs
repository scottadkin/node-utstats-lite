import { getPointsIds, createControlPoint, insertPlayerMatchData } from "../domination.mjs";
import Message from "../message.mjs";

export class Domination{

    constructor(){

        this.controlPoints = {};

        this.capEvents = [];  
    }


    parseLine(timestamp, line){

        const capReg = /^controlpoint_capture\t(.+?)\t(\d+)$/i;

        const capResult = capReg.exec(line);

        if(capResult !== null){

            if(this.controlPoints[capResult[1]] === undefined){
                this.controlPoints[capResult[1]] = null;
            }

            const playerId = parseInt(capResult[2]);
            this.capEvents.push({"timestamp": timestamp, "playerId": playerId, "point": capResult[1]});
        }    
    }

    async setPointIds(){

        const names = Object.keys(this.controlPoints);

        const namesToIds = await getPointsIds(names);

        for(let i = 0; i < names.length; i++){

            const n = names[i];

            if(namesToIds[n] === undefined){
                namesToIds[n] = await createControlPoint(n);
            }
        }

        for(const pointName of Object.keys(this.controlPoints)){

            this.controlPoints[pointName] = namesToIds[pointName];
        }

        for(let i = 0; i < this.capEvents.length; i++){

            const c = this.capEvents[i];

            c.point = this.controlPoints[c.point] ?? -1;
        }
    }


    setPlayerCapStats(playerManager){
  
        for(let i = 0; i < this.capEvents.length; i++){

            const c = this.capEvents[i];

            const player = playerManager.getPlayerById(c.playerId);
            
            if(player === null){
                new Message(`dom.setPlayerCapStats() player is null`,"warning");
                continue;
            }


            if(player.stats.dom.controlPoints[c.point] === undefined){
                player.stats.dom.controlPoints[c.point] = 0;
            }

            player.stats.dom.controlPoints[c.point]++;
        }
    }

    async insertPlayerMatchData(players, matchId, gametypeId, mapId){

        await insertPlayerMatchData(players, matchId, gametypeId, mapId);
    }
}