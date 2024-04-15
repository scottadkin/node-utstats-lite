"use client"
import Link from "next/link";
import { useState } from "react";

export default function SearchForm(){

    const [name, setName] = useState("");

    let url = `/players/`;

    if(name !== ""){
        url += `?name=${name}`;
    }


    return <div className="form margin-bottom-1">
        <div className="form-row">
            <label htmlFor="name">Name</label>
            <input 
                type="text" 
                className="textbox" 
                name={"name"} 
                placeholder="player name..."
                onChange={(e) =>{
                    console.log(e.target.value);
                    setName(e.target.value);
                }}

            />
        </div>
        <div className="text-center">
            <Link href={url}><div className="submit-button">Search</div></Link>
        </div>
    </div>
}