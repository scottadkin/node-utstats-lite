export class Player{

    constructor(timestamp, name, playerId){

        this.timestamp = timestamp;
        this.name = name;
        this.id = playerId;

        this.ip = null;
        this.hwid = null;
        this.mac1 = null;
        this.mac2 = null;
    }

}