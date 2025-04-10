"use client"
import { useEffect, useState } from "react";


function getSavedMatches(){
    let data = localStorage.getItem("saved-matches");
    if(data === null || data === "") data = "[]";
    data = JSON.parse(data);
    return data;
}

export default function AddToSavedMatches({hash}){


    const [saved, setSaved] = useState(false);

    useEffect(() =>{

        const data = getSavedMatches();
        localStorage.setItem("saved-matches", JSON.stringify(data));
    }, []);

    useEffect(() =>{

        const data = getSavedMatches();
        let bSaved = false;

        const index = data.indexOf(hash);

        if(index !== -1) bSaved = true;
        localStorage.setItem("saved-matches", JSON.stringify(data));
        setSaved(bSaved);


    }, [saved, hash]);

    
    const addElem = <div className="fav fav-add" onClick={() =>{


        const data = getSavedMatches();

        const index = data.indexOf(hash);

        if(index === -1){
            data.push(hash);
            setSaved(true);
        }
        localStorage.setItem("saved-matches", JSON.stringify(data));

        
    }}>
         Add To Match Watchlist
    </div>


    const delElem = <div className="fav fav-del" onClick={() =>{

        const data = getSavedMatches();
        const index = data.indexOf(hash);


        if(index !== -1){
            data.splice(index, 1);
        }

        localStorage.setItem("saved-matches", JSON.stringify(data));
        setSaved(false);
    }}>
        Remove From Watchlist
    </div>


    return <>
        {(saved) ? delElem : addElem}
    </>;
}