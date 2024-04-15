"use client"
import Link from "next/link";
import { useState } from "react";
import DropDown from "../DropDown";

export default function SearchForm({originalName, originalSortBy, originalOrder, originalPerPage}){

    const [name, setName] = useState(originalName);
    const [sortBy, setSortBy] = useState(originalSortBy);
    const [order, setOrder] = useState(originalOrder);
    const [perPage, setPerPage] = useState(originalPerPage);

    let url = `/players/`;

    url += `?name=${name}&sortBy=${sortBy}&order=${order}&perPage=${perPage}`;
    

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

    const perPageOptions = [
        {"value": 5, "display": "5"}, 
        {"value": 10, "display": "10"}, 
        {"value": 25, "display": "25"}, 
        {"value": 50, "display": "50"}, 
        {"value": 75, "display": "75"}, 
        {"value": 100, "display": "100"}, 
        {"value": 250, "display": "250"}

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
        <div className="form-row">
            <label htmlFor="per-page">
               Per Page
            </label>
            <DropDown options={perPageOptions} selectedValue={perPage} changeSelected={(value) =>{
                setPerPage(value);
            }}/>
        </div>

        <div className="text-center">
            <Link href={url}><div className="submit-button">Search</div></Link>
        </div>
    </div>
}