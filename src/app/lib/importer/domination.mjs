import { getPointsIds, createControlPoint } from "../domination.mjs";

export class Domination{

    constructor(){

        this.controlPoints = {};

        this.capEvents = [];
        
    }


    parseLine(timestamp, line){

        const capReg = /^controlpoint_capture\t(.+?)\t(\d+)$/i;

        const capResult = capReg.exec(line);

        if(capResult !== null){

            if(this.controlPoints[capResult[1]] === undefined){
                this.controlPoints[capResult[1]] = null;
            }

            const playerId = parseInt(capResult[2]);
            this.capEvents.push({"timestamp": timestamp, "playerId": playerId, "point": capResult[1]});
        }    
    }

    async setPointIds(){

        const names = Object.keys(this.controlPoints);

        const namesToIds = await getPointsIds(names);

        for(let i = 0; i < names.length; i++){

            const n = names[i];

            if(namesToIds[n] === undefined){
                namesToIds[n] = await createControlPoint(n);
            }
        }

        for(const pointName of Object.keys(this.controlPoints)){

            this.controlPoints[pointName] = namesToIds[pointName];
        }

        for(let i = 0; i < this.capEvents.length; i++){

            const c = this.capEvents[i];

            c.point = this.controlPoints[c.point] ?? -1;
        }
    }
}