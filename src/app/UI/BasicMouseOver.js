"use client"
import { useState, useRef, useEffect } from "react";
import useScreenInfo from "../hooks/useScreenInfo";

export default function BasicMouseOver({children, title, content}){

    const [bDisplay, setBDisplay] = useState(false);
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(-9999);
    const mouseRef = useRef(null);
    const screenInfo = useScreenInfo();

    useEffect(() =>{

        
        if(mouseRef.current !== null && bDisplay){

            const bounds = mouseRef.current.getBoundingClientRect();

            setWidth(bounds.width);
            setHeight(bounds.height);
        }

    },[screenInfo.screenWidth, screenInfo.screenHeight, bDisplay]);

    let mouseOverElem = null;

    if(bDisplay){
     
        mouseOverElem = <div ref={mouseRef} style={{/*"marginLeft": `${-width}px`,*/ "marginTop": `${-height}px`}} className="basic-mouse-over">
            <div className="basic-mouse-over-title">{title}</div>
            <div>{content}</div>
        </div>;
      
    }

    return <div className="basic-mouse-over-wrapper" onMouseOver={() =>{
        setBDisplay(true);
    }} onMouseLeave={() =>{
        setBDisplay(false);
    }}>
        {mouseOverElem}
        {children} 
    </div>
}