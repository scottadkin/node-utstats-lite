"use client"
import { useEffect, useRef } from "react";
import MatchScreenshot from "../MatchScreenshot";
import PermaLink from "./PermaLink";

export default function Screenshot({data}){

    const canvasRef = useRef(null);

    useEffect(() =>{

        const img = new MatchScreenshot(canvasRef, data, false);
        img.render();

    }, [data])

    return <>
        <canvas className="match-sshot" width={2560} height={1440} ref={canvasRef}></canvas><br/><br/>
        <PermaLink url={`/api/matchshotALT/?id=${data.basic.hash}`} text="Copy screenshot link to clipboard"/>
    </>
}