"use client"
import { useRouter } from "next/navigation";
import { VALID_PLAYER_MATCH_TYPES, VALID_PLAYER_LIFETIME_TYPES } from "@/app/lib/validRecordTypes";

export default function DropDown({mode, cat, gametypeNames, selectedGametype}){

    const router = useRouter();

    const options = (mode === "match") ? VALID_PLAYER_MATCH_TYPES : VALID_PLAYER_LIFETIME_TYPES;

    return <div className="form">
        <div className="form-row">
            <label>Record Type</label>
            <select className="select" value={cat} onChange={(e) =>{
                router.push(`/records?mode=${mode}&cat=${e.target.value}&g=${selectedGametype}`);
            }}>
                <option value="" key="-1">Select a category</option>
                {options.map((o, i) =>{
                    return <option key={i} value={o.value}>{o.display}</option>
                })}
            </select>
        </div>
        <div className="form-row">
            <label>Gametype</label>
            <select value={selectedGametype} onChange={(e) =>{
                
                router.push(`/records?mode=${mode}&cat=${cat}&g=${e.target.value}`);
            }}>
                <option value="-1">Any</option>
                {gametypeNames.map((g) =>{
                    return <option value={g.id} key={g.id}>
                        {g.name}
                    </option>
                })}
            </select>
        </div>
    </div>;
}