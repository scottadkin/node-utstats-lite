import { Player } from "./importer/player.mjs";
import { PlayerManager } from "./importer/playerManager.mjs";

export class MatchParser{

    constructor(rawData){

        this.rawData = rawData;

        this.players = new PlayerManager();
        //console.log(`${this.rawData}`);

        this.parseLines();
    }

    parseLines(){

        const test = this.rawData;

        const lineReg = /^(.+?)$/img;
        const lines = test.match(lineReg);


        //38.49	player	Rename	Archon	1
        const playerNameReg = /^(\d+?\.\d+?)\tplayer\trename\t(.+)\t(\d+)$/i;

        for(let i = 0; i < lines.length; i++){

            //console.log(i);
            const line = lines[i];
            //console.log(line);
            //console.log(playerNameReg.test(line));
            if(playerNameReg.test(line)){
               console.log(playerNameReg.exec(line));

               const result = playerNameReg.exec(line);
               if(result === null) continue;
               this.players.addPlayer(parseFloat(result[1]), result[2], parseInt(result[3]));
            }
        }


        console.log(this.players.players);


        console.log(this.players.getPlayerByName("alys"));
        //console.log(lines);
    }


}

