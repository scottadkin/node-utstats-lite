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

        this.totalScoreGiven = 0;


        this.bScoreReady = false;
        this.scoreTime = 2;
    }


    updatePointsGiven(timeHeld, totalTicks){

        //0.2 per second after 2 * gamespeed seconds held by same player/team

        const scorePerTick = 0.2;
        const minTimeRequired = 2 * this.gameSpeed;

        let scoreTime = 0;
        
        let score = 0;

        if(totalTicks >= 2){

            const extra = totalTicks//Math.ceil(timeHeld - minTimeRequired);
            score = scorePerTick * (totalTicks );

            scoreTime = timeHeld - minTimeRequired;

            this.totalScoreTime += timeHeld - minTimeRequired;
            this.totalScoreGiven += score;
        }

        return {score, scoreTime};
    }


     touchedINT(pingId, latestPing, timestamp, instigator, pingInterval){

        if(this.instigator === null){

            this.firstTouchedTimestamp = timestamp;

        }else{

            /*const timeHeld = timestamp - this.lastTouchedTimestamp;

            if(pingId >= this.canScoreAfterPing){

                const timeOffset = timestamp - this.lastTouchedTimestamp;

                console.log(timeOffset, pingInterval * 2);

               // if(timeOffset >= pingInterval * 2){

                    let totalTicks = pingId - this.canScoreAfterPing;


                    let score = totalTicks * 0.2;
                    //if(bEnd) score = score - 0.2;
                    console.log(`I GOT POINTS`, score, timeOffset);

                    this.totalScoreGiven += score;
              //  }
              
            }else{
                new Message(pingId - this.canScoreAfterPing,"error");
            }*/
        }

        this.lastTouchedTimestamp = timestamp;
        this.totalCaps++; 

        this.lastPingId = pingId;
        //                   next ping + min 2 pings
        //this.canScoreAfterPing = pingId + 1;
        this.lastScorePing = latestPing;
        this.instigator = instigator;

        this.bScoreReady = false;
        this.scoreTime = 2;

    }

    //always seems to be 0.6 off real value is match length is short?
    matchEndedINT(pingId, timestamp, instigator, pingInterval){

        return;
        if(this.instigator === null) return;

        //let test = this.canScoreAfterPing ;

        console.log(`MATCH END`);
        console.log(`tick = ${pingId}, last tick = ${this.lastPingId}, can score after(${this.canScoreAfterPing})`);

        //if(pingId >= test){

                const offset = timestamp - this.lastTouchedTimestamp;
                console.log(`time offset was ${offset}, ${pingInterval} ${(pingInterval * 2)}`);

                if(offset >= pingInterval * 2){
                    console.log("HORSE NOISE", offset / pingInterval);

                    console.log(Math.floor(offset / pingInterval));

                    const totalPings = Math.floor(offset / pingInterval);

                    console.log(totalPings, 0.2 * totalPings);

                    const score = totalPings * 0.2;

                    this.totalScoreGiven += score;
                }

                return;

               // if(offset >= pingInterval){
                    console.log(`totalPings ${pingId - test}`);

                    let score = ((pingId - test) * 0.2);
                    //if(bEnd) score = score - 0.2;
                    console.log(`I GOT POINTbbbS`, score);

                    this.totalScoreGiven += score;
                //}
         //   }

    }


    ping(intTimestamp, totalOffset, pingInterval){

        //console.log(this.name, "PINGED");

        this.scoreTime--;

        if(this.scoreTime >= 0){
            this.bScoreReady = false;
            
            //this.scoreTicks = 0;
            //console.log(`${this.name} is now score ready`);
        }else{
            this.bScoreReady = true;
            this.scoreTime = 0;
        }

        if(this.instigator === null){
         //   console.log(`${this.name} is not active yet`);
            return;
        }

        const offset = intTimestamp - this.lastTouchedTimestamp;

            console.log(`offset = ${offset}`);

        const lowerLimit = pingInterval - 1 + totalOffset;
        const upperLimit = pingInterval + 1 + totalOffset;

        if(offset >= lowerLimit){

            

            this.totalScoreGiven += 0.2;//+= (0.2 * this.scoreTicks);

        }else if(offset >= lowerLimit && offset <= upperLimit){
             this.totalScoreGiven += 0.2;//+= (0.2 * this.scoreTicks);
            
        }

        

        
        
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

    testtest2(playerManager, matchEnd, pingInterval){

        const all =[...this.capEvents];

        const pings = [...this.scoreUpdateTimestamps];

        let firstRealPing = 0;
        let lastRealPing = 0;

        let roundingErrors = 0;
        //0 would be no total offset
        let totalRoundingOffset = 0;

        let previousPing = 0;

        let totalOffset = 0;

        //last ping isn't a real one just the last log player/team scores
        for(let i = 0; i < pings.length - 1; i++){


            let p = pings[i];

            
            

            if(i === 0){

                firstRealPing = p;
               // all.push({"type": "ping", "intTimestamp": p - pingInterval * 4});
               // all.push({"type": "ping", "intTimestamp": p - pingInterval * 3});
               // all.push({"type": "ping", "intTimestamp": p - pingInterval * 2});
               // all.push({"type": "ping", "intTimestamp": p - pingInterval});

              
                /*for(let x = 1; x < 4; x++){

                    const current = p - pingInterval * x;
                    if(p < 0) break;
                    all.push({"type": "ping", "intTimestamp": current});
      
                }*/
                
            
            }

            const nextFakePing = p + pingInterval * 5;
            const nextRealPing = pings[i + 1] ?? null;

            let offset = 0;

            if(i + 1 < pings.length - 1 && nextRealPing !== null && nextFakePing !== nextRealPing){

                
                console.log(nextFakePing, nextRealPing);

                console.log(nextFakePing - nextRealPing);

                offset =  nextRealPing - nextFakePing;

                totalOffset += offset;
                //process.exit();
                //all.push({"type": "ping", "intTimestamp": p + pingInterval * 5});
            }

            console.log("offset, p,pingInterval");
            console.log(offset, p,pingInterval, totalOffset);

            all.push({"type": "ping", "bReal": true, "intTimestamp": p, "totalOffset": 0, "offset": 0});

            for(let x = 1; x < 5; x++){
                all.push({
                    "type": "ping", 
                    "intTimestamp": p + pingInterval * x,
                    "totalOffset": totalOffset,
                    "offset": offset
                });
        
            }
            

           

            /*if(i === pings.length - 1){

                for(let x = 5; x < 100; x++){
                    all.push({"type": "ping", "intTimestamp": p + pingInterval * x});
                }
                
               
            }*/
            lastRealPing = p;

            if(i > 1){
                //console.log(`######`);
                

                const diff = lastRealPing - pings[i - 1];
                //console.log(diff, pingInterval);
                if(diff !== pingInterval * 5){

                    roundingErrors++;
                    totalRoundingOffset += diff - (pingInterval * 5);

                    new Message(`Rounding error, ${diff - (pingInterval * 5)}`,"error");
                }
            }
        }

       // console.log(firstRealPing, lastRealPing);

        new Message(`Total rounding errors = ${roundingErrors}, totalOffset = ${totalRoundingOffset}`, "error");

       // console.log(roundingErrors, totalRoundingOffset);

       


        all.sort((a, b) =>{
            a = a.intTimestamp;
            b = b.intTimestamp;

            if(a < b){
                return -1;
            }else if(a > b){
                return 1;
            }
            return 0;
        });
       // console.log(all);


        let latestPing = -900;
        let pingId = 0;

        for(let i = 0; i < all.length; i++){

            const e = all[i];


            if(e.type !== undefined){
                
                latestPing = e.intTimestamp;
                pingId++;
                //console.log(i, pingId, latestPing);

                this.pingAllControlPoints(e.intTimestamp, e.totalOffset, pingInterval);

                //console.log(`PING @ ${e.intTimestamp}, matchEnds at ${matchEnd}`);

                if(e.bReal !== undefined){

                    const totalScore = this.getLogScoresAt(e.intTimestamp);
                    
                    const totalScore2 = this.getTotalControlPointScores();

                    console.log("Latest Log scores total @ ", e.intTimestamp, "=", totalScore, "our method", totalScore2);
                    //console.log("Total Points From Control Points SHOULD BE SAME AS ABOVE",totalScore2);

                    const diff = totalScore2 - totalScore;
                    console.log(diff);

                    //if(diff !== 0) process.exit();

                    //if(totalScore > 1) process.exit();
                }else{
                    const totalScore = this.getTotalControlPointScores();
                    console.log("- our pingIntervals ", e.intTimestamp,totalScore);
                }

            }else{

                //console.log(e.intTimestamp - latestPing, e.intTimestamp, latestPing, "GFDSAGISDJHGOIHSDOKIGNSDOIKGNSODKNG");
                
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
                console.log(controlPoint.name, " touched at", e.intTimestamp);
                //touched(pingId, latestPing, timestamp, instigator){
                controlPoint.touchedINT(pingId, latestPing, e.intTimestamp, player, pingInterval);
            }  
        }

        //process.exit();
         let totalPoints = 0;

        for(const [pointId, controlPoint] of Object.entries(this.controlPoints)){

            console.log(pingId);

            console.log(`${controlPoint.name} ${controlPoint.totalScoreGiven}`);
            //controlPoint.matchEndedINT(pingId, matchEnd, controlPoint.instigator, pingInterval);

            totalPoints += controlPoint.totalScoreGiven;
        }

        console.log(`totalPoints = ${totalPoints}`);

       //process.exit();
    }

    pingAllControlPoints(intTimestamp, totalOffset, pingInterval){

        for(const [pointId, controlPoint] of Object.entries(this.controlPoints)){

            controlPoint.ping(intTimestamp, totalOffset, pingInterval);
        }
    }

    getLogScoresAt(timestamp){

        timestamp = parseInt(timestamp);
        let totalScore = 0;

        for(let [currentTimestamp, scores] of Object.entries(this.teamScoreTimestamps)){

            currentTimestamp = parseInt(currentTimestamp);

            if(currentTimestamp > timestamp) break;

            if(currentTimestamp < timestamp) continue;

            for(let i = 0; i < scores.length; i++){

                totalScore += parseFloat(scores[i].score);
            }

            break;
        }

        return totalScore;
    }

    setPlayerCapStats(playerManager, matchStart, matchEnd, matchLength, gameSpeed){


        //console.log(this.capEvents);
       // console.log(this.scoreUpdateTimestamps);

       //1 second
       const pingInterval = 100;

        console.log(gameSpeed - 100);

       const realPingInterval = pingInterval + gameSpeed - 100;

       console.log(pingInterval, realPingInterval);

      


       // this.testtest(playerManager, matchEnd);
        console.log(matchLength);
        console.log(arguments);

        console.log(realPingInterval);

        console.log(this.teamScoreTimestamps);

        this.testtest2(playerManager, matchEnd, realPingInterval);

       // COMPARE TOTAL SCORE WITH CONTROL POINTS TOTAL SCORE TO SEE WHEN SCORES START TO DRIFT APART
        //console.log(this.teamScoreTimestamps);
        return;
        process.exit();
        //this.getTimeThing(gameSpeed);

        console.log(`gameSpeed is ${gameSpeed}`);

        
        const pingIntervals = 1//1 * gameSpeed;

        this.testPingIntervals(pingIntervals, matchStart, matchEnd);
        console.log(pingIntervals);
        //process.exit();

        //process.exit();
  
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

           // console.log(`SCORET ICK = `,this.getScoreTick(c.originalTimestamp));

            const scoreTick = this.getScoreTick(c.timestamp);
            //controlPoint.touch/ed(c.timestamp, player, scoreTick);

        }


        //match ended need to update the current player stats that have control of points

        let totalPoints = 0;

        console.log(`matchEND ${matchEnd}, matchLength ${matchLength} last tick timestamp = ${this.scoreTicks[this.scoreTicks.length - 1]}`);

        const boring = [...this.scoreTicks];
        for(const controlPoint of Object.values(this.controlPoints)){

            const nextScoreTick = this.getScoreTick( boring[boring.length - 2]);
            console.log(`nexticsk fskfs = ${nextScoreTick}`);
            controlPoint.matchEnded(matchEnd, nextScoreTick ); // add + 1?
            totalPoints += controlPoint.totalScoreGiven;
            console.log("controlPoint.totalScoreGiven, controlPoint.totalScoreTime");
            console.log(controlPoint.totalScoreGiven, controlPoint.totalScoreTime);
        }
        
        console.log(`totalpoints `, totalPoints);

        //process.exit();
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