export class Match{


    constructor(){

        this.date = 0;
    }


    setDate(line){

        const dateReg = /^(\d{4})\.(\d{2})\.(\d{2})\.(\d{2})\.(\d{2})\.(\d{2}).+$/i;

        const r = dateReg.exec(line);

        const year = r[1];
        const month = r[2];
        const day = r[3];
        const hour = r[4];
        const min = r[5];
        const sec = r[6];

        const matchDate = new Date(`${year}-${month}-${day} ${hour}:${min}:00`);

        this.timestamp = Math.floor(matchDate * 0.001);
        this.date = `${year}-${month}-${day}T${hour}:${min}:${sec}`;
    }
}