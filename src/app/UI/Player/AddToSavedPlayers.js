"use client"
import useLocalStorage from "@/app/hooks/useLocalStorage";
import { useState, useEffect } from "react";

export default function AddToSavedPlayers({hash}){

    const [bSaved, setBSaved] = useState(false);
    const local = useLocalStorage();

    useEffect(() =>{

        const savedPlayers = local.getItem("saved-players");

        if(savedPlayers === null){

            local.setItem("saved-players", []);
            return;
        }

        if(savedPlayers.indexOf(hash) !== -1){
            setBSaved(true);
        }else{
            setBSaved(false);
        }

    },[hash, local, bSaved]);

    if(bSaved){

        return <div className={`fav fav-del`} onClick={() =>{

            const saved = local.getItem("saved-players");
    
            const index = saved.indexOf(hash);

            if(index === -1) return;
    
            saved.splice(index, 1);
            local.setItem("saved-players", saved);
            setBSaved(false);
        }}>
            Remove From Watchlist
        </div>;
    }

    return <div className={`fav fav-add`} onClick={() =>{

        const saved = local.getItem("saved-players");

        if(saved.indexOf(hash) !== -1) return;

        saved.push(hash);
        local.setItem("saved-players", saved);
        setBSaved(true);
    }}>
        Add To Watchlist
    </div>;

    
}