"use client"
import { useState, useRef, useEffect } from "react";

export default function TableHeader({children, onClick, mouseOverBox, bNoSorting}){

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

    const mouseTitleElem = (mouseOverBox.title === null) ? null : <div className="mouse-over-title">{mouseOverBox.title}</div>;
    
    return <th onClick={onClick} onMouseOver={onMouseOver} onMouseLeave={onMouseLeave} className={`${(bNoSorting) ? "" : "sort-hover" }`}>
        <div className={`mouse-over ${(bDisplayMouseOver) ? "" : "hidden"}`} ref={mouseRef}>
            {mouseTitleElem}
            {mouseOverBox.content}
        </div>
        {children}
    </th>
}