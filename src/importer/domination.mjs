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



     touchedINT2(instigator, timestamp){

        this.lastTouchedTimestamp = timestamp;
        this.instigator = instigator;

        this.bScoreReady = false;
        this.scoreTime = 2;

    }

    //always seems to be 0.6 off real value is match length is short?
    matchEndedINT(pingId, timestamp, instigator, pingInterval){

        return;
       
    }


    getBuggyUTTimeLimitScore(timeLimit, remainingTime){

        //timelimit is int, 20 = 20 minutes
        //remainingTime is int, but it's in seconds

        let c = 0.2;
		if ( timeLimit > 0 )
		{
			if ( remainingTime < 0.25 * timeLimit )
			{
				if ( remainingTime < 0.1 * timeLimit )
					c = 0.8;
				else
					c = 0.4;
			}
		}

        return c;
    }

    ping(){

        if(!this.bScoreReady) return;

        console.log(this.name, "+= 0.2");
        this.totalScoreGiven += 0.2;
    }


    controlPointTimerPing(timestamp){

        if(!this.bScoreReady){

            this.scoreTime--;

            if(this.scoreTime == 1){

                console.log(this.name, "is now score ready");
                this.bScoreReady = true;
            }
        }
    }

    end(){
        
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


    parseLine(intTimestamp, timestamp, line){


        const capReg = /^controlpoint_capture\t(.+?)\t(\d+)$/i;

        const capResult = capReg.exec(line);

        if(capResult === null) return;

        this.pointNames.add(capResult[1]);

        const playerId = parseInt(capResult[2]);
        this.capEvents.push({intTimestamp, "timestamp": timestamp, "playerId": playerId, "point": capResult[1]});
      
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


    createFakePings(matchEnd, pingInterval){

        const test = [];

        for(let i = 0; i < matchEnd; i+=pingInterval){

            test.push(i);
        }
        

        return test;
    }

    getClosestFakePing(intTimestamp){

        //should be ~ pingInterval * 5

   
        let minOffset = null;
        let bestMatch = null;

        for(let i = 0; i < this.fakePings.length; i++){

            const r = this.fakePings[i];

            const offset = intTimestamp - r;

            if(minOffset === null || Math.abs(offset) < minOffset){
                minOffset = offset;
                bestMatch = r;
            }


        }

        return bestMatch;
    }



    testAddControlPointOwnPings(events, pingInterval, matchEnd){

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

            dummyControlPoints[e.point].addTimestamp(e.intTimestamp);

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
       
            const diff = nextTouchTime - e.intTimestamp;

            if(diff >= pingInterval * 2){

                for(let x = e.intTimestamp + pingInterval; x < nextTouchTime ; x+=pingInterval){
                    newEvents.push({"type": "controlPointPing", "name": e.point, "intTimestamp": x});
                }
            } 
        }

        newEvents.sort((a, b) =>{

            a = a.intTimestamp;
            b = b.intTimestamp;

            if(a > b){
                return 1;
            }else if(a < b){
                return -1;
            }

            return 0;
        });

        return newEvents;
    }


    endMatch(){

        for(const controlPoint of Object.values(this.controlPoints)){

            controlPoint.end();
        }
    }

    testtest3(playerManager, matchEnd, pingInterval){

        const all =[...this.capEvents];

        const pings = [...this.scoreUpdateTimestamps];

        this.fakePings = this.createFakePings(matchEnd, pingInterval);


        for(let i = 0; i < pings.length; i++){

            const p = pings[i];
            const bestMatch = p//this.getClosestFakePing(p);

            if(i === 0){

                for(let x = 5; x > 0; x--){
                    all.push({"type": "ping", "intTimestamp": bestMatch - pingInterval * x});
                }
            }

            all.push({"type": "ping", "bReal": true, "intTimestamp": bestMatch, "bestMatch": bestMatch});

            let test = 1;
            if(i < pings.length - 2) test = 5;

            for(let x = 1; x < test; x++){

                const currentPing = bestMatch + pingInterval * x;
                if(currentPing > matchEnd) break;
                 all.push({"type": "ping", "intTimestamp": currentPing});
            }
        }


        all.sort((a, b) =>{

            a = a.intTimestamp;
            b = b.intTimestamp;

            if(a > b){
                return 1;
            }else if(a < b){
                return -1;
            }

            return 0;
        });


        const newEvents = this.testAddControlPointOwnPings(all, pingInterval, matchEnd);


        for(let i = 0; i < newEvents.length; i++){

            const e = newEvents[i];

            if(e.type !== undefined){

                if(e.type === "controlPointPing"){
            
                    const controlPoint = this.controlPoints[e.name];

                    if(controlPoint === undefined){

                        new Message(`dom.setPlayerCapStats() controlPoint is undefined`, "warning");
                        continue;
                    }

                    controlPoint.controlPointTimerPing(e.intTimestamp);

                    continue;
                }else{

                    this.pingAllControlPoints();

                }

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

            // console.log(player.name);
                console.log(controlPoint.name, " touched at", e.intTimestamp, controlPoint.totalScoreGiven);
                //touched(pingId, latestPing, timestamp, instigator){
                controlPoint.touchedINT2(player, e.intTimestamp);
            }
        }

        this.endMatch();
        console.log(matchEnd);
        console.log(this.getTotalControlPointScores(), "LOGFILE = ", this.getFinalLogScores());
        return;

    }
    

    pingAllControlPoints(intTimestamp, bEnd){

        for(const [pointId, controlPoint] of Object.entries(this.controlPoints)){

            controlPoint.ping(intTimestamp, bEnd);
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

    setPlayerCapStats(playerManager, matchStart, matchEnd, matchLength, gameSpeed, gametypeInfo, serverInfo){


        //console.log(this.capEvents);
       // console.log(this.scoreUpdateTimestamps);

       //1 second
       const pingInterval = 100;

       const realPingInterval = pingInterval + gameSpeed - 100;

       console.log(pingInterval, realPingInterval);

      

        this.testtest3(playerManager, matchEnd, realPingInterval);
   
        //this.pingAllControlPoints();
        console.log(this.getTotalControlPointScores());
       // COMPARE TOTAL SCORE WITH CONTROL POINTS TOTAL SCORE TO SEE WHEN SCORES START TO DRIFT APART
        //console.log(this.teamScoreTimestamps);

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