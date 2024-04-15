"use client"
import Link from "next/link";
import { useState } from "react";

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

            <select defaultValue={sortByOptions} onChange={(e) =>{
                setSortBy(e.target.value);
            }}>
                {sortByOptions.map((o, i) =>{
                    return <option key={i} value={o.value}>{o.display}</option>
                })}
            </select>
        </div>
        <div className="form-row">
            <label htmlFor="order">
               Order
            </label>
            <select defaultValue={order} onChange={(e) =>{
                setOrder(e.target.value);
            }}>
                {orderOptions.map((o, i) =>{
                    return <option key={i} value={o.value}>{o.display}</option>
                })}
            </select>
        </div>
        <div className="form-row">
            <label htmlFor="per-page">
               Per Page
            </label>
            <select defaultValue={perPage} onChange={(e) =>{
                setPerPage(e.target.value);
            }}>
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="75">75</option>
                <option value="100">100</option>
            </select>
        </div>

        <div className="text-center">
            <Link href={url}><div className="submit-button">Search</div></Link>
        </div>
    </div>
}
