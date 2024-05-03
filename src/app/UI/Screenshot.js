"use client"
import { useEffect, useRef } from "react";
import { MMSS, convertTimestamp, getWinner, getTeamName, getPlayer } from "../lib/generic.mjs";

const redTeamColor = "rgb(255,0,0)";
const blueTeamColor = "rgb(0,193,255)";
const greenTeamColor = "rgb(0,255,0)";
const yellowTeamColor = "rgb(255,255,0)";

class ScreenshotImage{

    constructor(canvas, data){

        this.canvas = canvas.current;
        this.context = this.canvas.getContext("2d");

        console.log(data);

        this.data = data;

        
        this.context.textBaseline = "top";

        this.render();

    }

    loadImage(url){

        return new Promise((resolve, reject) =>{

            const image = new Image();
            image.src = url;

            image.onload = () =>{
                console.log(`Loaded image ${url}`);
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

    fillRect(x, y, width, height, color){

        if(color !== undefined) this.context.fillStyle = color;

        const [scaledX, scaledY] = this.scaleXY(x, y);
        const [scaledWidth, scaledHeight] = this.scaleXY(width, height);

        this.context.fillRect(scaledX, scaledY, scaledWidth, scaledHeight);
    }


    drawImage(url, x, y, width, height){

        const image = new Image();
        image.src = url;

        const [scaledX, scaledY] = this.scaleXY(x, y);
        const [scaledWidth, scaledHeight] = this.scaleXY(width, height);

        this.context.drawImage(image, scaledX, scaledY, scaledWidth, scaledHeight);
    }

    fillText(options){

        const [x, y] = this.scaleXY(options.x, options.y);

        if(options.textAlign !== undefined){
            this.context.textAlign = options.textAlign;
        }

        if(options.fontSize !== undefined){
            this.context.font = `${this.scale(options.fontSize, "y")}px Arial`;
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

        this.drawImage(mapImageURL, 0, 0, 100, 100);

        this.fillRect(0,0, 100, 100, "rgba(0,0,0,0.75)");
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
            "text": this.data.basic.gametypeName,
            "x": 50,
            "y": 2,
            "fontSize": 2.5,
            "textAlign": "center",
            "color": "white"
        };

        this.fillText(titleOptions);

        this.renderWinner();

        const endedOptions = {
            "text": "The match has ended. Hit [Fire] to continue!",
            "x": 50,
            "y": 92,
            "color": "rgb(0,255,0)",
            "fontSize": 1.8
        };

        const footerAOptions = {
            "text": `${this.data.basic.gametypeName} in ${this.data.basic.mapName}`,
            "x": 50,
            "y": 96,
            "fontSize": 1.8,
            "color": "white"
        };

        const date = new Date(this.data.basic.date);

        const footerBOptions = {
            "text": `${convertTimestamp(Math.floor(date * 0.001),true)} Elapsed Time: ${MMSS(this.data.basic.playtime)}`,
            "x": 50,
            "y": 98.2
        };

        this.fillText(endedOptions);
        this.fillText(footerAOptions);
        this.fillText(footerBOptions);
    }


    renderTimePing(p, startX, startY, rowHeight, index, bSolo){

        const pingFontSize = rowHeight * 0.33;
        const pingFontRowHeight = rowHeight * 0.35;
        const pingColor = "white";
        const flagOffset = 4.8;

        const y = startY + rowHeight * index

        const timeOptions = {
            "text": `TIME: ${Math.floor(p.time_on_server / 60)}`,
            "fontSize": pingFontSize,
            "color": pingColor,
            "textAlign": "right",
            "x": startX - 0.5,
            "y": y,
        };

        this.fillText(timeOptions);

        const pingOptions = {
            "text": `PING: ${p.ping_avg}`,
            "fontSize": pingFontSize,
            "color": pingColor,
            "textAlign": "right",
            "x": startX - 0.5,
            "y": y + pingFontRowHeight,
        };

        //if(p.country === "") p.country = "xx";

        let country = p.country;

        if(country === "") country = "xx";

        this.drawImage(`/images/flags/${country}.svg`, startX - flagOffset, y, rowHeight * 0.5, rowHeight * 0.5);
        this.fillText(pingOptions);
    }

    renderTeam(teamId){

        const startX = (teamId % 2 === 0) ? 10 : 55;
        const startY = (teamId < 2) ? 15 : 55;

        let teamColor = "white";

        if(teamId === 0) teamColor = redTeamColor;
        if(teamId === 1) teamColor = blueTeamColor;
        if(teamId === 2) teamColor = greenTeamColor;
        if(teamId === 3) teamColor = yellowTeamColor;

        const nameScoreFontSize = 2.3;
        const rowHeight = 3.2;
        const scoreOffset = 35;

        const teamTitle = `${getTeamName(teamId)} Team`;

        const titleOptions = {
            "text": teamTitle,
            "textAlign": "left",
            "fontSize": nameScoreFontSize,
            "x": startX,
            "y": startY,
            "color": teamColor
        };

        this.fillText(titleOptions);

        const scoreOptions = {
            "text": this.data.basic[`team_${teamId}_score`] ?? "N/A",
            "textAlign": "right",
            "fontSize": nameScoreFontSize,
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
                "fontSize": nameScoreFontSize,
                "x": startX,
                "y": startY + rowHeight * index,
                "color": teamColor
            };

            this.fillText(nameOptions);

            const scoreOptions = {
                "text": p.frags,
                "textAlign": "right",
                "fontSize": nameScoreFontSize,
                "x": startX + scoreOffset,
                "y": startY + rowHeight * index,
                "color": teamColor
            };

            this.fillText(scoreOptions);


            index++;
        }
    }

    renderSolo(){

        const nameColor = `rgb(0,194,255)`;
        const scoreColor = `rgb(194,255,255)`;

        const nameOffset = 25;
        const col2Offset = 70;
        const col3Offset = 85;
        const fontSize = 2;
        const rowHeight = 2.6;
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
        };

        this.fillText(nameTitleOptions);
        this.fillText(col2Options);
        this.fillText(col3Options);

        this.data.playerData.sort((a, b) =>{

            if(a.frags > b.frags) return -1;
            if(b.frags > a.frags) return 1;

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
                "fontSize": fontSize,
                "textAlign": "left"
            };

            this.fillText(nameOptions);

            const col2Options = {
                "text": p.frags,
                "x": col2Offset,
                "y": y,
                "color": scoreColor,
                "textAlign": "right"
            };
    
            const col3Options = {
                "text": p.deaths,
                "x": col3Offset,
                "y": y,
            };

            this.fillText(col2Options);
            this.fillText(col3Options);

            this.renderTimePing(p, nameOffset, startY, rowHeight, index, true);

            index++;
        }
    }

    renderPlayers(){

        const totalTeams = this.data.basic.total_teams;

        if(totalTeams >= 2){

            for(let i = 0; i < totalTeams; i++){
                this.renderTeam(i);
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
            "fontSize": 1.4,
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
                "fontSize": 25,
                "textAlign": "center",
                "maxWidth": 100,
                "color": "white"
            });
        }
    }

}

export default function Screenshot({data}){

    const canvasRef = useRef(null);

    useEffect(() =>{

        new ScreenshotImage(canvasRef, data);

    }, [])

    return <>
        <canvas width={1920 * 0.9} height={1080 * 0.9} ref={canvasRef}></canvas>
    </>
}