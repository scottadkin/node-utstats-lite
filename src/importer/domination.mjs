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
        this.totalControlTime = 0;
        //total amount of time the point was giving players/teams points
        //only start counting up if timeHeld is 2 or more
        this.totalScoreTime = 0;
        this.totalScoreGiven = 0;
    }

    updatePointsGiven(timeHeld){

        //0.2 per second after 2 seconds held by same player/team

        const scorePerSecond = 0.2;
        const minTimeRequired = 2;
        

        let score = 0;

        if(timeHeld >= minTimeRequired){

            const extra = 1 + Math.floor(timeHeld - minTimeRequired);
            score = scorePerSecond * extra;

            this.totalScoreGiven += score;
        }


        return score;
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

            

            const scoreGiven = this.updatePointsGiven(timeHeld);
            instigator.updateDomControlPointStats(this.id, timeHeld, scoreGiven);

        }else{

            this.firstTouchedTimestamp = timestamp;
        }

        this.instigator = instigator;
        this.lastTouchedTimestamp = timestamp;
        this.totalCaps++;

        
    }

    matchEnded(timestamp){

        if(this.instigator === null) return;
        
        //const timeHeld = timestamp - this.lastTouchedTimestamp;

        //this.instigator.updateDomControlPointStats(this.id, timeHeld);

        this.totalControlTime = timestamp - this.firstTouchedTimestamp;


        //ut doesnt do this
        //this.updatePointsGiven(timeHeld);

    }
}

export class Domination{

    constructor(){

        this.pointNames = new Set();
        this.controlPoints = {};

        this.capEvents = [];  
    }


    parseLine(originalTimestamp, timestamp, line){

        const capReg = /^controlpoint_capture\t(.+?)\t(\d+)$/i;

        const capResult = capReg.exec(line);

        if(capResult === null) return;

        this.pointNames.add(capResult[1]);

        const playerId = parseInt(capResult[2]);
        this.capEvents.push({originalTimestamp, "timestamp": timestamp, "playerId": playerId, "point": capResult[1]});
      
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

            controlPoint.touched(c.originalTimestamp, player);

        }


        //match ended need to update the current player stats that have control of points

        let totalPoints = 0;

        for(const controlPoint of Object.values(this.controlPoints)){
            controlPoint.matchEnded(matchEnd);
            totalPoints += controlPoint.totalScoreGiven;
        }
        

        this.setPercentValues(playerManager, matchLength);
    
    }


    getControlPointById(id){

        id = parseInt(id);

        for(const [pointName, data] of Object.entries(this.controlPoints)){

            if(data.id === id) return data;
        }

        return null;
    }

    getAllControlPointsControlTime(){

        let total = 0;

        for(const cp of Object.values(this.controlPoints)){

            total += cp.totalControlTime;
        }

        return total;

    }

    setPercentValues(playerManager, matchLength){

        if(matchLength === 0) return;

        const totalControlPoints = Object.keys(this.controlPoints).length;

        if(totalControlPoints === 0) return;

        const maxCombinedTime = this.getAllControlPointsControlTime();


        for(let i = 0; i < playerManager.players.length; i++){

            const p = playerManager.players[i];

            const controlPoints = p.stats.dom.controlPoints;
            
            for(const [pointId, pointData] of Object.entries(controlPoints)){

                const cp = this.getControlPointById(pointId);

                if(pointId == 0 && maxCombinedTime === 0) continue;

                const maxTime = (pointId == 0) ? maxCombinedTime : cp.totalControlTime;


                if(pointData.totalTimeControlled === 0) continue;

                pointData.controlPercent = pointData.totalTimeControlled / maxTime * 100;
            }
        }
    }

    async insertPlayerMatchData(players, matchId, gametypeId, mapId){

        await insertPlayerMatchData(players, matchId, gametypeId, mapId);
    }
}