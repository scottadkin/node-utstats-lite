import { getTeamName } from "../generic.mjs";
import Message from "../message.mjs";

export default class ctfFlag{

    constructor(team){

        this.team = team;
        //the team of the enemy that is holding the flag
        this.enemyTeam = null;

        this.caps = [];
        this.returns = [];
        this.bDropped = false;
        this.takenTimestamp = null;
        this.lastPickupTimestamp = null;
        this.droppedTimestamp = null;
        this.takenBy = null;
        this.totalTimeDropped = 0;

        //keep track of kills while a flag is taken
        this.kills = {};

        this.carriers = [];
        this.covers = [];
        this.drops = [];

        this.reset();
    }

    reset(){

        this.bDropped = false;
        this.takenTimestamp = null;
        this.droppedTimestamp = null;    
        this.lastPickupTimestamp = null;
        this.takenBy = null;
        this.enemyTeam = null;

        this.carriers = [];
        this.covers = [];
        this.drops = [];
        this.kills = {};
        this.totalTimeDropped = 0;
    }

    calcCarryTime(timestamp){

        let carryTime = 0;

        const totalTime = timestamp - this.takenTimestamp;

        if(this.drops.length === 0){
            return {"carryTime": totalTime, totalTime};
        }

        
        for(let i = 0; i < this.drops.length; i++){

            const d = this.drops[i];
            carryTime += d.carryTime;
        }



        return {carryTime, totalTime}
    }

    returned(timestamp, playerId){

        const {carryTime, totalTime} = this.calcCarryTime(timestamp);

        this.returns.push({
            "timestamp": timestamp, 
            "carriers": [...this.carriers], 
            "covers": [...this.covers], 
            "drops": [...this.drops],
            "playerId": playerId,
            "carryTime": carryTime,
            "dropTime": this.totalTimeDropped,
            "totalTime": totalTime
        });

        this.reset();
    }

    timedOutReturn(timestamp){

        this.returned(timestamp, -1);
    }

    captured(playerManager, killsManager, timestamp, playerId, cappingTeam){

        this.updateLastCarrier(timestamp);

        const {carryTime, totalTime} = this.calcCarryTime(timestamp);

        const uniqueCarriers = [...new Set(this.carriers.map((c) =>{
            return c.playerId;
        }))].length;

        const uniqueCovers = [...new Set(this.covers.map((c) =>{
            return c.playerId;
        }))].length;


        const kills = killsManager.getKillsBetween(this.takenTimestamp, timestamp);
        const suicides = killsManager.getSuicidesBetween(this.takenTimestamp, timestamp);

        this.caps.push({
            "flagTeam": this.team,
            "timestamp": timestamp, 
            "carriers": [...this.carriers], 
            "uniqueCarriers": uniqueCarriers,
            "covers": [...this.covers], 
            "uniqueCovers": uniqueCovers,
            "drops": [...this.drops],
            "playerId": playerId,
            "cappingTeam": cappingTeam,     
            "carryTime": carryTime,
            "dropTime": this.totalTimeDropped,
            "totalTime": totalTime,
            "takenBy": this.takenBy,
            "takenTimestamp": this.takenTimestamp,
            "kills": kills,
            "suicides": suicides
        });

        this.reset();
    }

    taken(timestamp, playerId, bTakenFromBase, enemyTeam){

        if(bTakenFromBase){
            this.takenTimestamp = timestamp;
            this.takenBy = playerId;
        }else{
            this.lastPickupTimestamp = timestamp;
        }

        this.enemyTeam = enemyTeam;

        if(!bTakenFromBase){

            this.totalTimeDropped += timestamp - this.droppedTimestamp;
        }

        this.bDropped = false;

        this.carriers.push({"timestamp": timestamp, "playerId": playerId});
    }


    updateLastCarrier(timestamp){

        const lastCarrier = this.carriers[this.carriers.length - 1];

        if(lastCarrier === undefined){
            new Message(`FLAG.updateLastCarrier() lastCarrier is undefined`,"warning");
        }else{
            lastCarrier.carryTime = timestamp - lastCarrier.timestamp;
            lastCarrier.endTimestamp = timestamp;
        }
    }

    dropped(timestamp, playerId){

        this.updateLastCarrier(timestamp);

        const lastCarrier = this.carriers[this.carriers.length - 1];


        this.drops.push({"timestamp": timestamp, "playerId": playerId, "carryTime": lastCarrier.carryTime});

        this.bDropped = true;
        this.droppedTimestamp = timestamp;
        this.enemyTeam = null;
    }

    cover(timestamp, playerId){
        this.covers.push({timestamp, playerId})
    }
}
