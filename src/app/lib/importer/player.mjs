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
            "ttl": 0,
            "headshots": 0,
            "sprees": {
                "spree": 0,
                "rampage": 0,
                "dominating": 0,
                "unstoppable": 0,
                "godlike": 0,
                "best": 0,
                "current": 0
            },
            "multis": {
                "double": 0,
                "multi": 0,
                "ultra": 0,
                "monster": 0,
                "best": 0,
                "current": 0
            }
        };

        //last time player killed or died
        this.lastFragEvent = -99999;
    }

    connected(){

        this.bHadConnectEvent = true;
        this.bSpectator = 0;
    }

    updateMultiHistory(){

        const m = this.stats.multis.current;

        if(m === 2){
            this.stats.multis.double++;
        }else if(m === 3){
            this.stats.multis.multi++;
        }else if(m === 4){
            this.stats.multis.ultra++;
        }else if(m >= 5){
            this.stats.multis.monster++;
        }

        if(m > this.stats.multis.best) this.stats.multis.best = m;

        this.stats.multis.current = 0;
    }

    updateSpreeHistory(){

        const s = this.stats.sprees.current;

        if(s >= 5 && s < 10){
            this.stats.sprees.spree++;
        }else if(s >= 10 && s < 15){
            this.stats.sprees.rampage++;
        }else if(s >= 15 && s < 20){
            this.stats.sprees.dominating++;
        }else if(s >= 20 && s < 25){
            this.stats.sprees.unstoppable++;
        }else if(s >= 25){
            this.stats.sprees.godlike++;
        }

        if(s > this.stats.sprees.best) this.stats.sprees.best = s;
        this.stats.sprees.current = 0;
    }

    killed(timestamp){

        const diff = timestamp - this.lastFragEvent;

        if(diff > multiKillTimeLimit){
            this.updateMultiHistory();
        }

        this.stats.multis.current++;
        this.stats.sprees.current++;

        this.lastFragEvent = timestamp;
    }


    died(timestamp){

        this.updateMultiHistory();
        this.updateSpreeHistory();
        this.lastFragEvent = timestamp;
    }

    teamKill(){

        this.stats.teamKills++;
    }

    matchEnded(){

        this.updateMultiHistory();
        this.updateSpreeHistory();
    }

    headshot(){
        this.stats.headshots++;
    }

}