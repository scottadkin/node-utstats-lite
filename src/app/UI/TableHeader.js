"use client"
import { useState, useRef, useEffect } from "react";

export default function TableHeader({children, onClick, mouseOverBox}){

    const [bDisplayMouseOver, setBDisplayMouseOver] = useState(false);
    const [marginTop, setMarginTop] = useState(0);
    const mouseRef = useRef(null);
    
    useEffect(() =>{
        

        if(!bDisplayMouseOver) return;

        const bounds = mouseRef.current.getBoundingClientRect();

        mouseRef.current.style.marginTop = `${-bounds.height}px`;
        
        
    },[bDisplayMouseOver]);



    let onMouseOver = null;
    let onMouseLeave = null;

    if(mouseOverBox !== undefined){

        if(mouseOverBox.content !== null){
            onMouseOver = () =>{
                
                setBDisplayMouseOver(true);
                
            }

            onMouseLeave = () =>{
                setBDisplayMouseOver(false);
            }
        }
    }
    
    return <th onClick={onClick} onMouseOver={onMouseOver} onMouseLeave={onMouseLeave}>
        <div className={`mouse-over ${(bDisplayMouseOver) ? "" : "hidden"}`} ref={mouseRef}>
            {mouseOverBox.content}
        </div>
        {children}
    </th>
}