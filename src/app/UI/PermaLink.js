"use client"

import { useEffect, useState } from "react";

export default function PermaLink({url, text}){

    const [fullURL, setFullURL] = useState("");

    useEffect(() =>{
        setFullURL(`${window.location.protocol}//${window.location.host}${url}`);
    },[url]);


    return <div className="perma-link" onClick={async () =>{
        
        try {
            await navigator.clipboard.writeText(fullURL);
        }catch(err){
            console.error('Failed to copy: ', err);
        }
    }}>
        {(text !== undefined) ? text : "Copy Match PermaLink To Clipboard"}
    </div>;
}