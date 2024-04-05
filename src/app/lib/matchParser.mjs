import { Player } from "./importer/player.mjs";
import { PlayerManager } from "./importer/playerManager.mjs";

export class MatchParser{

    constructor(rawData){

        this.rawData = rawData;

        this.players = new PlayerManager();
        //console.log(`${this.rawData}`);

        this.parseLines();

    }

    async main(){

        console.log(`---------------------------------------------------------------`);
        await this.players.setPlayerMasterIds();
        
    }

    parseLines(){

        const test = this.rawData;

        const lineReg = /^(.+?)$/img;
        const lines = test.match(lineReg);


        const timestampReg = /^(\d+?\.\d+?)\t(.+)$/i;
        //38.49	player	Rename	Archon	1

        const playerReg =  /^player\t(.+)$/i;
        const statPlayerReg = /^stat_player\t(.+)$/i;
        

        for(let i = 0; i < lines.length; i++){
            

            //console.log(i);
            const line = lines[i];

            const timestampResult = timestampReg.exec(line);

            if(timestampResult === null) continue;

            const timestamp = parseFloat(timestampResult[1]);
            const subString = timestampResult[2];

            if(playerReg.test(subString)){

                this.players.parseLine(timestamp, subString);
                continue;
            }

            if(statPlayerReg.test(subString)){

                this.players.parseStatLine(timestamp, subString);
                continue;
            }

            //console.log(playerNameReg.test(line));
            
        }


        console.log(this.players.players);

        //console.log(lines);
    }


}

