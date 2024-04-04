import { Player } from "./player.mjs";

export class PlayerManager{

    constructor(){

        this.players = [];
    }


    getPlayerByName(name){

        name = name.toLowerCase();

        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];

            if(p.name.toLowerCase() === name) return p;
        }

        return null;
    }

    getPlayerById(id){

        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];

            if(p.id === id) return p;
        }

        return null;
    }

    addPlayer(timestamp, name, playerId){

        console.log("ADDPLAYER");
        this.players.push(new Player(timestamp, name, playerId));
    }
}