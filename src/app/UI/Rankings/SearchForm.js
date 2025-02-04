"use client"
import { useRouter } from "next/navigation";
import { useState } from "react";
import PerPageDropDown from "../PerPageDropDown";

export default function SearchForm({targetNames, targetId, timeFrame, perPage, page, targetKey, mode}){

    const [target, setTarget] = useState(targetId);
    const [tf, setTf] = useState(timeFrame);
    const [pp, setPp] = useState(perPage);
    const [p, setP] = useState(page);

    const router = useRouter();

    const activeOptions = [
        {"display": "24 Hours", "value": 1},
        {"display": "7 Days", "value": 7},
        {"display": "14 Days", "value": 14},
        {"display": "28 Days", "value": 28},
        {"display": "90 Days", "value": 90},
        {"display": "365 Days", "value": 365},
        {"display": "No Limit", "value": 0},
    ];

    targetNames.sort((a, b) =>{
        
        a = a.name.toLowerCase();
        b = b.name.toLowerCase();

        if(a > b) return 1;
        if(a < b) return -1;
        return 0;
    });

    return <div className="form">
        <div className="form-row">
            <label>Gametype</label>
            <select value={target} onChange={(e) =>{
                setTarget(e.target.value);
                router.push(`/rankings?mode=${mode}&${targetKey}=${e.target.value}&tf=${tf}&pp=${pp}&p=1`);
            }}>
                {targetNames.map((g, i) =>{
                    return <option key={i} value={g.id}>{g.name}</option>
                })}
            </select>
        </div>
        <div className="form-row">
            <label>Active In Previous</label>
            <select value={timeFrame} onChange={(e) =>{
                setTf(e.target.value);
                router.push(`/rankings?mode=${mode}&${targetKey}=${target}&tf=${e.target.value}&pp=${pp}&p=1`);
            }}>
                {activeOptions.map((o, i) =>{
                    return <option key={i} value={o.value}>{o.display}</option>
                })}
            </select>
        </div>
        <div className="form-row">
            <label>Results Per Page</label>
            <PerPageDropDown selectedValue={pp} setValue={(value) =>{
                setPp(value);
                router.push(`/rankings?mode=${mode}&${targetKey}=${target}&tf=${tf}&pp=${value}&p=1`);
            }}/>
        </div>
            
    </div>
}