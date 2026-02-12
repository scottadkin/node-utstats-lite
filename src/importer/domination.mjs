import { getPointsIds, createControlPoint, insertPlayerMatchData } from "../domination.mjs";
import Message from "../message.mjs";


class DomControlPoint{

    constructor(id, name, gameSpeed){

        this.id = id;
        this.name = name;
        this.gameSpeed = gameSpeed;
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
        this.lastTouchedTick = -999;

        this.lastScoreGivenPing = -999;

        this.totalScoreGiven = 0;


        this.bScoreReady = false;
        this.scoreTime = 2;
    }



     touched(instigator, timestamp){

       // skip int stuff and see if scores are exactly the same
        //update player total control times
        //min control time
        //max control time ect
        if(this.instigator === null){
            this.firstTouchedTimestamp = timestamp;
        }
        this.lastTouchedTimestamp = timestamp;
        this.instigator = instigator;

        this.bScoreReady = false;
        this.scoreTime = 2;

    }

    getBuggyUTTimeLimitScore(timeLimit, remainingTime){

        //timelimit is int, 20 = 20 minutes
        //remainingTime is int, but it's in seconds

        remainingTime =Math.floor(remainingTime);

        let c = 0.2;
		if ( timeLimit > 0 ){

			if (remainingTime < 0.25 * timeLimit){
				if (remainingTime < 0.1 * timeLimit){
					c = 0.8;
                }else{
					c = 0.4;
                }
			}
		}

        return c;
    }

    ping(gametypeInfo, remainingTime){

        if(!this.bScoreReady) return;

        let points = 0.2;

        if(gametypeInfo.timeLimit > 0){
            points = this.getBuggyUTTimeLimitScore(gametypeInfo.timeLimit, remainingTime);
        }

        this.totalScoreGiven += points;
    }


    controlPointTimerPing(gametypeInfo, remainingTime){

        
        
       // console.log(remainingTime);
        if(!this.bScoreReady){

            this.scoreTime--;

            if(this.scoreTime == 0){

                //console.log(this.name, "is now score ready");
                this.bScoreReady = true;
                this.ping(gametypeInfo, remainingTime);
            }
        }
    }
}


class TestDomControlPoint{

    constructor(name){

        this.name = name;
        this.touchTimestamps = [];
        this.currentTimestampIndex = 0;
    }

    addTimestamp(timestamp){

        this.touchTimestamps.push(timestamp);
    }

    getNextTouchTimestamp(){

        const totalTimestamp = this.touchTimestamps.length;

        this.currentTimestampIndex++;
        if(this.currentTimestampIndex >= totalTimestamp){
      
            return -1;
        }

        return this.touchTimestamps[this.currentTimestampIndex];
    }
}

export class Domination{


    constructor(){

        this.pointNames = new Set();
        this.controlPoints = {};

        this.scoreUpdateTimestamps = new Set();
        this.teamScoreTimestamps = {};

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

    async setPointIds(gameSpeed){

        const names = [...this.pointNames];

        const namesToIds = await getPointsIds(names);

        for(let i = 0; i < names.length; i++){

            const n = names[i];

            if(namesToIds[n] === undefined){
                namesToIds[n] = await createControlPoint(n);
            }
        }

        for(let i = 0; i < names.length; i++){

            this.controlPoints[names[i]] = new DomControlPoint(namesToIds[names[i]], names[i], gameSpeed);
        }

        for(let i = 0; i < this.capEvents.length; i++){

            const c = this.capEvents[i];

            c.point = this.controlPoints[c.point]?.name ?? "Not Found";
        }

    }


    getTotalControlPointScores(){

        let total = 0;

        for(const controlPoint of Object.values(this.controlPoints)){

            total += controlPoint.totalScoreGiven;
        }

        return total;
    }



    addControlPointOwnPings(events, pingInterval, matchEnd){

        const newEvents = [];

        const dummyControlPoints = {};

        for(let i = 0; i < events.length; i++){

            const e = events[i];

            
            if(e.type !== undefined){
               // newEvents.push(e);
                continue;
            }

            if(dummyControlPoints[e.point] === undefined){
                dummyControlPoints[e.point] = new TestDomControlPoint(e.point);
            }

            dummyControlPoints[e.point].addTimestamp(e.timestamp);

        }


        for(let i = 0; i < events.length; i++){

            const e = events[i];

        
            if(e.type !== undefined){
                newEvents.push(e);
                continue;
            }
            let nextTouchTime = dummyControlPoints[e.point].getNextTouchTimestamp();

            newEvents.push(e);
            //no more touches after this

            if(nextTouchTime === -1) nextTouchTime = matchEnd// + pingInterval * 5;
       
            const diff = nextTouchTime - e.timestamp;

            if(diff >= pingInterval * 2){

                for(let x = e.timestamp + pingInterval; x < nextTouchTime ; x+=pingInterval){
                    newEvents.push({"type": "controlPointPing", "name": e.point, "timestamp": x});
                }
            } 
        }

        newEvents.sort((a, b) =>{

            a = a.timestamp;
            b = b.timestamp;

            if(a > b){
                return 1;
            }else if(a < b){
                return -1;
            }

            return 0;
        });

       // process.exit();
        return newEvents;
    }



    getEventsBetween(events, start, end){

        const found = [];

        for(let i = 0; i < events.length; i++){

            const e = events[i];

            if(e.timestamp < start) continue;
            if(e.timestamp > end) break;

            found.push(e);
        }

        return found;
    }
    

    pingAllControlPoints(gametypeInfo, remainingTime){

        for(const [pointId, controlPoint] of Object.entries(this.controlPoints)){

            controlPoint.ping(gametypeInfo, remainingTime);
        }
    }

    getFinalLogScores(){

        let totalScore = 0;

        for(let [currentTimestamp, scores] of Object.entries(this.teamScoreTimestamps)){

            
            //sometimes UT will log everything twice at the same timestamp if the match ends on dom tick
            const usedTeams = [];
            totalScore = 0;

            for(let i = 0; i < scores.length; i++){
          
                if(usedTeams.indexOf(scores[i].teamId) !== -1) continue;
                totalScore += parseFloat(scores[i].score);

                usedTeams.push(scores[i].teamId);
            }    
        }

        return totalScore;
    }

    getLogScoresAt(timestamp){

        timestamp = parseInt(timestamp);
        let totalScore = 0;

        let latestScore = 0;

        for(let [currentTimestamp, scores] of Object.entries(this.teamScoreTimestamps)){

            currentTimestamp = parseInt(currentTimestamp);

            if(currentTimestamp > timestamp) break;

            //sometimes UT will log everything twice at the same timestamp if the match ends on dom tick
            const usedTeams = [];
            totalScore = 0;

            for(let i = 0; i < scores.length; i++){
          
                if(usedTeams.indexOf(scores[i].teamId) !== -1) continue;
                totalScore += parseFloat(scores[i].score);

                usedTeams.push(scores[i].teamId);

                latestScore = totalScore;
            }

        }

        return latestScore;
    }


    createMissingPings(pingInterval, matchEnd){

        const timestamps = [...this.scoreUpdateTimestamps];

        const firstReal = timestamps[0];

        const first = firstReal - pingInterval * 5;

        const testTimestamps = [];

        for(let i = first; i < matchEnd; i+=pingInterval){

            testTimestamps.push(i);
        }

        return testTimestamps;
    }

    setPlayerCapStats(playerManager, matchStart, matchEnd, matchLength, gameSpeed, gametypeInfo, serverInfo){

        const pingInterval = 1;

        const timestamps = this.createMissingPings(pingInterval, matchEnd);

        const newEvents = this.addControlPointOwnPings([...this.capEvents], pingInterval, matchEnd);

        //process.exit();
        let lastPingTime = -999;
   
        for(let i = 0; i < timestamps.length; i++){

            const t = timestamps[i];
           
            const events = this.getEventsBetween(newEvents, t, t+pingInterval);

            for(let x = 0; x < events.length; x++){

                const e = events[x];

                if(e.type !== undefined){

                    const controlPoint = this.controlPoints[e.name];

                    if(controlPoint === undefined){

                        new Message(`dom.setPlayerCapStats() controlPoint is undefined`, "warning");
                        continue;
                    }
                    controlPoint.controlPointTimerPing(gametypeInfo, matchEnd-e.timestamp);

                }else{

                    const controlPoint = this.controlPoints[e.point];

                    if(controlPoint === undefined){

                        new Message(`dom.setPlayerCapStats() controlPoint is undefined`, "warning");
                        continue;
                    }

                    const player = playerManager.getPlayerById(e.playerId);
                
                    if(player === null){
                        new Message(`dom.setPlayerCapStats() player is null`,"warning");
                        continue;
                    }

                    controlPoint.touched(player, e.timestamp);

                }
            }
            
            this.pingAllControlPoints(gametypeInfo, matchEnd- t);

            lastPingTime = t;
        }

        if(gametypeInfo.timeLimit > 0){
            this.pingAllControlPoints(gametypeInfo, matchEnd);
        }
         console.log(this.getTotalControlPointScores(), "LOGFILE = ", this.getFinalLogScores());

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