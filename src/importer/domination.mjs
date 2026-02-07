import { getPointsIds, createControlPoint, insertPlayerMatchData } from "../domination.mjs";
import Message from "../message.mjs";


class DomControlPoint{

    constructor(id, name){

        this.id = id;
        this.name = name;
        this.firstTouchedTimestamp = null;
        this.lastTouchedTimestamp = null;
        this.instigator = null;
        this.totalCaps = 0;
        this.totalCapTime = 0;
        this.longestTimeControlled = null;
        this.shortestTimeControlled = null;
    }

    touched(timestamp, instigator){

        if(this.instigator !== null){

            const timeHeld = timestamp - this.lastTouchedTimestamp;
            this.totalCapTime += timeHeld;

            if(this.longestTimeControlled === null || this.longestTimeControlled < timeHeld){
                this.longestTimeControlled = timeHeld;
            }

            if(this.shortestTimeControlled === null || this.shortestTimeControlled > timeHeld){
                this.shortestTimeControlled = timeHeld;
            }

            instigator.updateDomControlPointStats(this.id, timeHeld);

        }else{

            this.firstTouchedTimestamp = timestamp;
        }

        this.instigator = instigator;
        this.lastTouchedTimestamp = timestamp;
        this.totalCaps++;

        
    }

    matchEnded(timestamp){

        if(this.instigator === null) return;
        
        const timeHeld = timestamp - this.lastTouchedTimestamp;
        this.instigator.updateDomControlPointStats(this.id, timeHeld);
    }
}

export class Domination{

    constructor(){

        this.pointNames = new Set();
        this.controlPoints = {};

        this.capEvents = [];  
    }


    parseLine(timestamp, line){

        const capReg = /^controlpoint_capture\t(.+?)\t(\d+)$/i;

        const capResult = capReg.exec(line);

        if(capResult === null) return;

        this.pointNames.add(capResult[1]);

        const playerId = parseInt(capResult[2]);
        this.capEvents.push({"timestamp": timestamp, "playerId": playerId, "point": capResult[1]});
      
    }

    async setPointIds(){

        const names = [...this.pointNames];

        const namesToIds = await getPointsIds(names);

        for(let i = 0; i < names.length; i++){

            const n = names[i];

            if(namesToIds[n] === undefined){
                namesToIds[n] = await createControlPoint(n);
            }
        }

        for(let i = 0; i < names.length; i++){

            this.controlPoints[names[i]] = new DomControlPoint(namesToIds[names[i]], names[i]);
        }

        for(let i = 0; i < this.capEvents.length; i++){

            const c = this.capEvents[i];

            c.point = this.controlPoints[c.point]?.name ?? "Not Found";
        }

    }


    setPlayerCapStats(playerManager, matchStart, matchEnd, matchLength){
  
        for(let i = 0; i < this.capEvents.length; i++){

            const c = this.capEvents[i];


            if(c.timestamp < matchStart) continue;

            const player = playerManager.getPlayerById(c.playerId);
            
            if(player === null){
                new Message(`dom.setPlayerCapStats() player is null`,"warning");
                continue;
            }

            const controlPoint = this.controlPoints[c.point];

            if(controlPoint === undefined){

                new Message(`dom.setPlayerCapStats() controlPoint is undefined`, "warning");
                continue;
            }

            controlPoint.touched(c.timestamp, player);

        }


        //match ended need to update the current player stats that have control of points
        for(const controlPoint of Object.values(this.controlPoints)){
            controlPoint.matchEnded(matchEnd);
        }

        this.setPercentValues(playerManager, matchLength);
    
    }


    setPercentValues(playerManager, matchLength){

        if(matchLength === 0) return;

        const totalControlPoints = Object.keys(this.controlPoints).length;

        if(totalControlPoints === 0) return;

        const maxCombinedTime = matchLength * totalControlPoints;

        for(let i = 0; i < playerManager.players.length; i++){

            const p = playerManager.players[i];

            const controlPoints = p.stats.dom.controlPoints;
            
            for(const [pointId, pointData] of Object.entries(controlPoints)){

                const maxTime = (pointId == 0) ? maxCombinedTime : matchLength;


                if(pointData.totalTimeControlled === 0) continue;

                pointData.controlPercent = pointData.totalTimeControlled / maxTime * 100;
            }
        }
    }

    async insertPlayerMatchData(players, matchId, gametypeId, mapId){

        await insertPlayerMatchData(players, matchId, gametypeId, mapId);
    }
}