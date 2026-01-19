//import { MMSS, convertTimestamp, getWinner, getTeamName, getPlayer, bLSMGame} from "./lib/generic.mjs";
//import { createCanvas, loadImage, createImageData } from "canvas";
const redTeamColor = "rgb(255,0,0)";
const blueTeamColor = "rgb(0,193,255)";
const greenTeamColor = "rgb(0,255,0)";
const yellowTeamColor = "rgb(255,255,0)";

class MatchScreenshot{

    constructor(canvas, data, bServerSide){

        bServerSide = false;

        if(bServerSide === undefined) bServerSide = false;

        this.bServerSide = bServerSide;

        /*if(!this.bServerSide){
            this.canvas = canvas.current;
        }else{
           // this.canvas = createCanvas(1920, 1080);
        }*/

        if(typeof canvas === "string"){
            this.canvas = document.querySelector(canvas);
        }else{
            this.canvas = canvas;
        }

        this.context = this.canvas.getContext("2d");

        if(!this.bServerSide){

            this.canvas.addEventListener("click", () =>{
                      
                this.canvas.requestFullscreen().catch((err) =>{
                    console.trace(err);
                });
                
            });
        }

        this.data = data;
    
        this.context.textBaseline = "top";

    }


    loadImage(url){

        if(url === "") console.trace(err);
        

        return new Promise((resolve, reject) =>{
            

            if(this.bServerSide){

                resolve();
                return;
            }

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

    async loadFlags(){

        const uniqueCountries = [... new Set(this.data.playerData.map((p) =>{
            return p.country;
        }))];

        const images = [];

        uniqueCountries.unshift("xx");

        for(let i = 0; i < uniqueCountries.length; i++){

            const u = uniqueCountries[i];

            if(u === "") continue;

            images.push(this.loadImage(`/images/flags/${u}.svg`));
        }

        return await Promise.all(images);
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


    async drawImage(url, x, y, width, height){

        if(!this.bServerSide){
            
            const image = new Image();
            image.src = url;

            const [scaledX, scaledY] = this.scaleXY(x, y);
            const [scaledWidth, scaledHeight] = this.scaleXY(width, height);

            this.context.drawImage(image, scaledX, scaledY, scaledWidth, scaledHeight);
            return true;
        }

        await this.drawServerSideImage(url, x, y, width, height);
    }

    async drawServerSideImage(url, x, y, width, height){

        try{

            const [scaledX, scaledY] = this.scaleXY(x, y);
            const [scaledWidth, scaledHeight] = this.scaleXY(width, height);

            //server side doesnt like the svg flag images
            if(/^.+\.svg$/i.test(url)){
                return;
            }

            url = `./public/${url}`;
            
            const image = await loadImage(url);
            this.context.drawImage(image, scaledX, scaledY, scaledWidth, scaledHeight);
        }catch(err){
            console.trace(err);
            console.log(url);
        }
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
        
        this.context.fillText(options.text, x, y, this.scale(maxWidth, "x"));

    }

    async renderBG(){

        let mapImageURL = `/images/maps/${this.data.basic.mapImage}`;

        try{

            await this.loadImage(mapImageURL);
        }catch(err){

            mapImageURL = `/images/maps/default.jpg`;
            await this.loadImage(mapImageURL);
        }

        await this.drawImage(mapImageURL, 0, 0, 100, 100);
 
        this.fillRect(0,0, 100, 100, "rgba(0,0,0,0.66)");
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
            "y": 5,
            "color": "yellow"
        };

        this.fillText(titleOptions);
    }
    
    renderTitle(){

        const titleOptions = {
            "text": this.data.basic.gametype_name,
            "x": 50,
            "y": 2,
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

        const endedOptions = {
            "text": "The match has ended. Hit [Fire] to continue!",
            "x": 50,
            "y": 92,
            "color": "rgb(0,255,0)",
            "font": `300 ${this.scale(1.8, "y")}px Arial`,
        };

        const footerAOptions = {
            "text": `${this.data.basic.gametype_name} in ${this.data.basic.map_name}`,
            "x": 50,
            "y": 96,
            "font": `300 ${this.scale(1.8, "y")}px Arial`,
            "color": "white"
        };

        const date = new Date(this.data.basic.date);

        const footerBOptions = {
            "text": `${toDateString(Math.floor(date),true)} Elapsed Time: ${MMSS(this.data.basic.playtime)}`,
            "x": 50,
            "y": 98.2
        };

        this.fillText(endedOptions);
        this.fillText(footerAOptions);
        this.fillText(footerBOptions);
    }


    async renderTimePing(p, startX, startY, rowHeight, index, bSolo){

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

        await this.drawImage(`/images/flags/${country}.svg`, startX - flagOffset, y, rowHeight * 0.5, rowHeight * 0.5);
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

    async renderTeam(teamId){

        const startX = (teamId % 2 === 0) ? 10 : 55;
        const startY = (teamId < 2) ? 15 : 55;

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

            await this.renderTimePing(p, startX, startY, rowHeight, index, false);

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
        }
    }

    getPlayerCTFData(playerId){

        for(let i = 0; i < this.data.ctf.playerData.length; i++){

            const d = this.data.ctf.playerData[i];

            if(d.player_id === playerId) return d;
        }

        return null;
    }

    renderSmartCTFBar(name, typeName, value, x, y, index){

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
            "text": value,
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

        if(this.ctfMax[typeName] > 0 && value > 0){

            const bit = maxWidth / this.ctfMax[typeName];
            barWidth = bit * value;
            totalPercent = Math.floor(value / this.ctfMax[typeName] * 100);
          
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

    async renderSmartCTFTeam(teamId){

        if(teamId > 1) return;


        const barNames = [
            "Caps", "Covers", "Grabs", "Returns", "Assists", "FlagKills", "Seals", "CarryTime"
        ];

        const typeNames = [
            "flag_cap", "flag_cover", "flag_taken", "flag_return", "flag_assist", "flag_kill", "flag_seal", "flag_carry_time"
        ];


        const startX = (teamId === 0) ? 5 : 55;
        const startY = 15;

        const bgShade = "rgba(0,0,0,0.25)";
        const headerBgColor = (teamId === 0) ? "rgba(255,0,0,0.5)" : "rgba(0,0,255,0.5)";
        const fontColor = (teamId === 0) ? redTeamColor : blueTeamColor;
        const headerIconSize = 3.8;
        const headerIcon = (teamId === 0) ? "/images/red.png" : "/images/blue.png";
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

        this.fillRect(startX, startY, width, headerHeight + playerHeight * totalPlayers, bgShade);
        await this.drawImage("/images/smartctfbg.png", startX, startY, width, headerHeight);
        this.fillRect(startX, startY, width, headerHeight, headerBgColor);
        await this.drawImage(headerIcon, startX + 0.5, startY + 0.5, headerIconSize * 0.5625, headerIconSize);

        const teamScoreOptions = {
            "text": this.data.basic[`team_${teamId}_score`],
            "x": startX + headerIconSize * 0.9,
            "y": startY + 0.75,
            "font": headerFont,
            "textAlign": "left",
            "color": fontColor
        };

        this.fillText(teamScoreOptions);

        const fpOptions = {
            "text": "Frags / Pts",
            "x": startX + width - 1,
            "y": startY + 0.75,
            "font": fpFont,
            "textAlign": "right",
            "color": fontColor
        };

        this.fillText(fpOptions);


        const teamPingAverage = this.getTeamAverageValue("ping_avg", teamId);

        this.fillText({
            "text": `PING: ${teamPingAverage}`,
            "font": `${this.scale(pingFontSize,"y")}px monospace`,
            "x": startX + 6,
            "y": startY + 2,
            "textAlign": "left",
            "color": "white"
        });

        this.fillText({
            "text": `TM: ${Math.floor(this.data.basic.playtime / 60)}`,
            "x": startX + 6,
            "y": startY + 3,
        });

        const faceIconSize = 4.6;
        const nameFontSize = 2;
        const effTimeFontColor = "rgb(188,188,188)";
        const effTimeFontSize = pingFontSize;
        const faceOffsetX = 0.5;

        let index = 0;

        for(let i = 0; i < this.data.playerData.length; i++){

            const p = this.data.playerData[i];

            if(p.team !== teamId) continue;

            let y = startY + headerHeight + playerHeight * index;
            let x = startX;

            await this.drawImage("/images/faceless.png", startX + faceOffsetX, y + 0.4, faceIconSize * 0.5625, faceIconSize);
            this.strokeRect(startX + faceOffsetX, y + 0.4, faceIconSize * 0.5625, faceIconSize, "rgba(255,255,255,0.5)", 0.05);

            await this.drawImage(`/images/flags/${(p.country !== "") ? p.country: "xx"}.svg`, x + faceOffsetX + 0.5, y + faceIconSize + 1, 1.4, 1.3);


            this.fillText({
                "text": `PING:${p.ping_avg}`,
                "font": `${this.scale(pingFontSize,"y")}px arial`,
                "color": "white",
                "x": x + 1.7,
                "y": y + faceIconSize + 3,
                "textAlign": "center"
            });

            x += 0.5 + 0.5 + faceIconSize * 0.5625;
            y += 0.4;

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
            nameOptions.x = startX + width - 0.5;
            nameOptions.textAlign = "right"
            this.fillText(nameOptions);

            const nameWidth = this.context.measureText(`${p.name} `).width;

            const time = (p.time_on_server > 0) ? Math.floor(p.time_on_server / 60) : 1;
            let eff = 0;

            if(p.kills > 0){
                if(p.deaths > 0){
                    eff = parseInt(p.kills / (p.kills + p.deaths + p.team_kills + p.suicides) * 100);   
                }
            }

            let itemString = "";

            if(p.headshots > 0){
                itemString += `HS:${p.headshots} `
            }

            if(p.item_belt > 0){
                itemString += `SB:${p.item_belt} `;
            }

            if(p.item_amp > 0){
                itemString += `AMP:${p.item_amp}`;
            }

            if(p.item_invis > 0){
                itemString += `INV:${p.item_invis}`;
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


            y += nameFontSize + 0.5;

            const ctfData = this.getPlayerCTFData(p.player_id);

            for(let z = 0; z < barNames.length; z++){

                const currentKey = typeNames[z];

                let value = 0;

                if(ctfData !== null){
                    value = ctfData[currentKey];
                }

                this.renderSmartCTFBar(barNames[z], currentKey, value, x, y, z);
            }

            index++;

        }



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

        this.ctfMax = {
            "flag_cap": 0, 
            "flag_cover": 0, 
            "flag_taken": 0, 
            "flag_return": 0, 
            "flag_assist": 0, 
            "flag_kill": 0,
            "flag_carry_time": 0,
            "flag_seal": 0
        };

        this.ctfTotals = {
            "flag_cap": 0, 
            "flag_cover": 0, 
            "flag_taken": 0, 
            "flag_return": 0, 
            "flag_assist": 0, 
            "flag_kill": 0,
            "flag_carry_time": 0,
            "flag_seal": 0
        };

        for(let i = 0; i < this.data.ctf.playerData.length; i++){

            const d = this.data.ctf.playerData[i];

            for(const key of Object.keys(this.ctfMax)){

                const current = d[key];
                const max = this.ctfMax[key];

                if(current > max) this.ctfMax[key] = current;

                this.ctfTotals[key] += current;
            }
        }
    }

    async renderPlayers(){

        const totalTeams = this.data.basic.total_teams;

        const bCTF = this.bCTF();

        if(bCTF){
            this.setCTFMaxValues();
        }

        if(totalTeams >= 2){

            for(let i = 0; i < totalTeams; i++){

                if(!bCTF){
                    await this.renderTeam(i);
                }else{
                    await this.renderSmartCTFTeam(i);
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

        const options = {
            "text": string,
            "x": 50,
            "y": 90,
            "font": `300 ${this.scale(1.4, "y")}px Arial`,
            "textAlign": "center",
            "color": "white"
        };

        this.fillText(options);
    }

    async render(){

        try{

            this.fillRect(0, 0, 100, 100, "black");

            await this.renderBG();
            await this.loadFlags();
            await this.loadImage("/images/smartctfbg.png");
            await this.loadImage("/images/red.png");
            await this.loadImage("/images/blue.png");
            await this.loadImage("/images/green.png");
            await this.loadImage("/images/yellow.png");
            await this.loadImage("/images/faceless.png");
            this.renderTitle();
            await this.renderPlayers();
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

        if(this.bServerSide /*&& this.canvas.toBuffer !== undefined*/){

            return this.canvas.toBuffer("image/jpeg");
        }
    }
}