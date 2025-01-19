//server side canvas match screenshots

import { createCanvas, loadImage, createImageData } from "canvas";
import { getMatch, getOGImagePlayerMatchData } from './matches.mjs';
import { getTeamName, bLSMGame } from './generic.mjs';

const redTeamColor = "rgb(255,0,0)";
const blueTeamColor = "rgb(0,193,255)";
const greenTeamColor = "rgb(0,255,0)";
const yellowTeamColor = "rgb(255,255,0)";

const dmNameColor = `rgb(0,194,255)`;
const dmScoreColor = `rgb(194,255,255)`;

export default class serverMatchScreenshot{

    constructor(matchId, width, height){

        this.id = matchId;
        this.width = width;
        this.height = height; 
    }

    //convert percent to pixels
    scale(axis, percent){

        if(percent === 0) return 0;

        axis = axis.toLowerCase();
        const size = (axis === "x") ? this.width  : this.height;

        const bit = size / 100;


        return bit * percent;
    }

    async loadData(){

        this.data = await getMatch(this.id);
        this.playerData = await getOGImagePlayerMatchData(this.id);


    }

    fillText(text, x, y, maxWidth, fontSize, color, textAlign){

        const c = this.ctx;

        if(maxWidth == null) maxWidth = 100;
        
        maxWidth = this.scale("x", 100);

        if(color != null){
            c.fillStyle = color;
        }

        if(fontSize != null){
            c.font = `${this.scale("y", fontSize)}px Arial`;
        }

        if(textAlign != null){
            c.textAlign = textAlign;
        }

        x = this.scale("x", x);
        y = this.scale("y", y);
        

        c.fillText(text, x, y, maxWidth);

    }


    renderTeamScoreboard(teamId){

        const headerFontSize = 7;

        let fontColor = redTeamColor;
        let startX = 5;
        let startY = 8;
        let maxPlayersPerTeam = 12;

        if(this.data.total_teams > 2){
            maxPlayersPerTeam = 5;
        }

        const scoreOffset = 40;

        if(teamId === 1){
            fontColor = blueTeamColor;
            startX = 55;
        }else if(teamId === 2){
            fontColor = greenTeamColor;
            startY = 58;
        }else if(teamId === 3){
            fontColor = yellowTeamColor;
            startY = 58;
            startX = 55;
        }


        this.fillText(`${getTeamName(teamId)} Team`, startX, startY, 50, headerFontSize, fontColor, "left");
        this.fillText(this.data[`team_${teamId}_score`], startX + scoreOffset, startY, 50, headerFontSize, fontColor, "right");


        const rowHeight = 7;
        const playerFontSize = 6;
        let playerIndex = 0;


        for(let i = 0; i < this.playerData.length; i++){

            const p = this.playerData[i];

            if(p.team !== teamId) continue;

            let x = startX;
            let y = startY + rowHeight + rowHeight * playerIndex; 

            this.fillText(p.name, x, y, 50, playerFontSize, fontColor, "left");
            this.fillText(p.frags, x + scoreOffset, y, 50, playerFontSize, fontColor, "right");

            playerIndex++;
            if(playerIndex >= maxPlayersPerTeam) return;
        }
    }



    renderSoloScoreBoard(){

        //TODO:
        //add support for LMS
        const nameOffsetX = 5;
        const fragsOffsetX = 70;
        const deathsOffsetX = 90;

        const headerFontSize = 6;
        const fontSize = 5;
        const rowHeight = 5.8;

        const startY = 10;


        const bLMS = bLSMGame(this.data.gametypeName);

        this.fillText("Player", nameOffsetX, startY - 1, 75, headerFontSize, "white", "left");

        if(!bLMS){
            this.fillText("Frags", fragsOffsetX, startY - 1, 12, headerFontSize, "white", "right");
        }

        this.fillText((bLMS) ? "Lives" : "Deaths", deathsOffsetX, startY - 2, 12, headerFontSize, "white", "right");

        for(let i = 0; i < this.playerData.length; i++){

            const p = this.playerData[i];

            let y = startY + rowHeight + rowHeight * i;

            this.fillText(p.name, nameOffsetX, y, 75, fontSize, dmNameColor, "left");

            if(!bLMS){
                this.fillText(p.frags, fragsOffsetX, y, 12, fontSize, dmScoreColor, "right");
            }
            this.fillText((bLMS) ? p.score: p.deaths, deathsOffsetX, y, 12, fontSize, dmScoreColor, "right");

            if(i === 13) return;
        }
    }

    renderScoreboard(){

        const totalTeams = this.data.total_teams;

        if(totalTeams < 2){
            //dm scoreboard

            this.renderSoloScoreBoard();

        }else{

            for(let i = 0; i < totalTeams; i++){

                this.renderTeamScoreboard(i);
            }

        }
    }

    async create(){

        await this.loadData();

        if(this.data === null) throw new Error(`Failed to load match data for screenshot`);

        this.canvas = createCanvas(this.width, this.height);
        this.ctx = this.canvas.getContext('2d');

        const c = this.ctx;
        c.textBaseline = "top";

        c.font = `${this.scale("y", 5)}px Arial`;

        const bgImage = await loadImage(`./public/images/maps/${this.data.mapImage}`);
    
        c.fillStyle = "white";
        c.textAlign = "center";
        c.drawImage(bgImage, 0, 0, this.width, this.height)

        c.fillStyle = "rgba(0,0,0,0.65)";
        c.fillRect(0,0, this.width, this.height);

        this.fillText(this.data.gametypeName, 50, 0.5, 100, 5, "white", "center");


        this.renderScoreboard();
    
        const a = this.canvas.toBuffer("image/jpeg");
    
        return a;
    }
}
