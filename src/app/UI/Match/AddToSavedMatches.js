"use client"
import useLocalStorage from "@/app/hooks/useLocalStorage";
import { useEffect, useState } from "react";

export default function AddToSavedMatches({hash}){

    const local = useLocalStorage();

    const [saved, setSaved] = useState(false);
    let matches = local.getItem("saved-matches");

    useEffect(() =>{

        let bSaved = false;

        //will be null on client, on server undefined
        if(matches === null){
            //matches = JSON.parse(matches);
            local.setItem("saved-matches",[]);
            matches = [];
            return;
        }

        const index = matches.indexOf(hash);

        if(index !== -1) bSaved = true;
 
        setSaved(bSaved);


    }, [saved]);

    
    const addElem = <div className="fav fav-add" onClick={() =>{

        const index = matches.indexOf(hash);

        if(index === -1){
            matches.push(hash);
        }

        local.setItem("saved-matches", matches);

        setSaved(true);
    }}>
         Add to watchlist
    </div>


    const delElem = <div className="fav fav-del" onClick={() =>{

        const index = matches.indexOf(hash);

        let newMatches = matches;

        if(index !== -1){
            newMatches.splice(index, 1);
        }

        local.setItem("saved-matches", newMatches);

        setSaved(false);
    }}>
        Remove from watchlist
    </div>


    return <div className="text-center">
        {(saved) ? delElem : addElem}
    </div>;
}