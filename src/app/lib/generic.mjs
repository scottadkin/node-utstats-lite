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

export function getTeamName(id){

    id = parseInt(id);

    if(id === 0) return "Red";
    if(id === 1) return "Blue";
    if(id === 2) return "Green";
    if(id === 3) return "Gold";

    return "None";
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

export function convertTimestamp(timestamp, noDayName, noTime, bSkipMSConversion){

    noDayName = (noDayName !== undefined) ? noDayName : false;
    noTime = (noTime !== undefined) ? noTime : false;
    bSkipMSConversion = (bSkipMSConversion !== undefined) ? bSkipMSConversion : false;

    const now = new Date();

    if(!bSkipMSConversion){
        timestamp *= 1000;
    }

    now.setTime(timestamp);

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

    return `${dayNameString}${day}${getOrdinal(day)} ${getMonthName(month, true)} ${year}${timeString}`;
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

    if(playtime <= 0) return 0;

    if(bHardcore){
        return playtime / 1.1;      
    }

    return playtime;
}


export function getPlayer(players, playerId){

    if(players[playerId] !== undefined) return players[playerId];

    return {"name": "Not Found", "country": ""};
}


export function cleanWeaponName(name){

    name = name.toLowerCase();

    name = name.replaceAll(" ", "");

    return name;
}


export function removeDoubleEnforcer(name){

    if(name.toLowerCase() === "double enforcers"){
        name = "Enforcer";
    }

    return name;
}



export function sanitizePagePerPage(page, perPage){

    if(page !== page || perPage !== perPage) throw new Error(`Page and perPage must be valid integers`);
    page--;
    if(page < 0) page = 0;
    if(perPage < 5 || perPage > 100) perPage = 50;

    let start = page * perPage;

    if(start < 0) start = 0;

    return [page, perPage, start];
}

export function getWinner(matchData){

    const bIncludeBasic = matchData.basic !== undefined;

    const totalTeams = (bIncludeBasic) ? matchData.basic.total_teams : matchData.teams;
    
    if(totalTeams < 2){

        const soloWinner = (bIncludeBasic) ? matchData.basic.solo_winner : matchData.soloWinner;

        return {"type": "solo", "winnerId": soloWinner};
    }

    const scores = [];

    for(let i = 0; i < totalTeams; i++){

        const teamScore = (bIncludeBasic) ? matchData.basic[`team_${i}_score`] : matchData.teamScores[i];
        scores.push({"team": i, "score": teamScore});
    }

    scores.sort((a, b) =>{

        if(a.score < b.score) return 1;
        if(a.score > b.score) return -1;
        return 0;
    });

    let bDraw = false;

    const winners = [scores[0].team];
    const firstScore = scores[0].score;

    //check for draws in team games
    for(let i = 1; i < scores.length; i++){

        const s = scores[i];

        if(s.score === firstScore){
            bDraw = true;
            winners.push(s.team);
        }
    }

    return {"type": "teams", "winners": winners, "bDraw": bDraw};

}

export function getMapImageName(name){

    const reg = /^.+?-(.+)$/i;

    const result = reg.exec(name);

    if(result === null) return name;

    name = result[1].toLowerCase();
    name = name.replace(/[\[\]\'\`]/ig,"");

    return name;
}

export function fileNameToDate(fileName){

    const reg = /.*\.(\d+)\.(\d+)\.(\d+)\.(\d+)\.(\d+)\.(\d+)\.(\d+).*/i;

    const r = reg.exec(fileName);

    if(r === null) return null;
 
    return new Date(`${r[1]}-${r[2]}-${r[3]}T${r[4]}:${r[5]}:${r[6]}`);
}

/**
 * 
 * @param {*} fileName 
 * @param {*} minLifetime 
 * @returns 
 */
export function bTMPFileOldEnough(fileName, minLifetime){

    const now = Math.floor(new Date());

    const fileDate = fileNameToDate(fileName);

    if(fileDate === null) return null;
    
    //time in ms
    const realMinLifeTime = minLifetime * 1000;

    const diff = now - fileDate;

    return diff > realMinLifeTime;
}

export function bLSMGame(gametypeName){

    const reg = /last man standing/i;

    return reg.test(gametypeName);
}


export function mysqlSetTotalsByDate(result, dateKey, targetKeys){

    const data = {};

    for(let i = 0; i < result.length; i++){

        const r = result[i];
        const date = new Date(r[dateKey]);
  
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();


        const key = `${year}-${month}-${day}`;

        if(data[key] === undefined){

            data[key] = {"total": 0, "playtime": 0};

            for(let x = 0; x < targetKeys.length; x++){
                data[key][targetKeys[x]] += r[targetKeys[x]];
            }
        }

        data[key].total++;

        for(let x = 0; x < targetKeys.length; x++){
            data[key][targetKeys[x]] += r[targetKeys[x]];
        }
    }

    return data;
}


export function getKey(object, targetValue){

    for(const [key, value] of Object.entries(object)){

        if(value === targetValue) return key;
    }

    return null;
}