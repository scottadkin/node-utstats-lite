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
        this.longestTimeHeld = null;
        this.shortestTimeHeld = null;
    }

    touched(timestamp, instigator){

        if(this.instigator !== null){

            const timeHeld = timestamp - this.lastTouchedTimestamp;
            this.totalCapTime += timeHeld;

            if(this.longestTimeHeld === null || this.longestTimeHeld < timeHeld){
                this.longestTimeHeld = timeHeld;
            }

            if(this.shortestTimeHeld === null || this.shortestTimeHeld > timeHeld){
                this.shortestTimeHeld = timeHeld;
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


    setPlayerCapStats(playerManager, matchStart, matchEnd){
  
        for(let i = 0; i < this.capEvents.length; i++){

            const c = this.capEvents[i];

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
    
    }

    async insertPlayerMatchData(players, matchId, gametypeId, mapId){

        await insertPlayerMatchData(players, matchId, gametypeId, mapId);
    }
}