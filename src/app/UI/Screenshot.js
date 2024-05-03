"use client"
import { useEffect, useRef } from "react";
import { MMSS } from "../lib/generic.mjs";

class ScreenshotImage{

    constructor(canvas, basic, players){

        this.canvas = canvas.current;
        this.context = this.canvas.getContext("2d");

        console.log(basic);

        this.basic = basic;
        this.players = players;

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

        let mapImageURL = `/images/maps/${this.basic.mapImage}`;

            try{

                await this.loadImage(mapImageURL);
            }catch(err){

                mapImageURL = `/images/maps/default.jpg`;
                await this.loadImage(mapImageURL);
            }

            this.drawImage(mapImageURL, 0, 0, 100, 100);
    }
    
    renderTitle(){

        const titleOptions = {
            "text": this.basic.gametypeName,
            "x": 50,
            "y": 3,
            "fontSize": 4,
            "textAlign": "center",
            "color": "white"
        };

        this.fillText(titleOptions);

        const endedOptions = {
            "text": "The match has ended. Hit [Fire] to continue!",
            "x": 50,
            "y": 92,
            "color": "rgb(0,255,0)",
            "fontSize": 1.8
        };

        const footerAOptions = {
            "text": `${this.basic.gametypeName} in ${this.basic.mapName}`,
            "x": 50,
            "y": 96,
            "fontSize": 1.8,
            "color": "white"
        };

        const footerBOptions = {
            "text": `Elapsed Time: ${MMSS(this.basic.playtime)}`,
            "x": 50,
            "y": 97.8
        };

        this.fillText(endedOptions);
        this.fillText(footerAOptions);
        this.fillText(footerBOptions);
    }

    async render(){

        try{

            this.fillRect(0, 0, 100, 100, "black");

            await this.renderBG();
            this.renderTitle();
            

        }catch(err){

            console.trace(err);

            this.fillRect(0, 0, 100, 100, "red");
            this.fillText({
                "text": "Error",
                "x": 50,
                "y": 10,
                "fontSize": 25,
                "textAlign": "center",
                "maxWidth": 100
            });
        }
    }

}

export default function Screenshot({basic, players}){

    const canvasRef = useRef(null);

    useEffect(() =>{

        new ScreenshotImage(canvasRef, basic, players);

        console.log(basic);
    }, [])

    return <>
        <canvas width={960} height={540} ref={canvasRef}></canvas>
    </>
}