import { getPointsIds, createControlPoint, insertPlayerMatchData } from "../domination.mjs";
import { scalePlaytime } from "../generic.mjs";
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


        this.bBeenScoreReady = false;
        this.bScoreReady = false;
        this.scoreTime = 2;
        this.currentFirstScoreGivenTimestamp = -999;
        this.currentScoreGiven = 0;
        this.controlPercent = 0;


        //Points given to wrong player because of the bScoreReady bug
        this.totalStolenPoints = 0;
        this.teamScores = [0,0,0,0];
        this.stolenTeamScores = [0,0,0,0];
        this.currentStolenPoints = 0;
        //caps where the new player stole points
        this.stolenCaps = 0;
    }


    calcCurrentScore(timestamp){

        const timeHeld = timestamp - this.lastTouchedTimestamp;

        let scoreTimeHeld = 0;

    
        if(this.bScoreReady){
            scoreTimeHeld = timestamp - this.currentFirstScoreGivenTimestamp;
        }


        this.instigator.updateDomControlPointStats(
            this.id, timeHeld, 
            this.currentScoreGiven, scoreTimeHeld, 
            this.currentStolenPoints
        );
        

        this.totalScoreTime += scoreTimeHeld;
        this.totalControlTime += timeHeld;
    }

     touched(instigator, originalTimestamp, scaledTimestamp){

        //console.log(this.name, "touched ", originalTimestamp);

        if(this.instigator === null){
            this.firstTouchedTimestamp = scaledTimestamp;
        }else{


           this.calcCurrentScore(scaledTimestamp);
        }

        this.lastTouchedTimestamp = scaledTimestamp;
        this.instigator = instigator;

        //UT Bug, this should be set here but gets set in the first timer call allowing new player to get points early
        //this.bScoreReady = false;

        this.scoreTime = 2;
        this.currentScoreGiven = 0;
        this.currentStolenPoints = 0;

        

    }

    getBuggyUTTimeLimitScore(remainingTime){

        if (this.gametypeInfo.timeLimit === 0) return 0.2;      

        if(remainingTime <= 0) remainingTime = 1;
        //timelimit is int, 20 = 20 minutes
        //remainingTime is int, but it's in seconds

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

        //console.log(this.name, remainingTime);
        if(this.instigator === null) return;
        if(!this.bScoreReady) return;
        let points = this.getBuggyUTTimeLimitScore(remainingTime);
  
        this.totalScoreGiven += points;
        this.currentScoreGiven += points;

        const playerTeam = this.instigator.getTeamAt(timestamp);

        if(playerTeam !== null){
            this.teamScores[playerTeam] += points;
        }

        if(this.bScoreReady && this.scoreTime === 2){
      
            this.totalStolenPoints += points;
            this.stolenCaps++;

            if(playerTeam !== null){
                this.stolenTeamScores[playerTeam] += points;
            }

            this.currentStolenPoints += points;
  
        }


        this.lastScoreGivenTimestamp = timestamp;

        this.lastRemainingTime = remainingTime;

    }


    controlPointTimerPing(originalTimestamp, scaledTimestamp){

        this.scoreTime--;
        if(this.scoreTime < 0) return;

        if(this.scoreTime > 0){
            this.bScoreReady = false;
        }else if(this.scoreTime === 0){
           // this.scoreTime = 0;
            this.bScoreReady = true;

            if(!this.bBeenScoreReady) this.bBeenScoreReady = true;

            this.currentFirstScoreGivenTimestamp = scaledTimestamp;
            
        }
    }


    matchEnd(scaledTimestamp){

        if(this.instigator === null){
            this.firstTouchedTimestamp = scaledTimestamp;
        }else{
           this.calcCurrentScore(scaledTimestamp);
        }
    }
}


class TestDomControlPoint{

    constructor(name){

        this.name = name;
        this.touchTimestamps = [];
        this.currentTimestampIndex = 0;
        this.remainingTime = 0;
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

        this.debugScores = [];

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


    createMissingPings(pingInterval, matchEnd, matchStart, gametypeInfo, countdownStartTimestamp){

        const timestamps = [...this.scoreUpdateTimestamps];

        const testTimestamps = [];

        for(let i = 0; i < timestamps.length; i++){

            const t = timestamps[i];

            if(t > matchEnd) break;

            if(i === 0){

                 for(let x = countdownStartTimestamp; x < t; x+= pingInterval){

                    if(x > countdownStartTimestamp){
                        this.remainingTime--;
                    }
                    testTimestamps.push({"type": "ping", "bReal": false, "timestamp": x, "remainingTime": this.remainingTime});
                }
            }
 

            if(t >= countdownStartTimestamp){
                
                this.remainingTime--;
            }

            testTimestamps.push({"type": "ping", "bReal": true, "timestamp": t, "remainingTime": this.remainingTime});


            for(let x = 1; x < 5; x++){

                let current = t + pingInterval * x;

                if(current >= matchEnd){
                    break;
                }


                if(current >= countdownStartTimestamp){
                    this.remainingTime--;
                }

                if(Math.round(current) === Math.round(matchEnd)){
                    //just use the match end and end pings
                    //we don't want a fake one and the real match end to be called very close too each other
                    // this will give players and teams 2 lots of score updates instead of 1
                  
                    testTimestamps.push({
                        "type": "ping",
                        "bFakeEnd": true, 
                        "bReal": false, 
                        "timestamp": matchEnd, 
                        "remainingTime": this.remainingTime
                    });
                    break;
                   // process.exit();
                }

                testTimestamps.push({"type": "ping", "bReal": false, "timestamp": current, "remainingTime": this.remainingTime});
            }
        }

        return testTimestamps;
    }


    setDebugScores(){

        this.testScores = {};

        for(const [intTimestamp, data] of Object.entries(this.teamScoreTimestamps)){

            let t = data[0].originalTimestamp;

            this.testScores[t] = {
                "totalScore": 0,
            };

            for(let x = 0; x < data.length; x++){


                const d =data[x];
                this.testScores[t][d.teamId] = d.score;
                this.testScores[t].totalScore += parseFloat(d.score);

                if(x>=3) break;
            }
        }
    }


    getScoreAt(timestamp){

        timestamp = timestamp.toFixed(2);

        if(this.testScores[timestamp] !== undefined){
            return {...this.testScores[timestamp], timestamp};
        }

        return -1;
    }

    setPlayerCapStats(playerManager, matchStart, matchEnd, matchLength, gameSpeed, gametypeInfo, countdownStartTimestamp, scaledMatchEnd, scaledMatchLength){

        this.setDebugScores();

        this.scoreOffsets = [];

        //process.exit();
        const pingInterval = 1 * gameSpeed;

        this.remainingTime = gametypeInfo.timeLimit * 60;
        //1 second is always 1 seconds for UT when using timelimit, only log timestamps are affected by gamespeed/hardcore

        const timestamps = this.createMissingPings(
            pingInterval, 
            matchEnd, 
            matchStart, 
            gametypeInfo,
            countdownStartTimestamp
        );

        const newEvents = this.addControlPointOwnPings([...this.capEvents], matchEnd);


        newEvents.push(...timestamps);

        newEvents.sort((a, b) =>{

            if(a.timestamp > b.timestamp){
                return 1;
            }else if(a.timestamp < b.timestamp){
                return -1;
            }

            return 0;
        });

        let lastTimestamp = -9999;
        
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

                controlPoint.touched(player, e.timestamp, e.scaledTimestamp);
                continue;

            }else if(e.type === "controlPointPing"){

                //process.exit();
                const controlPoint = this.controlPoints[e.name];

                if(controlPoint === undefined){

                    new Message(`dom.setPlayerCapStats() controlPoint is undefined`, "warning");
                    continue;
                }

                controlPoint.controlPointTimerPing(e.timestamp, scalePlaytime(e.timestamp, gameSpeed));
                continue;

            }else if(e.type === "ping"){

                //some timelimit games have duplicate dom_score_updates at the end but the scores are the same so ignore the 2nd
                if(e.timestamp === lastTimestamp) continue;
                lastTimestamp = e.timestamp;
              

                this.pingAllControlPoints(e.timestamp, e.remainingTime);
                
                const realScore = this.getScoreAt(e.timestamp);

                if(realScore !== -1){

                    const calcScore = this.getTotalControlPointScores();

                    this.scoreOffsets.push({
                        "timestamp": e.timestamp, 
                        "remainingTime": e.remainingTime, 
                        "realScoreTeamScores": realScore,
                        "realScore": realScore.totalScore,
                        "importerScore": calcScore,
                        "scoreOffset": realScore.totalScore - calcScore
                    });
                    
                    //console.log("get scores at", e.timestamp, realScore.totalScore, calcScore, realScore.totalScore - calcScore, e.bReal);
                }

                continue;
            }
        }

        //make sure to give players that last amount of points if any

        for(const controlPoint of Object.values(this.controlPoints)){

            controlPoint.matchEnd(scaledMatchEnd);
        }

        const finalScore = this.getFinalLogScores();
        let importerScore = this.getTotalControlPointScores();

        const offset = importerScore - finalScore;
  
        for(let i = 0; i < playerManager.players.length; i++){

            const p = playerManager.players[i];
            console.log(p.stats.dom);
        }

        console.log(
            "MATCHEND", matchEnd,
            "importer", importerScore, 
            "LOGFILE = ",finalScore, 
            "scoreOffset =", offset,
            "errorPercent",Math.abs( 100 - (finalScore / importerScore) * 100),
            `Tournament Mode = ${gametypeInfo.bTournamentMode}`, 
            `TargetScore = ${gametypeInfo.targetScore}`, 
            `Timelimit = ${gametypeInfo.timeLimit}`,
            `GAMESPEED = ${gametypeInfo.gameSpeed}`);


        this.setPercentValues(playerManager, scaledMatchLength);

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