export default class ctfFlag{

    constructor(team){

        this.team = team;

        this.caps = [];
        this.returns = [];
        this.bDropped = false;
        this.takenTimestamp = null;
        this.droppedTimestamp = null;

        this.carriers = [];
        this.covers = [];
        this.drops = [];

        this.returned();
    }

    returned(timestamp){

        this.returns.push({
            "timestamp": timestamp, 
            "carriers": [...this.carriers], 
            "covers": [...this.covers], 
            "drops": [...this.drops]
        });

        this.bDropped = false;
        this.takenTimestamp = null;
        this.droppedTimestamp = null;

        this.carriers = [];
        this.covers = [];
        this.drops = [];
    }

    taken(timestamp, playerId, bTakenFromBase){

        if(bTakenFromBase){
            this.takenTimestamp = timestamp;
        }

        console.log(`${this.team} flag taken by ${playerId}, ${bTakenFromBase}`);
        this.bDropped = false;

        this.carriers.push({"timestamp": timestamp, "playerId": playerId});
    }

    dropped(timestamp, playerId){

        this.drops.push({"timestamp": timestamp, "playerId": playerId});

        this.bDropped = true;
    }
}
