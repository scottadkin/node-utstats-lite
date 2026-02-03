import { updateBasicTotals, updateGametype } from "../gametypes.mjs";

export class Gametype{

    constructor(){

        this.name = "";
        this.bInsta = 0;
        this.targetScore = 0;
        this.timeLimit = 0;
        this.mutators = "";
    }

    parseLine(line){

        const reg = /^(.+?)\t(.+)$/i;

        const result = reg.exec(line);

        if(result === null) return;

        //console.log(result);

        const type = result[1].toLowerCase();
        let value = result[2];

        if(type === "gamename"){
            this.name = value;
            return;
        }


        if(type === "insta"){

            value = value.toLowerCase();

            if(value === "true"){
                this.bInsta = 1;
            }else{
                this.bInsta = 0;
            }
            return;
        }

        if(type === "timelimit"){
            this.timeLimit = parseInt(result[2]);
        }

        if(type === "fraglimit"){
            this.targetScore = parseInt(result[2]);
        }

        if(type === "goalteamscore"){
            this.targetScore = parseInt(result[2]);
        }

        if(type === "goodmutator"){

            if(this.mutators !== "") this.mutators += ", "
            this.mutators += result[2];
        }
    }

    async setId(totalTeams, totalPlayers, bIncludeTeamSize){


        if(bIncludeTeamSize && totalTeams > 1){



            //don't want 1.5 v 1.5 ect, only append name if all teams are equal in size
            if(totalPlayers > 0 && totalPlayers % totalTeams === 0){


                let perTeam = 0; 
                perTeam = Math.floor(totalPlayers / totalTeams);

                let teamString = "";

                for(let i = 0; i < totalTeams; i++){

                    teamString += `${perTeam}`;
                    if(i < totalTeams - 1) teamString +=` v `;
                }

                this.name = `${this.name} (${teamString})`

            }      
        }
        
        this.id = await updateGametype(this.name);
    }


    updateName(){

        if(this.bInsta === 0) return;

        this.name = `${this.name} (Instagib)`;
    }


    async updateTotals(){

        await updateBasicTotals(this.id);
    }
}