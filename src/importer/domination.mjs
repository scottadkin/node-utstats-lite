import { getPointsIds, createControlPoint, insertPlayerMatchData } from "../domination.mjs";
import Message from "../message.mjs";


class DomControlPoint{

    constructor(id, name, gametypeInfo){

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
        this.gametypeInfo = gametypeInfo;
        //total amount of time the point was giving players/teams points
        //only starts counting up if timeHeld is 2 or more
        this.totalScoreTime = 0;

        this.lastScoreGivenTimestamp = -999;

        this.totalScoreGiven = 0;


        this.bScoreReady = false;
        this.scoreTime = 2;
        this.currentFirstScoreGivenTimestamp = -999;
        this.currentScoreGiven = 0;
        this.controlPercent = 0;
    }


    calcCurrentScore(timestamp){

        const timeHeld = timestamp - this.lastTouchedTimestamp;

        let scoreTimeHeld = 0;

    
        if(this.bScoreReady){
            scoreTimeHeld = timestamp - this.currentFirstScoreGivenTimestamp;
        }

        this.instigator.updateDomControlPointStats(this.id, timeHeld, this.currentScoreGiven, scoreTimeHeld);
        

        this.totalScoreTime += scoreTimeHeld;
        this.totalControlTime += timeHeld;
    }

     touched(instigator, originalTimestamp){

        //console.log(this.name, "touched ", originalTimestamp);

        if(this.instigator === null){
            this.firstTouchedTimestamp = originalTimestamp;
        }else{


           this.calcCurrentScore(originalTimestamp, false);
        }

        this.lastTouchedTimestamp = originalTimestamp;
        this.instigator = instigator;

        //UT Bug, this should be set here but gets set in the first timer call allowing new player to get points early
        //this.bScoreReady = false;

        this.scoreTime = 2;
        this.currentScoreGiven = 0;

        

    }

    getBuggyUTTimeLimitScore(remainingTime){

        if (this.gametypeInfo.timeLimit === 0) return 0.2;      

        //timelimit is int, 20 = 20 minutes
        //remainingTime is int, but it's in seconds

        const old = remainingTime;

        if(remainingTime < 1 && remainingTime > 0){
            remainingTime = 1;
        }
        //return 0.2;

        //console.log("now set to", remainingTime, "was", old);
        //always an int in UT
        //Last Timer call is always 1 Even when called at same time as endgame
        //End game call is always 0
        //remainingTime = Math.ceil(remainingTime);

        

        
        //if(remainingTime <= 1) return 0.2;

        let c = 0.2;


        if (remainingTime < 0.25 * this.gametypeInfo.timeLimit){
            if (remainingTime < 0.1 * this.gametypeInfo.timeLimit){
                c = 0.8;
            }else{
                c = 0.4;
            }
        }
    


        return c;
    }

    ping(timestamp, remainingTime){

        const diff = timestamp - this.lastTouchedTimestamp;

        if(!this.bScoreReady) return;
        let points = this.getBuggyUTTimeLimitScore(remainingTime);
        

        this.totalScoreGiven += points;
        this.currentScoreGiven += points;

        this.lastScoreGivenTimestamp = timestamp;
    }


    controlPointTimerPing(originalTimestamp){

        //console.log(this.name, originalTimestamp);
        this.scoreTime--;
        if(this.scoreTime > 0){
            this.bScoreReady = false;
        }else{
           // this.scoreTime = 0;
            this.bScoreReady = true;

            if(this.scoreTime === 0){
                this.currentFirstScoreGivenTimestamp = originalTimestamp;
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


    parseLine(timestamp, line, originalTimestamp){


        const capReg = /^controlpoint_capture\t(.+?)\t(\d+)$/i;

        const capResult = capReg.exec(line);

        if(capResult === null) return;

        this.pointNames.add(capResult[1]);

        const playerId = parseInt(capResult[2]);
        this.capEvents.push({
             "timestamp": originalTimestamp, 
             "scaledTimestamp": timestamp,
            "playerId": playerId, 
            "point": capResult[1],
            "type": "cap"
        });
      
    }

    async setPointIds(gameSpeed, gametypeInfo){

        const names = [...this.pointNames];

        const namesToIds = await getPointsIds(names);

        for(let i = 0; i < names.length; i++){

            const n = names[i];

            if(namesToIds[n] === undefined){
                namesToIds[n] = await createControlPoint(n);
            }
        }

        for(let i = 0; i < names.length; i++){

            this.controlPoints[names[i]] = new DomControlPoint(namesToIds[names[i]], names[i], gametypeInfo);
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



    addControlPointOwnPings(events, matchEnd){

        //this is always 1 for control points no matter the gamespeed
        const pingInterval = 1;
        const newEvents = [];

        const dummyControlPoints = {};

        for(let i = 0; i < events.length; i++){

            const e = events[i];

            if(e.type !== "cap") continue;
     

            if(dummyControlPoints[e.point] === undefined){
                dummyControlPoints[e.point] = new TestDomControlPoint(e.point);
            }

            dummyControlPoints[e.point].addTimestamp(e.timestamp);
        }


    

        for(let i = 0; i < events.length; i++){

            const e = events[i];

            newEvents.push(e);

            if(e.type !== "cap"){
                continue;
            }
            
            let nextTouchTime = dummyControlPoints[e.point].getNextTouchTimestamp();

        
            //no more touches after this
            if(nextTouchTime === -1) nextTouchTime = matchEnd// + pingInterval * 5;
       
            const diff = nextTouchTime - e.timestamp;
     
            if(diff <= 0) continue;            

            for(let x = e.timestamp + pingInterval; x < nextTouchTime; x+= pingInterval){
        
                newEvents.push({"type": "controlPointPing", "name": e.point, "timestamp": x});
            }
           
        }


        return newEvents;
    }

    

    pingAllControlPoints(timestamp, remainingTime){

        for(const [pointId, controlPoint] of Object.entries(this.controlPoints)){

            controlPoint.ping(timestamp, remainingTime);
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

            currentTimestamp = currentTimestamp;

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


    createMissingPings(pingInterval, matchEnd, matchStart, remainingTime){

        const timestamps = [...this.scoreUpdateTimestamps];
   
        const firstReal = timestamps[0];

        const first = firstReal - pingInterval * 5;

        timestamps.unshift(first);

        const testTimestamps = [];

        for(let i = 0; i < timestamps.length - 1; i++){

            const t = timestamps[i];

            if(t >= matchStart && t < matchEnd){
                remainingTime--;
            }

            console.log(remainingTime);

            testTimestamps.push({"type": "ping", "timestamp": t, remainingTime});

            
            for(let x = 1; x < 5; x++){

                const current = t + pingInterval * x;
                if(current >= matchEnd) break;

                if(current >= matchStart){
                    remainingTime--;
                }
                testTimestamps.push({"type": "ping", "timestamp": current, remainingTime});
            }
        }
        console.log(testTimestamps);
        console.log(matchStart, matchEnd);
        process.exit();
        return testTimestamps;
    }


    setPlayerCapStats(playerManager, matchStart, matchEnd, matchLength, gameSpeed, gametypeInfo, serverInfo){

        const pingInterval = 1 * gameSpeed;

        let remainingTime = gametypeInfo.timeLimit * 60;
        //1 second is always 1 seconds for UT when using timelimit, only log timestamps are affected by gamespeed/hardcore
        console.log(remainingTime);

        const timestamps = this.createMissingPings(pingInterval, matchEnd, matchStart, remainingTime);

        const newEvents = this.addControlPointOwnPings([...this.capEvents], matchEnd);

        newEvents.push(...timestamps);
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


        

        //process.exit();


        for(let i = 0; i < newEvents.length; i++){

            const e = newEvents[i];

            if(e.type === "cap"){

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
                continue;

            }else if(e.type === "controlPointPing"){

                //process.exit();
                const controlPoint = this.controlPoints[e.name];

                if(controlPoint === undefined){

                    new Message(`dom.setPlayerCapStats() controlPoint is undefined`, "warning");
                    continue;
                }

                controlPoint.controlPointTimerPing(e.timestamp, matchEnd-e.originalTimestamp);
                continue;

            }else if(e.type === "ping"){

                this.pingAllControlPoints(e.timestamp, remainingTime);

                if(gametypeInfo.timeLimit != 0 && e.timestamp >= matchStart){
                    
                   // remainingTime--;
                   // console.log(e.timestamp, matchStart, remainingTime);
                }

                continue;
            }
        }


        //remaining time is 0 at the end of the game when the last
        this.pingAllControlPoints(matchEnd, 0);
    

        console.log(gametypeInfo);
        console.log(this.getTotalControlPointScores(), "LOGFILE = ", this.getFinalLogScores());


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
                
                if(maxTime === 0 || pointData.totalControlTime === 0) continue;
                pointData.controlPercent = pointData.totalControlTime / maxTime * 100;
            }
        }
    }

    async insertPlayerMatchData(players, matchId, gametypeId, mapId){

        await insertPlayerMatchData(players, matchId, gametypeId, mapId);
    }
}