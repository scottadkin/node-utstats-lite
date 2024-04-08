import {multiKillTimeLimit} from "../../../../config.mjs";

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


        this.lastKillTime = -99999;

        this.sprees = {
            "spree": 0,
            "rampage": 0,
            "dominating": 0,
            "unstoppable": 0,
            "godlike": 0,
            "best": 0
        };

        this.multi = {
            "double": 0,
            "multi": 0,
            "ultra": 0,
            "monster": 0,
            "best": 0
        };
    }

    connected(){

        this.bHadConnectEvent = true;
        this.bSpectator = 0;
    }

}