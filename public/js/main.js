const TEAM_IDS_TO_NAMES = {
    "0": "red",
    "1": "blue",
    "2": "green",
    "3": "yellow",
};

function getTeamColorClass(value){

    const output = TEAM_IDS_TO_NAMES?.[value] ?? "none";

    return `team-${output}`;
}


function getTeamIcon(value){

    const valid = {
        "0": "red.png",
        "1": "blue.png",
        "2": "green.png",
        "3": "yellow.png",
    };

    return valid?.[value] ?? "controlpoint.png";
}

function getTeamName(id){

    const valid = {
        "0": "Red",
        "1": "Blue",
        "2": "Green",
        "3": "Gold",
    };

    return valid?.[id] ?? "None";
}

function getTeamFont(id){

    const output = TEAM_IDS_TO_NAMES?.[id] ?? "white";

    return `team-${output}-font`;
}

function getDayName(day){

    const valid = {
        "0": "Sunday",
        "1": "Monday",
        "2": "Tuesday",
        "3": "Wednesday",
        "4": "Thursday",
        "5": "Friday",
        "6": "Saturday",
    };

    return valid?.[day] ?? "Not a valid day";

}


function getMonthName(month, bFull){

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

function getOrdinal(value){

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

function plural(value, word){

    if(value === 1) return word;

    const es = ["s","ch","sh","ss","x","z"];

    for(let i = 0; i < es.length; i++){

        if(word.endsWith(es[i])){
            return `${word}es`;
        }
    }
    return `${word}s`;
}

function toPlaytime(seconds, bIncludeMilliSeconds){

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

function toDateString(dateTime, timeZone, noDayName, noTime){

    
    dateTime = dateTime.replace(/z$/i, "");

    noDayName = (noDayName !== undefined) ? noDayName : false;
    noTime = (noTime !== undefined) ? noTime : false;

    const now = new Date(`${dateTime}${timeZone}`);

    const year = now.getFullYear();
    const month = now.getMonth();
    const dayName = now.getDay();
    const day = now.getDate();
    let hour = now.getHours();
    let minute = now.getMinutes();
    
    if(minute < 10) minute = `0${minute}`;

    if(hour < 10) hour = `0${hour}`;

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

function ignore0(value){

    const pValue = parseInt(value);

    if(pValue !== pValue) return value;

    if(pValue === 0) return "";

    return value;
}

function MMSS(timestamp, bIncludeMilliSeconds){

    if(bIncludeMilliSeconds === undefined){
        bIncludeMilliSeconds = false;
    }

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

    const milliSeconds = Math.floor(timestamp % 1 * 100);

    let milliString = ``;

    if(bIncludeMilliSeconds) milliString = `.${milliSeconds}`;

    if(hours < 1){
        return `${minutes}:${seconds}${milliString}`;
    }else{

        minutes = minutes % 60;
        if(minutes < 10) minutes = `0${minutes}`;
        
        return `${hours}:${minutes}:${seconds}${milliString}`;
    }
}

function getWinner(matchData){

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

function bLSMGame(gametypeName){

    const reg = /last man standing/i;

    return reg.test(gametypeName);
}

function getPlayer(players, playerId){

    if(players[playerId] !== undefined) return players[playerId];

    return {"name": "Not Found", "country": ""};
}



function decodeHTML(input){

    const dummy = document.createElement("textarea");
    dummy.innerHTML = input;

    return dummy.value;
}


function getWatchlist(type){

    type = type.toLowerCase();
    let key = "";

    if(type === "matches"){

        key = "saved-matches";

    }else if(type === "players"){

        key = "saved-players";
    }

    if(key === "") throw new Error(`Unknown Watchlist`);
    const result = localStorage.getItem(key);

    if(result === null) return [];

    return JSON.parse(result);
}

function bAddedToWatchlist(type, hash){

    type = type.toLowerCase();

    let data = null;

    data = getWatchlist(type);

    if(data === null) return false;

    return data.indexOf(hash) !== -1;
}

function addToWatchlist(type, hash){

    type = type.toLowerCase();

    if(bAddedToWatchlist(type, hash)){
        throw new Error(`Already added to ${type} watchlist`);
    }

    const data = getWatchlist(type);

    if(data !== null){

        data.push(hash);
        localStorage.setItem(`saved-${type}`, JSON.stringify(data));
    }
}

function removeFromWatchlist(type, hash){

    type = type.toLowerCase();

    if(!bAddedToWatchlist(type, hash)){
        throw new Error(`${hash} is not in your ${type} watchlist!`);
    }

    const data = getWatchlist(type);

    const index = data.indexOf(hash);
    data.splice(index, 1);

    localStorage.setItem(`saved-${type}`, JSON.stringify(data));
}

function getPartialNameMatchImage(images, targetName){

    const strExt = /^(.+)\..+$/i;

    for(let i = 0; i < images.length; i++){

        const img = images[i];

        const result = strExt.exec(img);

        if(result === null) continue;

        if(targetName.indexOf(result[1]) !== -1){
            return img;
        }
    }

    return null;
}

function stripFileExtension(name){

    const reg = /^(.+)\..+$/i;
    const result = reg.exec(name);

    if(result === null) throw new Error(`Failed To Strip File Extension`);

    return result[1];
}


function toByteString(size){

    if(size > 1024 * 1024){
        size = `${(size / (1024 * 1024)).toFixed(2)} MiB`;
    }else if(size > 1024){
        size = `${(size / 1024).toFixed(2)} KiB`;
    }else{
        size = `${size} Bytes`;
    }

    return size;
}

/**
 * Sort array by strings case insensitive
 */
function sortByStringInsensitive(a, b){

    a = a.toLowerCase();
    b = b.toLowerCase();

    if(a < b){
        return -1;
    }else if(a > b){
        return 1;
    }
    return 0;
}


//from https://jsonlint.com/datasets
const TIME_ZONES =  [
    {"id": "America/New_York", "name": "Eastern Time", "abbreviation": "ET", "utc_offset": "-05:00",  "region": "North America"},
    {"id": "America/Chicago", "name": "Central Time", "abbreviation": "CT", "utc_offset": "-06:00",  "region": "North America"},
    {"id": "America/Denver", "name": "Mountain Time", "abbreviation": "MT", "utc_offset": "-07:00",  "region": "North America"},
    {"id": "America/Los_Angeles", "name": "Pacific Time", "abbreviation": "PT", "utc_offset": "-08:00",  "region": "North America"},
    {"id": "America/Anchorage", "name": "Alaska Time", "abbreviation": "AKT", "utc_offset": "-09:00",  "region": "North America"},
    {"id": "Pacific/Honolulu", "name": "Hawaii Time", "abbreviation": "HST", "utc_offset": "-10:00",  "region": "Pacific"},
    {"id": "America/Toronto", "name": "Eastern Time (Canada)", "abbreviation": "ET", "utc_offset": "-05:00",  "region": "North America"},
    {"id": "America/Vancouver", "name": "Pacific Time (Canada)", "abbreviation": "PT", "utc_offset": "-08:00",  "region": "North America"},
    {"id": "America/Sao_Paulo", "name": "Brasília Time", "abbreviation": "BRT", "utc_offset": "-03:00",  "region": "South America"},
    {"id": "America/Buenos_Aires", "name": "Argentina Time", "abbreviation": "ART", "utc_offset": "-03:00",  "region": "South America"},
    {"id": "America/Mexico_City", "name": "Central Time (Mexico)", "abbreviation": "CST", "utc_offset": "-06:00",  "region": "North America"},
    {"id": "Europe/London", "name": "Greenwich Mean Time", "abbreviation": "GMT", "utc_offset": "+00:00",  "region": "Europe"},
    {"id": "Europe/Paris", "name": "Central European Time", "abbreviation": "CET", "utc_offset": "+01:00",  "region": "Europe"},
    {"id": "Europe/Berlin", "name": "Central European Time", "abbreviation": "CET", "utc_offset": "+01:00",  "region": "Europe"},
    {"id": "Europe/Moscow", "name": "Moscow Time", "abbreviation": "MSK", "utc_offset": "+03:00",  "region": "Europe"},
    {"id": "Europe/Istanbul", "name": "Turkey Time", "abbreviation": "TRT", "utc_offset": "+03:00",  "region": "Europe"},
    {"id": "Asia/Dubai", "name": "Gulf Standard Time", "abbreviation": "GST", "utc_offset": "+04:00",  "region": "Asia"},
    {"id": "Asia/Kolkata", "name": "India Standard Time", "abbreviation": "IST", "utc_offset": "+05:30",  "region": "Asia"},
    {"id": "Asia/Bangkok", "name": "Indochina Time", "abbreviation": "ICT", "utc_offset": "+07:00",  "region": "Asia"},
    {"id": "Asia/Singapore", "name": "Singapore Time", "abbreviation": "SGT", "utc_offset": "+08:00",  "region": "Asia"},
    {"id": "Asia/Hong_Kong", "name": "Hong Kong Time", "abbreviation": "HKT", "utc_offset": "+08:00",  "region": "Asia"},
    {"id": "Asia/Shanghai", "name": "China Standard Time", "abbreviation": "CST", "utc_offset": "+08:00",  "region": "Asia"},
    {"id": "Asia/Tokyo", "name": "Japan Standard Time", "abbreviation": "JST", "utc_offset": "+09:00",  "region": "Asia"},
    {"id": "Asia/Seoul", "name": "Korea Standard Time", "abbreviation": "KST", "utc_offset": "+09:00",  "region": "Asia"},
    {"id": "Australia/Sydney", "name": "Australian Eastern Time", "abbreviation": "AET", "utc_offset": "+10:00",  "region": "Oceania"},
    {"id": "Australia/Melbourne", "name": "Australian Eastern Time", "abbreviation": "AET", "utc_offset": "+10:00",  "region": "Oceania"},
    {"id": "Australia/Perth", "name": "Australian Western Time", "abbreviation": "AWT", "utc_offset": "+08:00",  "region": "Oceania"},
    {"id": "Pacific/Auckland", "name": "New Zealand Time", "abbreviation": "NZT", "utc_offset": "+12:00",  "region": "Oceania"},
    {"id": "Africa/Cairo", "name": "Eastern European Time", "abbreviation": "EET", "utc_offset": "+02:00",  "region": "Africa"},
    {"id": "Africa/Johannesburg", "name": "South Africa Time", "abbreviation": "SAST", "utc_offset": "+02:00",  "region": "Africa"},
    {"id": "UTC", "name": "Coordinated Universal Time", "abbreviation": "UTC", "utc_offset": "+00:00",  "region": "Global"}
].sort((a, b) =>{
    a = a.utc_offset;
    b = b.utc_offset;

    if(a < b){
        return -1;
        
    }else if(a > b){
        return 1;
    }

    return 0;
});
