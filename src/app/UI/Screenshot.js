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

        this.fillRect(0,0, 100, 100, "rgba(0,0,0,0.6)");
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


    renderTimePing(p, startX, startY, rowHeight, index){

        const pingFontSize = 1.1;
        const pingFontRowHeight = 1.4;
        const pingColor = "white";

        const timeOptions = {
            "text": `TIME: ${Math.floor(p.time_on_server / 60)}`,
            "fontSize": pingFontSize,
            "color": pingColor,
            "textAlign": "right",
            "x": startX - 0.5,
            "y": startY + rowHeight * index,
        };

        this.fillText(timeOptions);

        const pingOptions = {
            "text": `PING: ${p.ping_avg}`,
            "fontSize": pingFontSize,
            "color": pingColor,
            "textAlign": "right",
            "x": startX - 0.5,
            "y": startY + pingFontRowHeight + rowHeight * index,
        };

        this.fillText(pingOptions);
    }

    renderTeam(teamId){

        const startX = (teamId % 2 === 0) ? 15 : 55;
        const startY = (teamId < 2) ? 15 : 55;

        let teamColor = "white";

        if(teamId === 0) teamColor = redTeamColor;
        if(teamId === 1) teamColor = blueTeamColor;
        if(teamId === 2) teamColor = greenTeamColor;
        if(teamId === 3) teamColor = yellowTeamColor;

        const nameScoreFontSize = 2.5;
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

            this.renderTimePing(p, startX, startY, rowHeight, index);

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

    renderPlayers(){

        const totalTeams = this.data.basic.total_teams;

        if(totalTeams >= 2){

            for(let i = 0; i < totalTeams; i++){
                this.renderTeam(i);
            }          
        }
    }

    async render(){

        try{

            this.fillRect(0, 0, 100, 100, "black");

            await this.renderBG();
            this.renderTitle();
            this.renderPlayers();
            

        }catch(err){

            console.trace(err);

            this.fillRect(0, 0, 100, 100, "red");
            this.fillText({
                "text": "Error",
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
        <canvas width={1920 * 0.75} height={1080 * 0.75} ref={canvasRef}></canvas>
    </>
}