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
        this.country = "";
        this.bHadConnectEvent = false;
        this.bSpectator = 1;
        this.masterId = null;

        this.stats = {
            "score": 0,
            "frags": 0,
            "kills": 0,
            "deaths": 0,
            "suicides": 0,
            "teamKills": 0,
            "efficiency": 0,
            "timeOnServer": 0,
            "ttl": 0
        };
    }

    connected(){

        this.bHadConnectEvent = true;
        this.bSpectator = 0;
    }

}