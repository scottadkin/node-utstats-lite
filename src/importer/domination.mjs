import { getPointsIds, createControlPoint, insertPlayerMatchData } from "../domination.mjs";
import { scalePlaytime } from "../generic.mjs";
import Message from "../message.mjs";

/*
game timer

every 5 times log player scores
    if controlPoint has been activated for 2 seconds, since last 1 second timer



0.0 log scores
4.7 control point touched
5.0 log scores //do nothing
6.0 do nothing
6.7 control point can now be counted for points
7.0 this is the first time the control point will be counted as activated and give player points
8.0 player gets 0.2
9.0 player gets 0.2
10.0 log scores
15.0 log scores


loop through all touched events after finding the time difference between each dom_score log and update player scores


now = 0;

for now < matchEnd, now++
*/



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
        //only starts counting up if timeHeld is 2 or more
        this.totalScoreTime = 0;

        this.totalScoreGiven = 0;
    }

          /*  156.19	dom_score_update	0	34.200058
156.19	dom_score_update	1	10.999994
156.19	dom_score_update	2	3.600001
156.19	dom_score_update	3	10.399995 //59.200047999999995

156.19	teamscore	0	34
156.19	teamscore	1	10
156.19	teamscore	2	3
156.19	teamscore	3	10   //57*/

    updatePointsGiven(timeHeld){

        //0.2 per second after 2 seconds held by same player/team

        const scorePerSecond = 0.2;
        const minTimeRequired = 2;

        let scoreTime = 0;
        
        let score = 0;

        if(timeHeld >= minTimeRequired){

            const extra = Math.ceil(timeHeld - minTimeRequired);
            score = scorePerSecond * extra;

            scoreTime = timeHeld - minTimeRequired;

            this.totalScoreTime += timeHeld - minTimeRequired;
            this.totalScoreGiven += score;
        }

        return {score, scoreTime};
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

            const {score, scoreTime} = this.updatePointsGiven(timeHeld);
            instigator.updateDomControlPointStats(this.id, timeHeld, score, scoreTime);

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

        console.log(`ggggggggggggggggggggggggggg ${timeHeld}`);
        this.totalControlTime = timestamp - this.firstTouchedTimestamp;

        
        //ut skips this for some reason
        const {score, scoreTime} = this.updatePointsGiven(timeHeld);

        this.instigator.updateDomControlPointStats(this.id, timeHeld, score, scoreTime);

    }
}

export class Domination{


    constructor(){

        this.pointNames = new Set();
        this.controlPoints = {};

        this.scoreUpdateTimestamps = new Set();

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

    getTimeThing(gameSpeed){

        //if gamespeed is 100 and game is not hardcore
        const defaultTimerRange = 5;

        const realTimeRange = 5 * gameSpeed;

        const timestamps = [...this.scoreUpdateTimestamps];

        if(timestamps.length === 0) return;


        const firstSeen = timestamps[0];

        console.log(firstSeen);
        console.log(`real time range `, realTimeRange);

        const testPre = firstSeen - realTimeRange;

        console.log(`test -1 `, testPre);
        console.log(`test +1 `, firstSeen + realTimeRange);

   

        let previous = null;

        for(let i = 0; i < timestamps.length; i++){

            const t = timestamps[i];
            if(i === 0){
                previous = t;
                continue;
            }

            //const fart = firstSeen + (realTimeRange * i);
            //console.log(`${i} real=${t}, ${parseFloat(fart.toFixed(2))}`);
           // console.log(t - previous);
            previous = t;
        }
        

    }

    setPlayerCapStats(playerManager, matchStart, matchEnd, matchLength, gameSpeed){


        this.getTimeThing(gameSpeed);

        console.log(`gameSpeed is ${gameSpeed}`);

  
        for(let i = 0; i < this.capEvents.length; i++){

            const c = this.capEvents[i];


            if(c.originalTimestamp < matchStart) continue;

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
            console.log("controlPoint.totalScoreGiven, controlPoint.totalScoreTime");
            console.log(controlPoint.totalScoreGiven, controlPoint.totalScoreTime);
        }
        
        console.log(`totalpoints `, totalPoints);

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