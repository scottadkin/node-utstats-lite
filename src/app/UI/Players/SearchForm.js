"use client"
import Link from "next/link";
import { useState } from "react";
import DropDown from "../DropDown";

export default function SearchForm({originalName, originalSortBy, originalOrder}){

    const [name, setName] = useState(originalName);
    const [sortBy, setSortBy] = useState(originalSortBy);
    const [order, setOrder] = useState(originalOrder);

    let url = `/players/`;

    url += `?name=${name}&sortBy=${sortBy}&order=${order}`;
    

    const sortByOptions =  [
        {"value": "name", "display": "Name"}, 
        {"value": "last_active", "display": "Last Active"}, 
        {"value": "score", "display": "Score"}, 
        {"value": "frags", "display": "Frags"}, 
        {"value": "kills", "display": "Kills"}, 
        {"value": "deaths", "display": "Deaths"}, 
        {"value": "suicides", "display": "Suicides"}, 
        {"value": "eff", "display": "Efficiency"}, 
        {"value": "matches", "display": "Matches"}, 
        {"value": "playtime", "display": "Playtime"}
    ];

    const orderOptions = [
        {"value": "ASC", "display": "Ascending"}, 
        {"value": "DESC", "display": "Descending"}, 

    ];


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
        <div className="form-row">
            <label htmlFor="sort-by">
                Sort By
            </label>
            <DropDown options={sortByOptions} selectedValue={sortBy} changeSelected={(value) =>{
                setSortBy(value);
            }}/>
        </div>
        <div className="form-row">
            <label htmlFor="order">
               Order
            </label>
            <DropDown options={orderOptions} selectedValue={order} changeSelected={(value) =>{
                setOrder(value);
            }}/>
        </div>

        <div className="text-center">
            <Link href={url}><div className="submit-button">Search</div></Link>
        </div>
    </div>
}