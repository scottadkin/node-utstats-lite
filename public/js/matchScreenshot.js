const redTeamColor = "rgb(255,0,0)";
const blueTeamColor = "rgb(0,193,255)";
const greenTeamColor = "rgb(0,255,0)";
const yellowTeamColor = "rgb(255,255,0)";
const DEFAULT_SHADOW = {
    "color": "rgba(0,0,0,0.75)",
    "x": 0.1,
    "y": 0.1
}
            

class MatchScreenshot{

    constructor(canvas, data){

        if(typeof canvas === "string"){
            this.canvas = document.querySelector(canvas);
        }else{
            this.canvas = canvas;
        }

        this.context = this.canvas.getContext("2d");

        this.canvas.addEventListener("click", () =>{
                    
            this.canvas.requestFullscreen().catch((err) =>{
                console.trace(err);
            });    
        });
        
        this.data = data;
        this.context.textBaseline = "top";

    }


    loadImage(url){

        if(url === "") console.trace(err);
        
        return new Promise((resolve, reject) =>{
            
            const image = new Image();
            image.src = url;

            image.onload = () =>{
                //console.log(`Loaded image ${url}`);
                resolve();
            }

            image.onerror = () =>{
                reject(`Failed to load image ${url}`);
            }    
        });
    }

    getUsedCountryFlags(){

        const uniqueCountries = [... new Set(this.data.playerData.map((p) =>{
            return p.country;
        }))];

        const images = [];

        uniqueCountries.unshift("xx");

        for(let i = 0; i < uniqueCountries.length; i++){

            const u = uniqueCountries[i];

            if(u === "") continue;

            images.push(`flags/${u}.svg`);
        }

        return images;
    }

    scale(value, axis){

        axis = axis.toLowerCase();

        const size = (axis === "x") ? this.canvas.width : this.canvas.height;

        if(size === 0) return 0;

        const bit = size / 100;

        return value * bit;
  
    }

    scaleXY(x, y){

        x = this.scale(x, "x");
        y = this.scale(y, "y");
        return [x, y];
    }

    //pixels to percent
    reverseScale(value, axis){

        axis = axis.toLowerCase();

        const size = (axis === "x") ? this.canvas.width : this.canvas.height;

        if(size === 0 || value === 0) return 0;

        const bit = size / 100;

        return value / bit;
    }

    fillRect(x, y, width, height, color){

        if(color !== undefined) this.context.fillStyle = color;

        const [scaledX, scaledY] = this.scaleXY(x, y);
        const [scaledWidth, scaledHeight] = this.scaleXY(width, height);

        this.context.fillRect(scaledX, scaledY, scaledWidth, scaledHeight);
    }

    strokeRect(x, y, width, height, color, lineWidth){

        this.context.strokeStyle = color;
        this.context.lineWidth = this.scale(lineWidth, "y");

        const [scaledX, scaledY] = this.scaleXY(x, y);
        const [scaledWidth, scaledHeight] = this.scaleXY(width, height);


        this.context.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);
    }


    drawImage(url, x, y, width, height){

            
        const image = new Image();
        image.src = url;

        const [scaledX, scaledY] = this.scaleXY(x, y);
        const [scaledWidth, scaledHeight] = this.scaleXY(width, height);

        this.context.drawImage(image, scaledX, scaledY, scaledWidth, scaledHeight);
        return true;
    }

    fillText(options){

        const [x, y] = this.scaleXY(options.x, options.y);

        if(options.textAlign !== undefined){
            this.context.textAlign = options.textAlign;
        }

        if(options.fontSize !== undefined){
            this.context.font = `${this.scale(options.fontSize, "y")}px Arial`;
        }

        if(options.font !== undefined){
            this.context.font = options.font;
        }

        let maxWidth = 100;

        if(options.maxWidth !== undefined){
            maxWidth = options.maxWidth;
        }

        if(options.color !== undefined){
            this.context.fillStyle = options.color;
        }

        

        if(options.shadow !== undefined){

            this.context.shadowColor = options.shadow?.color ?? DEFAULT_SHADOW.color;
            
            let shadowX = options.shadow?.x ?? DEFAULT_SHADOW.x;
            let shadowY = options.shadow?.y ?? DEFAULT_SHADOW.y;
            this.context.shadowOffsetX = this.scale(shadowX, "x");
            this.context.shadowOffsetY = this.scale(shadowY, "y");

        }else{
            this.context.shadowOffsetX = 0;
            this.context.shadowOffsetY = 0;
        }
        
        this.context.fillText(options.text, x, y, this.scale(maxWidth, "x"));

    }

    //use after fill text
    measureText(text){
        return this.reverseScale(this.context.measureText(text).width, "x");
    }

    renderWinner(){

        const winner = getWinner(this.data);

        let winnerString = "";

        if(winner.type === "teams"){

            if(winner.winners.length > 1){
                winnerString = `Draw!`;
            }else{
                winnerString = `${getTeamName(winner.winners[0])} wins the match!`;
            }

        }else{

            const player = this.data.basicPlayers[winner.winnerId];

            winnerString = `${player.name} wins the match!`;
        }

        const titleOptions = {
            "text": winnerString,
            "x": 50,
            "y": 3,
            "color": "yellow"
        };

        this.fillText(titleOptions);
    }
    
    renderTitle(){

        const titleOptions = {
            "text": this.data.basic.gametype_name,
            "x": 50,
            "y": 0.5,
            "font": `300 ${this.scale(2.5, "y")}px Arial`,
            "textAlign": "center",
            "color": "white"
        };

        this.fillText(titleOptions);

        this.renderWinner();


        if(this.bCTF()){
            this.renderSmartCTFFooter();
            return;
        }

        const footerAOptions = {
            "text": `${this.data.basic.gametype_name} in ${this.data.basic.map_name}`,
            "x": 50,
            "y": 96.4,
            "font": `300 ${this.scale(1.8, "y")}px Arial`,
            "color": "white"
        };

        const date = new Date(this.data.basic.date);

        const footerBOptions = {
            "text": `${toDateString(Math.floor(date),true)} Elapsed Time: ${MMSS(this.data.basic.playtime)}`,
            "x": 50,
            "y": 98.2
        };

        if(!this.bDom()){
            const endedOptions = {
                "text": "The match has ended. Hit [Fire] to continue!",
                "x": 50,
                "y": 92,
                "color": "rgb(0,255,0)",
                "font": `300 ${this.scale(1.8, "y")}px Arial`,
            };

            this.fillText(endedOptions);
        }

        this.fillText(footerAOptions);
        this.fillText(footerBOptions);
    }


    renderTimePing(p, startX, startY, rowHeight, index, bSolo){

        const pingFontSize = rowHeight * 0.24;
        const pingFontRowHeight = rowHeight * 0.32;
        const pingColor = "white";
        const flagOffset = 5.2;
        const maxWidth = 2.3;

        const y = startY + rowHeight * index

        const timeOptions = {
            "text": `TIME: ${Math.floor(p.time_on_server / 60)}`,
            "fontSize": pingFontSize,
            "color": pingColor,
            "textAlign": "right",
            "x": startX - 0.5,
            "y": y,
            "maxWidth": maxWidth
        };

        this.fillText(timeOptions);

        const pingOptions = {
            "text": `PING: ${p.ping_avg}`,
            "fontSize": pingFontSize,
            "color": pingColor,
            "textAlign": "right",
            "x": startX - 0.5,
            "y": y + pingFontRowHeight,
            "maxWidth": maxWidth
        };

        //if(p.country === "") p.country = "xx";

        let country = p.country;

        if(country === "") country = "xx";

        this.drawImage(`/images/flags/${country}.svg`, startX - flagOffset, y, rowHeight * 0.5, rowHeight * 0.5);
        this.fillText(pingOptions);

        const effOptions = {
            "text": `Eff: ${parseInt(p.efficiency)}%`,
            "fontSize": pingFontSize,
            "color": pingColor,
            "textAlign": "right",
            "x": startX - 0.5,
            "y": y + pingFontRowHeight + pingFontRowHeight,      
            "maxWidth": maxWidth
        };

        this.fillText(effOptions);
    }

    renderTeam(teamId, totalTeams){

        const startX = (teamId % 2 === 0) ? 10 : 55;
        const startY = (teamId < 2) ? 10 : 50;

        let maxPlayers = 18;

        if(totalTeams > 2){
            maxPlayers = 8;
        }

        let teamColor = "white";

        if(teamId === 0) teamColor = redTeamColor;
        if(teamId === 1) teamColor = blueTeamColor;
        if(teamId === 2) teamColor = greenTeamColor;
        if(teamId === 3) teamColor = yellowTeamColor;

        const nameScoreFontSize = 2.6;
        const rowHeight = 4.2;
        const scoreOffset = 35;

        const teamTitle = `${getTeamName(teamId)} Team`;

        const titleOptions = {
            "text": teamTitle,
            "textAlign": "left",
            "fontSize": nameScoreFontSize * 1.25,
            "x": startX,
            "y": startY,
            "color": teamColor
        };

        this.fillText(titleOptions);

        const scoreOptions = {
            "text": this.data.basic[`team_${teamId}_score`] ?? "N/A",
            "textAlign": "right",
            "fontSize": nameScoreFontSize * 1.25,
            "x": startX + scoreOffset,
            "y": startY,
            "color": teamColor
        };

        this.fillText(scoreOptions);

        let index = 1;

        for(let i = 0; i < this.data.playerData.length; i++){

            const p = this.data.playerData[i];

            if(p.team !== teamId) continue;
            if(p.spectator) continue;

            this.renderTimePing(p, startX, startY, rowHeight, index, false);

            const nameOptions = {
                "text": p.name,
                "textAlign": "left",
                //"fontSize": nameScoreFontSize,
                "font": `300 ${this.scale(nameScoreFontSize, "y")}px Arial`,
                "x": startX,
                "y": startY + rowHeight * index,
                "color": teamColor
            };

            this.fillText(nameOptions);

            const scoreOptions = {
                "text": p.score,
                "textAlign": "right",
                "font": `300 ${this.scale(nameScoreFontSize, "y")}px Arial`,
                "x": startX + scoreOffset,
                "y": startY + rowHeight * index,
                "color": teamColor
            };

            this.fillText(scoreOptions);


            index++;
            if(index > maxPlayers) break;
        }
    }

    getPlayerCTFData(playerId){

        for(let i = 0; i < this.data.ctf.playerData.length; i++){

            const d = this.data.ctf.playerData[i];

            if(d.player_id === playerId) return d;
        }

        return null;
    }

    getPlayerDomData(playerId){

        const found = {};

        for(let i = 0; i < this.data.dom.data.length; i++){

            const d = this.data.dom.data[i];

            if(d.player_id !== playerId) continue;

            found[d.point_id] = {
   
                "control_point_score": d.control_point_score,
                "total_control_time": d.total_control_time,
            };

        }

        return found;
    }

    renderSmartBar(name, typeName, value, maxValue, x, y, index, displayValue){

        const maxWidth = 13;

        const barHeight = 0.4;
        const barOffsetX = 4.6;
        const rowOffset = 1.6;

        const offsetX = (index % 2 === 0) ? 0 : 18;
        const offsetY = Math.floor(index * 0.5) * rowOffset;
        const fontSize = this.scale(1.1,"y");

        const nameOptions = {
            "text": `${name}:`,
            "font": `300 ${fontSize}px Arial`,
            "textAlign": "left",
            "color":"white",
            "x": x + offsetX,
            "y": y + offsetY,
            "maxWidth": 2.2
        };


        const valueOptions = {
            "text": displayValue,
            "textAlign": "right",
            "color":"white",
            "x": x + offsetX + 4.3,
            "y": y + offsetY,
            "maxWidth": 2
        };

        this.fillText(nameOptions);
        this.fillText(valueOptions);

        let barWidth = 0;

        let totalPercent = 0;

        if(maxValue > 0 && value > 0){

            const bit = maxWidth / maxValue;
            barWidth = bit * value;
            totalPercent = Math.floor(value / maxValue * 100);
          
        }

        const colorOffset = Math.floor(255 - totalPercent * 2.55);

        this.fillRect(x + offsetX + barOffsetX, y + offsetY + 0.25, barWidth, barHeight, `rgb(${colorOffset},255,${colorOffset})`);
    }

    renderSmartCTFFooter(){

        const fontSize = 1.5;

        const line1 = "[SmartCTF 4E {PiN}Kev | {DnF2}SiNiSTeR | [es]Rush | adminthis & The_Cowboy & Sp0ngeb0b]";
        const line2 = `${toDateString(new Date(this.data.basic.date))} | Elapsed Time: ${MMSS(this.data.basic.playtime)}`;
        const line3 = `Playing ${this.data.basic.map_name} on ${this.data.basic.server_name}`;

        this.fillText({
            "text": line1,
            "font": `${this.scale(fontSize,"y")}px Arial`,
            "textAlign": "center",
            "color": "yellow",
            "x": 50,
            "y": 94
        });

        this.fillText({
            "text": line2,
            "color": "white",
            "x": 50,
            "y": 96
        });

        this.fillText({
            "text": line3,
            "x": 50,
            "y": 98
        });
    }

    getTeamAverageValue(key, teamId){

        let total = 0;
        let playersFound = 0;

        for(let i = 0; i < this.data.playerData.length; i++){

            const p = this.data.playerData[i];

            if(p.team !== teamId) continue;
            total += p[key];
            playersFound++;
        }

        if(playersFound === 0 || total === 0) return 0;

        return Math.floor(total / playersFound);
    }

    getTeamFontColour(id){

        switch(id){
            case 0: return redTeamColor; 
            case 1: return blueTeamColor;
            case 2: return greenTeamColor;
            case 3: return yellowTeamColor; 
        }

        return "white";
    }

    getTeamHeaderBGColor(id){

        switch(id){
            case 0: return "rgba(255,0,0,0.5)"; 
            case 1: return "rgba(0,0,255,0.5)";
            case 2: return "rgba(0,255,0,0.5)";
            case 3: return "rgba(255,255,0,0.5)";
        }

        return "rgba(0,0,0,0.5)";
    }

    getTeamHeaderIcon(id){

        switch(id){
            case 0: return "/images/red.png"; 
            case 1: return "/images/blue.png"; 
            case 2: return "/images/green.png"; 
            case 3: return "/images/yellow.png"; 
        }

        return "/images/controlpoint.png";
    }

    renderSmartTeam(teamId){

        const startX = (teamId % 2 === 0) ? 5 : 55;
        const startY = (teamId < 2) ? 6 : 50.4;

        const bgShade = "rgba(0,0,0,0.45)";
        const headerBgColor = this.getTeamHeaderBGColor(teamId);

        const fontColor = this.getTeamFontColour(teamId);
        const headerIconSize = 3.8;
        const headerIcon = this.getTeamHeaderIcon(teamId);
        const headerFont = `700 ${this.scale(4,"y")}px Arial`;
        const fpFont = `700 ${this.scale(2.5,"y")}px Arial`;

        const pingFontSize = 0.9;

        const width = 40;
        const headerHeight = 5;
        const playerHeight = 9.5;

        let totalPlayers = 0;

        for(let i = 0; i < this.data.playerData.length; i++){

            const p = this.data.playerData[i];
            if(p.team === teamId) totalPlayers++;
        }

        const maxPlayersPerTeam = (this.data.basic.total_teams > 2) ? 4 : 8;

        if(totalPlayers > maxPlayersPerTeam) totalPlayers = maxPlayersPerTeam;

        this.fillRect(startX, startY, width, headerHeight + playerHeight * totalPlayers, bgShade);
        this.drawImage("/images/smartctfbg.png", startX, startY, width, headerHeight);
        this.fillRect(startX, startY, width, headerHeight, headerBgColor);
        this.drawImage(headerIcon, startX + 0.5, startY + 0.5, headerIconSize * 0.5625, headerIconSize);

        const teamScoreOptions = {
            "text": this.data.basic[`team_${teamId}_score`],
            "x": startX + headerIconSize * 0.8,
            "y": startY + 0.75,
            "font": headerFont,
            "textAlign": "left",
            "color": fontColor,
            "shadow": {
                "x": 0.1,
                "y": 0.1
            }
        };

        this.fillText(teamScoreOptions);

        const teamScoreWidth = this.measureText(this.data.basic[`team_${teamId}_score`]);

        const fpOptions = {
            "text": "Frags / Pts",
            "x": startX + width - 1,
            "y": startY + 0.75,
            "font": fpFont,
            "textAlign": "right",
            "color": fontColor,
            "shadow": {
                "x": 0.1,
                "y": 0.1
            }
        };

        this.fillText(fpOptions);

        const teamPingAverage = this.getTeamAverageValue("ping_avg", teamId);

        this.fillText({
            "text": `PING: ${teamPingAverage}`,
            "font": `${this.scale(pingFontSize,"y")}px monospace`,
            "x": startX + headerIconSize + teamScoreWidth,
            "y": startY + 2,
            "textAlign": "left",
            "color": "white"
        });

        this.fillText({
            "text": `TM: ${Math.floor(this.data.basic.playtime / 60)}`,
            "x": startX + headerIconSize + teamScoreWidth,
            "y": startY + 3,
        });

        this.renderSmartPlayers(
            startX, 
            startY + headerHeight, 
            playerHeight, 
            pingFontSize,
            fontColor,
            width,
            teamId,
            maxPlayersPerTeam
        );
        
    }


    getSmartBarTypes(bDom, bCTF){

        const ctfNames = [
            "Caps", "Covers", "Grabs", "Returns", 
            "Assists", "FlagKills", "Seals", "CarryTime"
        ];

        const ctfTypes = [
            "flag_cap", "flag_cover", "flag_taken", "flag_return",
            "flag_assist", "flag_kill", "flag_seal", "flag_carry_time"
        ];


        if(!bDom && !bCTF){
            return [[],[]];
        }

        let barNames = [];
        let typeNames = [];

        if(bCTF){

            barNames = ctfNames;
            typeNames = ctfTypes;

        }else if(bDom){

            for(const [key, value] of Object.entries(this.data.dom.controlPoints)){

                barNames.push(value, value);
                typeNames.push(key, key);
            }
        }

        return {barNames, typeNames};
    }

    async renderSmartPlayers(startX, startY, playerHeight, pingFontSize, fontColor, 
        width, teamId, maxPlayersPerTeam){

        const bDom = this.bDom();
        const bCTF = this.bCTF();

        const {barNames, typeNames} = this.getSmartBarTypes(bDom, bCTF);

        const faceIconSize = 4.6;
        const nameFontSize = 2;
        
        const faceOffsetX = 0.5;

        const paddingX = 0.5;
        const barsWrapperOffsetY = 0.5;

        const flagHeight = 1.3;
        const flagWidth = 1.4;

        let index = 0;

        let totalPlayers = 0;

        let x = 0;
        let y = 0;

        for(let i = 0; i < this.data.playerData.length; i++){

            
            const p = this.data.playerData[i];

            if(p.team !== teamId) continue;

            totalPlayers++

            if(index > maxPlayersPerTeam - 1) continue;

            y = startY + playerHeight * index;
            x = startX;

            this.drawImage("/images/faceless.png", startX + faceOffsetX, y + 0.4, faceIconSize * 0.5625, faceIconSize);
            this.strokeRect(startX + faceOffsetX, y + 0.4, faceIconSize * 0.5625, faceIconSize, "rgba(255,255,255,0.5)", 0.05);

            const flagFile = `/images/flags/${(p.country !== "") ? p.country: "xx"}.svg`;
            this.drawImage(flagFile, x + faceOffsetX + paddingX, y + faceIconSize + 1, flagWidth, flagHeight);


            this.fillText({
                "text": `PING:${p.ping_avg}`,
                "font": `${this.scale(pingFontSize,"y")}px arial`,
                "color": "white",
                "x": x + 1.7,
                "y": y + faceIconSize + 3,
                "textAlign": "center"
            });

            x += paddingX * 2 + faceIconSize * 0.5625;
            y += barsWrapperOffsetY;

            const nameOptions = {
                "text": p.name,
                "x": x,
                "y": y,
                "font": `400 ${this.scale(nameFontSize,"y")}px Arial`,
                "color": fontColor,
                "textAlign": "left"
            };

            this.fillText(nameOptions);

            nameOptions.text = `${p.kills}/${p.score}`;
            nameOptions.x = startX + width - paddingX;
            nameOptions.textAlign = "right"
            this.fillText(nameOptions);

            this.renderSmartTimeEffData(x, y, pingFontSize, p);

            y += nameFontSize + barsWrapperOffsetY;

            let data = null;

            if(bCTF){
                data = this.getPlayerCTFData(p.player_id);
            }else if(bDom){
                data = this.getPlayerDomData(p.player_id);
            }

            if(data === null){
                index++;
                continue;
            }

            for(let z = 0; z < barNames.length; z++){

                const currentKey = typeNames[z];

                let value = 0;
                let maxValue = 0;
                let displayValue = null;

                

                if(bCTF){

                    value = data[currentKey];
                    displayValue = value;
                    maxValue = this.smartMax[currentKey];

                    if(currentKey === "flag_carry_time"){
                        displayValue = MMSS(value);
                    }

                }else if(bDom){

                    const subType = (z % 2 === 0) ? "control_point_score" : "total_control_time";
             
                    value = data[currentKey]?.[subType] ?? 0;
                    displayValue = value;
                    if(z % 2 === 1) displayValue = MMSS(value);
                    maxValue = this.smartMax[currentKey]?.[subType] ?? 0;
                }

                this.renderSmartBar(barNames[z], currentKey, value, maxValue, x, y, z, displayValue);
            }

            index++;
        }

        if(totalPlayers > maxPlayersPerTeam){

            const missingPlayers = totalPlayers - maxPlayersPerTeam;

            const notShownOptions = {
                "text": `${missingPlayers} ${plural(missingPlayers, "Player")} Not Shown.`,
                "x": x - 3.5,
                "y": y + playerHeight * 0.69,
                "font": `400 ${this.scale(pingFontSize * 1.1,"y")}px Arial`,
                "color": fontColor,
                "textAlign": "left"
            };

            this.fillText(notShownOptions);
        }
    }


    appendItemString(player, display, key){

        if(player[key] === undefined || player[key] === 0) return "";
        
        return `${display}:${player[key]} `;
    }

    renderSmartTimeEffData(x, y, pingFontSize, p){

        const effTimeFontColor = "rgb(188,188,188)";
        const effTimeFontSize = pingFontSize;

        const nameWidth = this.context.measureText(`${p.name} `).width;

        const time = (p.time_on_server > 0) ? Math.floor(p.time_on_server / 60) : 1;
        let eff = 0;

        if(p.kills > 0){
            if(p.deaths > 0){
                eff = parseInt(p.kills / (p.kills + p.deaths + p.team_kills + p.suicides) * 100);   
            }else{
                eff = 100;
            }
        }

        const targetItems = [
            {"display": "HS", "dataKey": "headshots"},
            {"display": "SB", "dataKey": "item_belt"},
            {"display": "AMP", "dataKey": "item_amp"},
            {"display": "INV", "dataKey": "item_invis"},
        ];

        let itemString = "";

        for(let i = 0; i < targetItems.length; i++){

            const {display, dataKey} = targetItems[i];

            itemString += this.appendItemString(p, display, dataKey);
        }


        this.fillText({
            "text": itemString,
            "font": `${this.scale(effTimeFontSize,"y")}px monospace`,
            "color": effTimeFontColor,
            "textAlign": "left",
            "x": x + this.reverseScale(nameWidth, "x"),
            "y": y
        });

        this.fillText({
            "text": `TM:${time} EFF:${eff}%`,
            "font": `${this.scale(effTimeFontSize,"y")}px monospace`,
            "color": effTimeFontColor,
            "textAlign": "left",
            "x": x + this.reverseScale(nameWidth, "x"),
            "y": y + effTimeFontSize
        });
    }

    renderSolo(){


        const bLMS = bLSMGame(this.data.basic.gametype_name);

        const nameColor = `rgb(0,194,255)`;
        const scoreColor = `rgb(194,255,255)`;

        const nameOffset = 25;
        const col2Offset = 70;
        const col3Offset = 85;
        const fontSize = 2.4;
        const rowHeight = 3.1;
        const startY = 12;

        const nameTitleOptions = {
            "text": "Player",
            "x": nameOffset,
            "y": startY + rowHeight,
            "color": "white",
            "fontSize": fontSize,
            "textAlign": "left"
        };

        const col2Options = {
            "text": "Frags",
            "x": col2Offset,
            "y": startY + rowHeight,
            "textAlign": "right"
        };

        const col3Options = {
            "text": "Deaths",
            "x": col3Offset,
            "y": startY + rowHeight,
            "textAlign": "right"
        };

        this.fillText(nameTitleOptions);

        if(!bLMS){
            this.fillText(col2Options);
        }else{

            col3Options.text = "Lives";
        }

        this.fillText(col3Options);

        this.data.playerData.sort((a, b) =>{

            const first = (bLMS) ? "score" : "frags";

            if(a[first] > b[first]) return -1;
            if(b[first]> a[first]) return 1;

            if(a.deaths < b.deaths) return -1;
            if(a.deaths > b.deaths) return 1;
            return 0;
        });

        let index = 2;

        for(let i = 0; i < this.data.playerData.length; i++){

            const p = this.data.playerData[i];

            if(p.spectator) continue;

            const y = startY + rowHeight * index;

            const nameOptions = {
                "text": p.name,
                "x": nameOffset,
                "y": y,
                "color": nameColor,
                "font": `300 ${this.scale(fontSize, "y")}px Arial`,
                "textAlign": "left"
            };

            this.fillText(nameOptions);

            if(!bLMS){

                const col2Options = {
                    "text": p.score,
                    "x": col2Offset,
                    "y": y,
                    "color": scoreColor,
                    "textAlign": "right"
                };

                this.fillText(col2Options);

            }
    
            const col3Options = {
                "text": p.deaths,
                "x": col3Offset,
                "y": y,
                "color": scoreColor,
                    "textAlign": "right"
            };

            if(bLMS){
                col3Options.text = p.score;
            }
            
            this.fillText(col3Options);

            this.renderTimePing(p, nameOffset, startY, rowHeight, index, true);

            index++;
        }
    }

    bCTF(){
        return this.data.ctf.playerData.length > 0;
    }


    setCTFMaxValues(){

        const keys = [
            "cap", "cover", "taken", "return", "assist",
            "kill"," carry_time", "seal"
        ];

        for(let i = 0; i < keys.length; i++){

            const k = `flag_${keys[i]}`;
       
            this.smartMax[k] = 0;
            this.smartTotals[k] = 0;
        }

        for(let i = 0; i < this.data.ctf.playerData.length; i++){

            const d = this.data.ctf.playerData[i];

            for(const key of Object.keys(this.smartMax)){

                const current = d[key];
                const max = this.smartMax[key];

                if(current > max) this.smartMax[key] = current;

                this.smartTotals[key] += current;
            }
        }
    }

    setDomMaxValues(){

        const cPoints = this.data.dom.controlPoints;

        cPoints[0] = "All";

        const dataKeys = [
            "control_point_score",
            "total_control_time",
        ];

        for(const key of Object.keys(cPoints)){

            this.smartMax[key] = {};
            this.smartTotals[key] = {};

            for(let i = 0; i < dataKeys.length; i++){
                this.smartMax[key][dataKeys[i]] = 0;
                this.smartTotals[key][dataKeys[i]] = 0;
            }
        }
    
        for(let i = 0; i < this.data.dom.data.length; i++){

            const d = this.data.dom.data[i];

            for(let x = 0; x < dataKeys.length; x++){

                const k = dataKeys[x];

                this.smartTotals[d.point_id][k] += d[k];

                if(this.smartMax[d.point_id][k] < d[k]){
                    this.smartMax[d.point_id][k] = d[k];
                }
            }
        }
    }

    setSmartMaxValues(bCTF, bDom){

        this.smartMax = {};
        this.smartTotals = {};

        if(bCTF){
            this.setCTFMaxValues();
        }else if(bDom){
            this.setDomMaxValues();
        }
    }

    bDom(){

        if(this.data.dom === null) return false;
        
        return this.data.dom.data.length > 0;
    }

    renderPlayers(){

        const totalTeams = this.data.basic.total_teams;

        const bCTF = this.bCTF();
        const bDom = this.bDom();

        this.setSmartMaxValues(bCTF, bDom);

        if(totalTeams >= 2){

            for(let i = 0; i < totalTeams; i++){

                if(!bCTF && !bDom){
                    this.renderTeam(i, totalTeams);
                }else{
                    this.renderSmartTeam(i);
                }
            }         
            
            return;
        }

        this.renderSolo();
    }

    renderSpectators(){

        let string = "";

        for(let i = 0; i < this.data.playerData.length; i++){

            const p = this.data.playerData[i];

            if(!p.spectator) continue;

            if(string !== "") string += `, `;
            string += p.name;
        }

        if(string.length === 0){
            string = `There were no spectators during the match.`;
        }else{
            string = `Spectators: ${string}.`
        }

        const y = (this.bDom()) ? 94.8 : 90;

        const options = {
            "text": string,
            "x": 50,
            "y": y,
            "font": `300 ${this.scale(1.4, "y")}px Arial`,
            "textAlign": "center",
            "color": "white"
        };

        this.fillText(options);
    }

    renderBG(){

        const mapImageURL = `/images/maps/${this.bgImage}`;

        this.drawImage(mapImageURL, 0, 0, 100, 100);
 
        this.fillRect(0,0, 100, 100, "rgba(0,0,0,0.66)");
    }



    async loadImages(){

        this.bgImage = this.data.basic.mapImage;

        const imageNames = [
            `maps/${this.bgImage}`,
            "smartctfbg.png",
            "red.png",
            "blue.png",
            "green.png",
            "yellow.png",
            "faceless.png",
        ];

        imageNames.push(...this.getUsedCountryFlags());

        const imagePromises = [];

        for(let i = 0; i < imageNames.length; i++){

            imagePromises.push(this.loadImage(`/images/${imageNames[i]}`));
        }

        return await Promise.all(imagePromises); 
    }


    async render(){

        try{

            this.fillRect(0, 0, 100, 100, "black");
            await this.loadImages();

            this.renderBG();

            this.renderTitle();
            this.renderPlayers();
            this.renderSpectators();

        }catch(err){

            console.trace(err);

            this.fillRect(0, 0, 100, 100, "red");
            this.fillText({
                "text": `Error: ${err.toString()}`,
                "x": 50,
                "y": 10,
                "fontSize": 12,
                "textAlign": "center",
                "maxWidth": 100,
                "color": "white"
            });
        }
    }

    async toImage(){

        await this.render();
    }
}