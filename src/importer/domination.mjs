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
    }

          /*  156.19	dom_score_update	0	34.200058
156.19	dom_score_update	1	10.999994
156.19	dom_score_update	2	3.600001
156.19	dom_score_update	3	10.399995 //59.200047999999995

156.19	teamscore	0	34
156.19	teamscore	1	10
156.19	teamscore	2	3
156.19	teamscore	3	10   //57*/

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


    //nextScoreTick is the next timer event, only start count ticks up after 1 tick after that
   // touched(timestamp, instigator, nextScoreTick){
    touched(pingId, latestPing, timestamp, instigator){

        
        if(this.instigator === null){
            this.firstTouchedTimestamp = timestamp;

        }else{

            const timeHeld = timestamp - this.lastTouchedTimestamp;
            this.totalCapTime += timeHeld;

            if(this.longestTimeControlled === null || this.longestTimeControlled < timeHeld){
                this.longestTimeControlled = timeHeld;
            }

            if(this.shortestTimeControlled === null || this.shortestTimeControlled > timeHeld){
                this.shortestTimeControlled = timeHeld;
            }  

            console.log(`TIMEHELD ${timeHeld}, ${pingId}, can score after ${this.canScoreAfterPing}`);
            console.log(pingId, this.canScoreAfterPing)

            console.log(`TIMESTAMP: ${timestamp}, LATESTPING ${latestPing}`);
            

            if(pingId >= this.canScoreAfterPing){

                const timeOffset = timestamp - this.lastTouchedTimestamp;

                if(timeOffset >= 1){

                    //console.log(timeOffset, "fasfasfasfsafsafsafsasfasfasffsafsa");
                   // console.log(`totalPingsAAAA ${pingId - this.canScoreAfterPing}`);

                    let totalTicks = pingId - this.canScoreAfterPing;

                   // console.log(`totalTicks = ${totalTicks}, ${totalTicks * 0.2}`);
                    let score = totalTicks * 0.2;
                    //if(bEnd) score = score - 0.2;
                    console.log(`I GOT POINTS`, score);

                    this.totalScoreGiven += score;
                }
            }else{
                new Message(pingId - this.canScoreAfterPing,"error");
            }
        }

        this.lastTouchedTimestamp = timestamp;
        this.totalCaps++; 

        this.lastPingId = pingId;
        //                   next ping + min 2 pings
        this.canScoreAfterPing = pingId + 1;
        this.lastScorePing = latestPing;
        this.instigator = instigator;

    }


    //always seems to be 0.6 off real value is match length is short?
    matchEnded(pingId, timestamp){

        //works if 1 touch until end

        if(this.instigator === null) return;

        let test = this.canScoreAfterPing ;

        console.log(`MATCH END`);
        console.log(`tick = ${pingId}, last tick = ${this.lastPingId}, can score after(${test})`);

        //if(pingId >= test){

                const offset = timestamp - this.lastTouchedTimestamp;

                if(offset >= 1){
                    console.log(`totalPings ${pingId - test}`);

                    let score = ((pingId - test) * 0.2);
                    //if(bEnd) score = score - 0.2;
                    console.log(`I GOT POINTbbbS`, score);

                    console.log(`total score was ${this.totalScoreGiven}`);
                    this.totalScoreGiven += score;
                    console.log(`total score is now ${this.totalScoreGiven}`);
                }
         //   }
        

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
        this.capEvents.push({"originalTimestamp":parseFloat(originalTimestamp.toFixed(2)), "timestamp": timestamp, "playerId": playerId, "point": capResult[1]});
      
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


    testtest(playerManager, matchEnd){

        const all = [...this.capEvents];

        const pings = [...this.scoreUpdateTimestamps];

        //last ping isn't a real one just the last log player/team scores
        for(let i = 0; i < pings.length - 1; i++){

            const p = pings[i];

           // console.log(p);

            if(i === 0){
                all.push({"type": "ping", "timestamp": p - 4});
            all.push({"type": "ping", "timestamp": p - 3});
            all.push({"type": "ping", "timestamp": p - 2});
            all.push({"type": "ping", "timestamp": p - 1});
            }

            all.push({"type": "ping", "bReal": "TRUE", "timestamp": p});
            all.push({"type": "ping", "timestamp": p + 1});
            all.push({"type": "ping", "timestamp": p + 2});
            all.push({"type": "ping", "timestamp": p + 3});
            all.push({"type": "ping", "timestamp": p + 4});
        }


        //console.log(all);

       // process.exit();



        all.sort((a, b) =>{
            a = a.timestamp;
            b = b.timestamp;

            if(a < b){
                return -1;
            }else if(a > b){
                return 1;
            }
            return 0;
        });


        

        let lastPing = 0;
        let pingId = -1;

        for(let i = 0; i < all.length; i++){

            
            const e = all[i];

            if(e.type === undefined){

                const player = playerManager.getPlayerById(e.playerId);
                
                if(player === null){
                    new Message(`dom.setPlayerCapStats() player is null`,"warning");
                    continue;
                }

                const controlPoint = this.controlPoints[e.point];

                if(controlPoint === undefined){

                    new Message(`dom.setPlayerCapStats() controlPoint is undefined`, "warning");
                    continue;
                }

               // console.log(player.name);

                //touched(pingId, latestPing, timestamp, instigator){
                controlPoint.touched(pingId, lastPing, e.timestamp, player, false);
            }

            if(e.type !== undefined){
              //  console.log("ping");
                lastPing = e.timestamp;
                pingId++;
                
            }

            continue;

            

        // console.log(`SCORET ICK = `,this.getScoreTick(c.originalTimestamp));

          //  const scoreTick = this.getScoreTick(e.timestamp);
           // controlPoint.touched(e.timestamp, player, scoreTick);
        }

        let totalPoints = 0;

        for(const [pointId, controlPoint] of Object.entries(this.controlPoints)){

            console.log(pingId);

            console.log(`totalPoints before ${controlPoint.totalScoreGiven}`);
            controlPoint.matchEnded(pingId, lastPing, controlPoint.instigator);

            totalPoints += controlPoint.totalScoreGiven;
        }

        console.log(`totalPoints = ${totalPoints}`);

    }

    setPlayerCapStats(playerManager, matchStart, matchEnd, matchLength, gameSpeed){


        //console.log(this.capEvents);
       // console.log(this.scoreUpdateTimestamps);


        this.testtest(playerManager, matchEnd);
        console.log(matchLength);
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