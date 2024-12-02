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

        //keep track of kills while a flag is taken
        this.kills = {};

        this.carriers = [];
        this.covers = [];
        this.drops = [];

        this.returned();
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
    }

    calcCarryDropTime(timestamp){

        let carryTime = 0;
        let dropTime = 0;

        const totalTime = timestamp - this.takenTimestamp;

        if(this.drops.length === 0){
            return {"carryTime": totalTime, dropTime, totalTime};
        }

        for(let i = 0; i < this.drops.length; i++){

            const d = this.drops[i];
            carryTime += d.carryTime;
        }


        dropTime = totalTime - carryTime;

        return {carryTime, dropTime, totalTime}
    }

    returned(timestamp, playerId){

        const {carryTime, dropTime, totalTime} = this.calcCarryDropTime(timestamp);

        this.returns.push({
            "timestamp": timestamp, 
            "carriers": [...this.carriers], 
            "covers": [...this.covers], 
            "drops": [...this.drops],
            "playerId": playerId,
            "carryTime": carryTime,
            "dropTime": dropTime,
            "totalTime": totalTime
        });

        this.reset();
    }

    timedOutReturn(timestamp){

        this.returned(timestamp, -1);
    }

    captured(playerManager, killsManager, timestamp, playerId, cappingTeam){

        const {carryTime, dropTime, totalTime} = this.calcCarryDropTime(timestamp);

        this.updateLastCarrier(timestamp);

        const uniqueCarriers = [...new Set(this.carriers.map((c) =>{
            return c.playerId;
        }))].length;

        const uniqueCovers = [...new Set(this.covers.map((c) =>{
            return c.playerId;
        }))].length;


        const kills = killsManager.getKillsBetween(this.takenTimestamp, timestamp);

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
            "dropTime": dropTime,
            "totalTime": totalTime,
            "takenBy": this.takenBy,
            "takenTimestamp": this.takenTimestamp,
            "kills": kills
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
