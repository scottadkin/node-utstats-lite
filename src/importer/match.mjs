export class Match{


    constructor(){

        this.date = 0;
    }


    setDate(line){

        const dateReg = /^(\d{4})\.(\d{2})\.(\d{2})\.(\d{2})\.(\d{2})\.(\d{2})\.(\d+)\.(.+)$/i;

        const r = dateReg.exec(line);

        //console.log(r);

        //process.exit();

        const year = r[1];
        const month = r[2];
        const day = r[3];
        const hour = r[4];
        const min = r[5];
        const sec = r[6];
        const ms = r[7];
        const timezone = r[8];

        //console.log(timezone);
        //if no + or - it's displayed as 0.0
        //2026.08.13.08.22.48.474.0.0
        //2026.08.13.07.21.32.666.-1.0
        //2026.08.13.11.05.41.413.+4.0
        //2026.08.13.05.56.07.717.-2.5


        //"2011-10-10T14:48:00.000+09:00"

        const plusMinusReg = /^(\D)(\d+)\.(\d+)$/i; 

   

        let offsetChar = "+";
        let hoursOffset = "00";
        let minutesOffset = "00";

        const plusMinusResult = plusMinusReg.exec(timezone);

        if(plusMinusResult !== null){
            //console.log(plusMinusResult);
            offsetChar = plusMinusResult[1];

            if(offsetChar !== "+" && offsetChar !== "-"){
                offsetChar = "+";
            }

            hoursOffset = parseInt(plusMinusResult[2]);

            minutesOffset = parseInt(plusMinusResult[3]);

            minutesOffset *= 6;

            //console.log(hoursOffset, minutesOffset);

            if(hoursOffset < 10) hoursOffset = `0${hoursOffset}`;
            if(minutesOffset < 10) minutesOffset = `0${minutesOffset}`;
        }

        //console.log(`${year}-${month}-${day} ${hour}:${min}:${sec}.${ms}${offsetChar}${hoursOffset}:${minutesOffset}`);

        const matchDate = new Date(`${year}-${month}-${day} ${hour}:${min}:${sec}.${ms}${offsetChar}${hoursOffset}:${minutesOffset}`);

        //console.log(matchDate);

        this.timestamp = Math.floor(matchDate * 0.001);
        this.date = matchDate;
        this.absoluteTime = line;
        //this.date = `${year}-${month}-${day}T${hour}:${min}:${sec}`;
    }
}