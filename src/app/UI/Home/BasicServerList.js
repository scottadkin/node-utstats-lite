import Header from "../Header";
import InteractiveTable from "../InteractiveTable";
import { convertTimestamp, toPlaytime } from "@/app/lib/generic.mjs";
import Link from "next/link";

export default function BasicServerList({servers}){

    const headers = {
        "name": {"title": "Name"},
        "first": {"title": "First Match"},
        "last": {"title": "Last Match"},
        "playtime": {"title": "Playtime"},
        "matches": {"title": "Matches"}
    };

    const rows = servers.map((s) =>{

        const first = Math.floor(new Date(s.first_match) * 0.001);
        const last = Math.floor(new Date(s.last_match) * 0.001);

        return {
            "name": {
                "value": s.name.toLowerCase(), 
                "displayValue": <Link href={`/matches/?s=${s.id}`}>{s.name}</Link>,
                "className": "text-left"
            },
            "first": {
                "value": first, 
                "displayValue": convertTimestamp(first, true),  
                "className": "date"
            },
            "last": {
                "value": last, 
                "displayValue": convertTimestamp(last, true),  
                "className": "date"
            },
            "playtime": {"value": s.playtime, "displayValue": toPlaytime(s.playtime)},
            "matches": {"value": s.matches},
        }
    });

    return <>
        <Header>Servers</Header>
        <InteractiveTable width={1} headers={headers} rows={rows}/>
    </>
}