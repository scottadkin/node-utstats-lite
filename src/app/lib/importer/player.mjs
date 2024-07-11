import {multiKillTimeLimit} from "../../../../config.mjs";

export class Player{

    constructor(timestamp, name, playerId){

        this.timestamp = timestamp;
        this.name = name;
        this.id = playerId;

        this.ip = "";
        this.hwid = "";
        this.mac1 = "";
        this.mac2 = "";
        this.team = -1;
        this.bBot = 0;
        this.country = "";
        this.bHadConnectEvent = false;
        this.bSpectator = 1;
        this.masterId = null;
        this.bFirstBlood = 0;
        this.playtime = 0;

        this.ping = {
            "min": null,
            "avg": null,
            "max": null
        };

        this.pings = [];

        this.connects = [timestamp];
        this.disconnects = [];

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
            },
            "ctf": {
                "kill": 0,
                "return": 0,
                "returnBase": 0,
                "returnMid": 0,
                "returnEnemyBase": 0,
                "returnSave": 0,
                "dropped": 0,
                "assist": 0,
                "capture": 0,
                "cover": 0,
                "taken": 0,
                "pickedup": 0,
                "seal": 0
            },
            "dom": {
                "controlPoints": {}
            },
            "items": {
                "amp": 0,
                "belt": 0,
                "boots": 0,
                "body": 0,
                "pads": 0,
                "invis": 0,
                "shp": 0
            }
        };

        //last time player killed or died
        this.lastFragEvent = -99999;
    }

    connected(timestamp, bAsPlayer){

        if(this.connects.indexOf(timestamp) === -1) this.connects.push(timestamp);

        if(bAsPlayer){
            this.bHadConnectEvent = true;
            this.bSpectator = 0;
        }
    }

    disconnect(timestamp){

        this.disconnects.push(timestamp);
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

    matchEnded(matchStart, matchEnd){

        this.updateMultiHistory();
        this.updateSpreeHistory();
        this.disconnects.push(matchEnd);
    }

    headshot(){
        this.stats.headshots++;
    }


    setPlaytime(matchStart, matchEnd){

        let playtime = 0;

        //spectators won't have connect events if there were never a player
        if(this.connects.length === 0){
            this.playtime = 0;
            return;
        }

        for(let i = 0; i < this.connects.length; i++){

            let con = this.connects[i];
            let disc = this.disconnects[i];

            if(disc === undefined) disc = matchEnd;

            if(con < matchStart) con = matchStart;

            let diff = disc - con;

            //ignore connects before match start, if diff < 0 disconnect happened before match start
            if(diff <= 0) continue;

            playtime += diff;

        }
        this.playtime = playtime;
    }
}