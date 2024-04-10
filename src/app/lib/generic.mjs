export function getTeamColorClass(value){

    value = parseInt(value);

    if(value === 0) return "team-red";
    if(value === 1) return "team-blue";
    if(value === 2) return "team-green";
    if(value === 3) return "team-yellow";

    return "team-none";
}


export function getTeamIcon(value){

    value = parseInt(value);

    if(value === 0) return "red.png";
    if(value === 1) return "blue.png";
    if(value === 2) return "green.png";
    if(value === 3) return "yellow.png";

    return "controlpoint.png"
}

export function MMSS(timestamp){

    let seconds = Math.floor(timestamp % 60);
    let minutes = Math.floor(timestamp / 60);
    let hours = Math.floor(minutes / 60);

    if(seconds < 0) seconds = 0;
    if(minutes < 0) minutes = 0;

    if(seconds < 10){
        seconds = `0${seconds}`;
    }

    if(minutes < 10){
        minutes = `0${minutes}`;
    }

    if(hours < 1){
        return `${minutes}:${seconds}`;
    }else{

        minutes = minutes % 60;
        if(minutes < 10) minutes = `0${minutes}`;
        
        return `${hours}:${minutes}:${seconds}`;
    }
}


export function ignore0(value){

    const pValue = parseInt(value);

    if(pValue !== pValue) return value;

    if(pValue === 0) return "";

    return value;
    
}

export function generateRandomChar(){

    const chars = `abcdefghijklmnopqrstuvwxyz0123456789!"$%^&*()_+-=:;@'~#[],.<>?/`;

    const r = Math.floor(Math.random() * (chars.length - 1));

    return chars[r];
}

export function createRandomString(targetLength){

    let result = "";

    if(targetLength === undefined) targetLength = 1;
    if(targetLength < 1) targetLength = 1;

    for(let i = 0; i < targetLength; i++){

        result += generateRandomChar();
    }

    return result;
}

export function toPlaytime(seconds, bIncludeMilliSeconds){

    if(seconds === 0) return "None";

    const milliSeconds = seconds % 1;

    if(bIncludeMilliSeconds === undefined) bIncludeMilliSeconds = false;

    const rSeconds = Math.floor(seconds % 60);
    let secondString = plural(rSeconds, "Second");

    const totalMintues = Math.floor(seconds / 60);

    const rMinutes = Math.floor(totalMintues % 60);
    const minuteString = plural(rMinutes, "Minute");
        
    const hours = Math.floor(totalMintues / 60);
    const hoursString = plural(hours, "Hour");

   // const minutes = Math.floor(seconds / 60) % 60;

    if(hours > 0){

        if(rMinutes > 0){
            return `${hours} ${hoursString}, ${rMinutes} ${minuteString}`;
        }else{

            if(rSeconds > 0){
                return `${hours} ${hoursString}, ${rSeconds} ${secondString}`;
            }
        }

        return `${hours} ${hoursString}`;
        
    }else{

        if(rMinutes > 0){

            if(rSeconds > 0){
                return `${rMinutes} ${minuteString}, ${rSeconds} ${secondString}`;
            }

            return `${rMinutes} ${minuteString}`;

        }else{

            if(rSeconds > 0){

                if(bIncludeMilliSeconds){

                    let ms = Math.floor(milliSeconds * 100);
                    if(ms < 10) ms = `0${ms}`;
             
                    return `${rSeconds}.${ms} Seconds`;
                }

                return `${rSeconds} ${secondString}`;
            }

            return `${Math.floor(milliSeconds * 1000)} ms`;
        }
    }
}

export function getDayName(day){

    switch(day){
        case 0: {   return 'Sunday'; }
        case 1: {   return 'Monday'; }
        case 2: {   return 'Tuesday'; }
        case 3: {   return 'Wednesday'; }
        case 4: {   return 'Thursday'; }
        case 5: {   return 'Friday'; }
        case 6: {   return 'Saturday'; }
    }
}


export function getMonthName(month, bFull){

    if(bFull === undefined){
        bFull = false;
    }

    const short = {
        "0": "Jan",
        "1": "Feb",
        "2": "Mar",
        "3": "Apr",
        "4": "May",
        "5": "June",
        "6": "July",
        "7": "Aug",
        "8": "Sep",
        "9": "Oct",
        "10": "Nov",
        "11": "Dec"
    };


    const long = {
        "0": "January",
        "1": "February",
        "2": "March",
        "3": "April",
        "4": "May",
        "5": "June",
        "6": "July",
        "7": "August",
        "8": "September",
        "9": "October",
        "10": "November",
        "11": "December"
    };

   
    if(bFull) return long[month];
    return short[month];
}

export function getOrdinal(value){

    const first = value % 10;
    const second = value % 100;

    if(second >= 10 && second < 20){
        return 'th';
    }

    if(first === 1){
        return 'st';
    }else if(first === 2){
        return 'nd';
    }else if(first === 3){
        return 'rd';
    }

    return 'th';   
}

export function convertTimestamp(timestamp, noDayName, noTime){

    noDayName = (noDayName !== undefined) ? noDayName : false;
    noTime = (noTime !== undefined) ? noTime : false;

    const now = new Date();
    now.setTime(timestamp * 1000);

    const year = now.getFullYear();
    const month = now.getMonth();
    const dayName = now.getDay();
    const day = now.getDate();
    const hour = now.getHours();
    let minute = now.getMinutes();
    
    if(minute < 10) minute = `0${minute}`;

    let dayNameString = "";

    if(!noDayName){
        dayNameString = `${getDayName(dayName)} `;
    }
    
    let timeString = "";

    if(!noTime){
        timeString = ` ${hour}:${minute}`;
    }

    return `${dayNameString}${day}${getOrdinal(day)} ${getMonthName(month)} ${year}${timeString}`;
}


export function removeUNR(name){

    const reg = /^(.+)\.unr$/i;

    const result = reg.exec(name);

    if(result === null) return name;

    return result[1];
}


export function plural(value, word){

    //if(value == "") return word;

    if(value === 1) return word;

    return `${word}s`;
}

export function scalePlaytime(playtime, bHardcore){

    if(bHardcore && playtime !== 0){
        return playtime / 1.1;      
    }

    return playtime;
}


export function getPlayer(players, playerId){

    if(players[playerId] !== undefined) return players[playerId];

    return {"name": "Not Found", "country": ""};
}