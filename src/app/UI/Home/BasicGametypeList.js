import Header from "../Header";
import InteractiveTable from "../InteractiveTable";
import { convertTimestamp, toPlaytime } from "@/app/lib/generic.mjs";
import Link from "next/link";

export default function BasicGametypeList({gametypes}){

    const headers = {
        "name": {"title": "Name"},
        "first": {"title": "First Match"},
        "last": {"title": "Last Match"},
        "playtime": {"title": "Playtime"},
        "matches": {"title": "Matches"}
    };

    const rows = gametypes.map((g) =>{

        const first = Math.floor(new Date(g.first_match) * 0.001);
        const last = Math.floor(new Date(g.last_match) * 0.001);

        return {
            "name": {
                "value": g.name.toLowerCase(), 
                "displayValue": <Link href={`/matches/?g=${g.id}`}>{g.name}</Link>,
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
            "playtime": {"value": g.playtime, "displayValue": toPlaytime(g.playtime), "className": "date"},
            "matches": {"value": g.matches},
        }
    });

    return <>
        <Header>Gametypes</Header>
        <InteractiveTable width={1} headers={headers} rows={rows}/>
    </>
}