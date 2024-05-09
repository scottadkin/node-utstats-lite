"use client"
import { useState, useEffect} from "react";
import { useRouter } from "next/navigation";
import PerPageDropDown from "../PerPageDropDown";



export default function SearchForm({originalName, originalSortBy, originalOrder, originalPerPage}){

    const [name, setName] = useState(originalName);
    const [sortBy, setSortBy] = useState(originalSortBy);
    const [order, setOrder] = useState(originalOrder);
    const [perPage, setPerPage] = useState(originalPerPage);

    const router = useRouter()


    let url = `/players/`;

    url += `?name=${name}&sortBy=${sortBy}&order=${order}&perPage=${perPage}`;



    useEffect(() =>{
        router.push(url)
    },[router, url]);
    

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
                    setName(e.target.value);
                    
                }}

            />
        </div>
        <div className="form-row">
            <label htmlFor="sort-by">
                Sort By
            </label>

            <select defaultValue={originalSortBy} multiple={false} onChange={(e) =>{
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
            <select defaultValue={order} multiple={false} onChange={(e) =>{
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
            <PerPageDropDown selectedValue={perPage} setValue={(value) =>{
                setPerPage(value);
            }}/>
        </div>
    </div>
}
