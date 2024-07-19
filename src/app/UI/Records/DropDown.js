"use client"
import { useRouter } from "next/navigation";
import { VALID_PLAYER_MATCH_TYPES, VALID_PLAYER_LIFETIME_TYPES } from "@/app/lib/validRecordTypes";

export default function DropDown({mode, cat}){

    const router = useRouter();

    const options = (mode === "match") ? VALID_PLAYER_MATCH_TYPES : VALID_PLAYER_LIFETIME_TYPES;

    return <div className="form">
        <div className="form-row">
            <label>Record Type</label>
            <select className="select" value={cat} onChange={(e) =>{
                router.push(`/records?mode=${mode}&cat=${e.target.value}`);
            }}>
                <option value="" key="-1">Select a category</option>
                {options.map((o, i) =>{
                    return <option key={i} value={o.value}>{o.display}</option>
                })}
            </select>
        </div>
    </div>;
}