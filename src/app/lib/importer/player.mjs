export class Player{

    constructor(timestamp, name, playerId){

        this.timestamp = timestamp;
        this.name = name;
        this.id = playerId;

        this.ip = null;
        this.hwid = "";
        this.mac1 = "";
        this.mac2 = "";
        this.team = -1;
        this.bBot = 0;
    }

}