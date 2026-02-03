import {multiKillTimeLimit} from "../../config.mjs";
import Message from "../message.mjs";

export class Player{

    constructor(/*timestamp,*/ name, playerId){

        //this.timestamp = timestamp;
        this.name = name;
        this.matchIds = [playerId];
        

        this.ip = "";
        this.hwid = "";
        this.mac1 = "";
        this.mac2 = "";
        this.team = -1;
        this.bBot = 0;
        this.country = "";
        this.bSpectator = true;
        this.bConnectedToServer = false;
        this.lastConnectInfo = null;
        //sometime a player can rejoin the server before their last session timesout
        this.highestConnectId = -1;
        this.masterId = null;
        this.bFirstBlood = 0;
        this.playtime = 0;
        this.matchResult = "s";

        this.ping = {
            "min": null,
            "avg": null,
            "max": null
        };

        this.pings = [];

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
                "seal": 0,
                "flagCarryTime": {
                    "min": -1,
                    "total": 0,
                    "max": 0
                }
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

        //used for original utstats
        this.classicWeaponStats = {};


        //work around flag_kill event not always logging in smartCTF
        this.bHasFlag = false;

        //last time player killed or died
        this.lastFragEvent = -99999;

        this.lastFlagPickupTime = -9999;
        
        this.teamChanges = [];


        this.connectEvents = [];
    }


    //only keep track of non spectator connect events
    connected(timestamp, matchStart, playerId){

        const info = {
            "type": "connect",
            "timestamp": timestamp,
            "bBeforeMatchStart": timestamp < matchStart,
            playerId
        }

        
        if(playerId > this.highestConnectId){
            this.highestConnectId = playerId;
        }

        this.connectEvents.push(info);

        this.lastConnectInfo = info;
 
        this.bSpectator = false;
        this.bConnectedToServer = true;

    }


    disconnect(timestamp, matchStart, playerId){

        if(playerId !== null && playerId < this.highestConnectId){

            new Message(`${this.name} rejoined server before old connection dropped, skipping disconnect event`, "warning");
            return;
        }

        this.bConnectedToServer = false;

        if(this.bSpectator){
 
            this.lastConnectInfo = null;
            return;
        }

        if(timestamp < matchStart) this.bSpectator = true;

        this.connectEvents.push({
            "type": "disconnect",
            "timestamp": timestamp, 
            playerId
        });

        if(this.lastConnectInfo !== null){


            const previousTimestamp = (this.lastConnectInfo.bBeforeMatchStart) ? matchStart : this.lastConnectInfo.timestamp;

            if(timestamp < matchStart) timestamp = matchStart;

            this.playtime += (timestamp - previousTimestamp);
        }

        this.lastConnectInfo = null;
    }

    changeTeam(newTeam, timestamp){

        this.team = newTeam;
        this.teamChanges.push({"timestamp": timestamp, "team": newTeam});
    }

    getTeamAt(timestamp){

        let latestTeam = null;

        for(let i = 0; i < this.teamChanges.length; i++){

            const t = this.teamChanges[i];

            if(t.timestamp <= timestamp) latestTeam = t.team;
        }

        return latestTeam;
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