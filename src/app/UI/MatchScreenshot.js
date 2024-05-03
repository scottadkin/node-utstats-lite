"use client"
import { useEffect, useRef } from "react";

class Screenshot{

    constructor(canvas, image){

        this.canvas = canvas.current;
        this.context = this.canvas.getContext("2d");

        this.context.textBaseline = "top";

        this.bgImage = image;

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

    drawText(options){

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

        this.context.fillStyle = "white";

        this.context.fillText(options.text, x, y, this.scale(maxWidth, "x"));

    }

    async render(){

        try{

            this.fillRect(0, 0, 100, 100, "black");

            await this.loadImage(`/images/maps/${this.bgImage}.jpg`);

            this.drawImage(`/images/maps/${this.bgImage}.jpg`, 0, 0, 100, 100);

            this.drawText({
                "text": "test",
                "x": 50,
                "y": 10,
                "fontSize": 25,
                "textAlign": "center",
                "maxWidth": 100
            });

        }catch(err){

            console.trace(err);

            this.fillRect(0, 0, 100, 100, "red");
            this.drawText({
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

export default function MatchScreenshot({}){

    const canvasRef = useRef(null);

    useEffect(() =>{

        new Screenshot(canvasRef, "condemned");
    }, [])

    return <>
        <canvas width={960} height={540} ref={canvasRef}></canvas>
    </>
}