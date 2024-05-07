import Header from "../Header";
import InteractiveTable from "../InteractiveTable";
import { convertTimestamp, toPlaytime } from "@/app/lib/generic.mjs";
import Link from "next/link";

export default function BasicMapsList({data}){

    const headers = {
        "name": {"title": "Name"},
        "first": {"title": "First Match"},
        "last": {"title": "Last Match"},
        "matches": {"title": "Matches"},
        "playtime": {"title": "Playtime"},
    };

    const rows = data.map((d) =>{

        const first = Math.floor(new Date(d.first_match) * 0.001);
        const last = Math.floor(new Date(d.last_match) * 0.001);

        return {
            "name": {
                "value": d.name.toLowerCase(), 
                "displayValue": <Link href={`/matches?m=${d.id}`}>{d.name}</Link>,
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
            "matches": {"value": d.matches},
            "playtime": {"value": d.playtime, "displayValue": toPlaytime(d.playtime)},
        }
    });

    return <>
        <Header>Most Played Maps</Header>
        <InteractiveTable width={1} headers={headers} rows={rows} bNoHeaderSorting={true} sortBy="playtime" order="DESC"/>
    </>
}