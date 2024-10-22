"use client"
import Header from "../Header";
import useLocalStorage from "@/app/hooks/useLocalStorage";
import { useEffect } from "react";

export default function SavedMatches({}){

    const local = useLocalStorage();
    const test = local.getItem("saved-matches");

    useEffect(() =>{

        

        console.log(test);
    },[test]);

    return <>
        <Header>Saved Matches</Header>
    </>
}