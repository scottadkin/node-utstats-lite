import { getTeamName } from "../generic.mjs";

export default class ctfFlag{

    constructor(team){

        this.team = team;

        this.caps = [];
        this.returns = [];
        this.bDropped = false;
        this.takenTimestamp = null;
        this.lastPickupTimestamp = null;
        this.droppedTimestamp = null;
        this.takenBy = null;

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

        this.carriers = [];
        this.covers = [];
        this.drops = [];
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

    captured(timestamp, playerId, cappingTeam){

        const {carryTime, dropTime, totalTime} = this.calcCarryDropTime(timestamp);

        const uniqueCarriers = [...new Set(this.carriers.map((c) =>{
            return c.playerId;
        }))].length;

        const uniqueCovers = [...new Set(this.covers.map((c) =>{
            return c.playerId;
        }))].length;
        
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
            "takenTimestamp": this.takenTimestamp
        });

        this.reset();
    }

    taken(timestamp, playerId, bTakenFromBase){

        if(bTakenFromBase){
            this.takenTimestamp = timestamp;
            this.takenBy = playerId;
        }else{
            this.lastPickupTimestamp = timestamp;
        }

        this.bDropped = false;

        this.carriers.push({"timestamp": timestamp, "playerId": playerId});
    }

    dropped(timestamp, playerId){

        const carryTime = (this.lastPickupTimestamp === null) ? timestamp - this.takenTimestamp : timestamp - this.lastPickupTimestamp;

        this.drops.push({"timestamp": timestamp, "playerId": playerId, "carryTime": carryTime});

        this.bDropped = true;
        this.droppedTimestamp = timestamp;
    }

    cover(timestamp, playerId){
        this.covers.push({timestamp, playerId})
    }
}
