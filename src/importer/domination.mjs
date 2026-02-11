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



     touchedINT2(instigator){

        this.instigator = instigator;

        this.bScoreReady = false;
        this.scoreTime = 2;

    }

    //always seems to be 0.6 off real value is match length is short?
    matchEndedINT(pingId, timestamp, instigator, pingInterval){

        return;
       
    }


    ping(intTimestamp, bEnd){

        console.log(this.name, "ping");

        if(bEnd){
            console.log(`horse noise`);

            const offsetSinceLastScoreGiven = intTimestamp - this.lastScoreGivenPing;
            console.log(offsetSinceLastScoreGiven);
            console.log(this.lastScoreGivenPing, this.scoreTime, this.bScoreReady);

            //this.scoreTime--;

            /*if(this.scoreTime === 1){
                console.log(this.totalScoreGiven,`GIVE POINTS`, this.name);
                this.totalScoreGiven += 0.2;
                console.log(`now = ${this.totalScoreGiven}`);
                return;
            }*/
            //this shouldnt give scores but ut looks like it does
            //CHANGE THIS TO PING INTERVAL NOT 100
            if(offsetSinceLastScoreGiven != 0 && !this.bScoreReady) this.totalScoreGiven+=0.2;
            return;
        }

        this.latestPing = intTimestamp;

        if(this.instigator === null){
         //   console.log(`${this.name} is not active yet`);
            return;
        }

        this.scoreTime--;

        if(this.scoreTime > 0 && !this.bScoreReady){
            this.bScoreReady = false;
            console.log(this.name, "is not score ready", this.scoreTime, intTimestamp);

        }
        
        if(this.scoreTime === 0){
            this.bScoreReady = true;
            console.log(this.name, "is now scoreReady", intTimestamp);
        }

        if(this.bScoreReady){

            console.log(this.name, "+0.2", intTimestamp);
            this.lastScoreGivenPing = intTimestamp;
            this.totalScoreGiven += 0.2;//+= (0.2 * this.scoreTicks);
            return;
            
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

           // console.log("target",intTimestamp,"off",offset);

        }
        //console.log(`best match`, bestMatch);

        return bestMatch;
    }


    testtest3(playerManager, matchEnd, pingInterval){

        const all =[...this.capEvents];

        const pings = [...this.scoreUpdateTimestamps];

        this.fakePings = this.createFakePings(matchEnd, pingInterval);


        for(let i = 0; i < pings.length; i++){

            const p = pings[i];
            const bestMatch = p//this.getClosestFakePing(p);

            //if(Math.abs(p - bestMatch) > pingInterval) throw new Error(`dfasfasfsdfsa`);


            if(i === 0){

                for(let x = 5; x > 0; x--){
                    all.push({"type": "ping", "intTimestamp": bestMatch - pingInterval * x});
                }
            }

            all.push({"type": "ping", "bReal": true, "intTimestamp": bestMatch, "bestMatch": bestMatch});

            let test = 5;
            if(i === pings.length - 2) test = 1;

            for(let x = 1; x < test; x++){

                const currentPing = bestMatch + pingInterval * x;
                if(currentPing >= matchEnd) break;
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



        let firstDiffTimestamp = null;


        let lastTimestamp = 0;

        for(let i = 0; i < all.length; i++){

            const e = all[i];
            //console.log(e);

            console.log(e.intTimestamp, lastTimestamp);

            const target = e.intTimestamp;

            if(target === lastTimestamp){
                continue;
                console.log(all[i - 1]);
                console.log(e);
                process.exit();
            }


            const bestMatch = this.getClosestFakePing(target);
            //console.log(target, bestMatch);

            if(e.type !== undefined){


            // console.log(maxUnderOffset, maxOverOffset, minTotalOffset, maxTotalOffset);
                this.pingAllControlPoints(e.intTimestamp, false);

                //console.log(`PING @ ${e.intTimestamp}, matchEnds at ${matchEnd}`);

                if(e.bReal !== undefined){

                    const totalScore = this.getLogScoresAt(e.intTimestamp);
                    
                    const totalScore2 = this.getTotalControlPointScores();

                    console.log("Latest Log scores total @ ", e.intTimestamp, "=", totalScore, "our method", totalScore2);
                    //console.log("Total Points From Control Points SHOULD BE SAME AS ABOVE",totalScore2);

                    const diff = totalScore2 - totalScore;
                    if(diff !== 0 && firstDiffTimestamp === null){
                        firstDiffTimestamp = e.intTimestamp;
                    }
                    console.log(diff, "fuggggg", e.intTimestamp);

                    //if(diff !== 0) process.exit();

                    //if(totalScore > 1) process.exit();
                }else{
                    const totalScore = this.getTotalControlPointScores();
                    console.log("- our pingInterval ", e.intTimestamp,totalScore);
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
                console.log(controlPoint.name, " touched at", e.intTimestamp, controlPoint.totalScoreGiven);
                //touched(pingId, latestPing, timestamp, instigator){
                controlPoint.touchedINT2(player);
            }  

            lastTimestamp = e.intTimestamp;
        }
        


       // console.log(all.reverse());

        this.pingAllControlPoints(matchEnd,true);

        const endLogScore = this.getFinalLogScores();
        const endImporterScore = this.getTotalControlPointScores();

        console.log("LOGSCORE",endLogScore);
        console.log(`IMPORTER score`, endImporterScore);
        console.log(`totalOffset `, (endImporterScore - endLogScore));

        new Message(`First offset of scores at ${firstDiffTimestamp}`,"error");
        console.log(`${matchEnd} <- matchEnd`);
        
        
        //process.exit();
    }
    

    testtest2(playerManager, matchEnd, pingInterval){

        process.exit();
        const all =[...this.capEvents];

        const pings = [...this.scoreUpdateTimestamps];

        this.fakePings = this.createFakePings(matchEnd, pingInterval);



        for(let i = 0; i < pings.length - 1; i++){

            const p = pings[i];
            const bestMatch = this.getClosestFakePing(p);

            all.push({"type": "ping", "bReal": true, "intTimestamp": bestMatch, "bestMatch": bestMatch});

        }

        console.log(all);

        

        let firstRealPing = 0;
        let lastRealPing = 0;

        let roundingErrors = 0;
        //0 would be no total offset
        let totalRoundingOffset = 0;

        let previousPing = 0;

        let totalOffset = 0;

        let maxOverOffset = 0;
        let maxUnderOffset = 0;

        let maxTotalOffset = 0;
        let minTotalOffset = 0;


       // process.exit();

        //last ping isn't a real one just the last log player/team scores
        for(let i = 0; i < pings.length - 1; i++){


            let p = pings[i];

            
            

            if(i === 0){

                firstRealPing = p;
                //all.push({"type": "ping", "intTimestamp": p - pingInterval * 4});
                //all.push({"type": "ping", "intTimestamp": p - pingInterval * 3});
                //all.push({"type": "ping", "intTimestamp": p - pingInterval * 2});
                //all.push({"type": "ping", "intTimestamp": p - pingInterval});


                for(let x = p; x > 0; x-= pingInterval){
                    console.log(`x is now ${x}`);
                    all.push({"type": "ping", "intTimestamp": x});
                }

              
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

                
                //console.log(nextFakePing, nextRealPing);

                //console.log(nextFakePing - nextRealPing);

                offset =  nextRealPing - nextFakePing;

                if(offset > maxOverOffset){
                    maxOverOffset = offset;
                }

                if(offset < maxUnderOffset){
                    maxUnderOffset = offset;
                }

                //console.log(`under ${maxUnderOffset}, over ${maxOverOffset}`);

                totalOffset += offset;
                //process.exit();

                if(totalOffset > maxTotalOffset){
                    maxTotalOffset = totalOffset;
                }

                if(totalOffset < minTotalOffset){
                    minTotalOffset = totalOffset;
                }

                //console.log(`mTotal = ${minTotalOffset}, maxTotal = ${maxTotalOffset}`);
                //all.push({"type": "ping", "intTimestamp": p + pingInterval * 5});
            }

            //console.log("offset, p,pingInterval");
            //console.log(offset, p,pingInterval, totalOffset);

            console.log(p, testPings[i * 5]);

            all.push({"type": "ping", "bReal": true, "intTimestamp": p, "totalOffset": 0, "offset": 0,
                "totalOffset": totalOffset,
                    "offset": offset,
                    maxUnderOffset, 
                    maxOverOffset, 
                    minTotalOffset, 
                    maxTotalOffset
            });

            for(let x = 1; x < 5; x++){
                all.push({
                    "type": "ping", 
                    "intTimestamp": p + pingInterval * x,
                    "totalOffset": totalOffset,
                    "offset": offset,
                    maxUnderOffset, 
                    maxOverOffset, 
                    minTotalOffset, 
                    maxTotalOffset
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

        process.exit();
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

               // console.log(maxUnderOffset, maxOverOffset, minTotalOffset, maxTotalOffset);
                this.pingAllControlPoints(e.intTimestamp, e.totalOffset, pingInterval, e.maxUnderOffset, 
                    e.maxOverOffset, 
                    e.minTotalOffset, 
                    e.maxTotalOffset );

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
        console.log(`matchEnd = ${matchEnd}`);
        console.log("LOGSCORE",this.getLogScoresAt(matchEnd));

       //process.exit();
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

        console.log(gameSpeed - 100);

       const realPingInterval = pingInterval + gameSpeed - 100;

       console.log(pingInterval, realPingInterval);

      


       // this.testtest(playerManager, matchEnd);
        //console.log(matchLength);
        //console.log(arguments);

        //console.log(realPingInterval);

       // console.log(this.teamScoreTimestamps);

        this.testtest3(playerManager, matchEnd, realPingInterval);
        console.log(gametypeInfo);
        console.log(serverInfo);
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