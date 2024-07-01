import Header from "../UI/Header";
import {getAllStats} from "../lib/maps.mjs";
import InteractiveTable from "../UI/InteractiveTable";
import { convertTimestamp, toPlaytime } from "../lib/generic.mjs";
import Link from "next/link";

export async function generateMetadata({ params, searchParams }, parent) {

    return {
        "title": `Map List - Node UTStats Lite`,
        "description": `View all maps that have been played on our servers`
    }
}

function createMatchURL(targetId, dates){

    if(dates[targetId] !== undefined){
        return `/match/${dates[targetId]}`;
    }

    return `/maps`;
}

export default async function MapsPage({}){

    const {maps, earliest, latest} = await getAllStats();

    const headers = {
        "name": {"title": "Name"},
        "first": {"title": "First Match"},
        "last": {"title": "Last Match"},
        "matches": {"title": "Total Matches"},
        "playtime": {"title": "Total Playtime"},
    };

    const rows = maps.map((d) =>{

        const firstURL = createMatchURL(d.id, earliest);
        const lastURL = createMatchURL(d.id, latest);

        return {
            "name": {
                "value": d.name.toLowerCase(), 
                "displayValue": <Link href={`/map/${d.id}`}>{d.name}</Link>,
                "className": "text-left"
            },
            "matches": {
                "value": d.matches
            },
            "playtime": {
                "value": d.playtime,
                "displayValue": toPlaytime(d.playtime),
                "className": "date"
            },
            "first": {
                "value": d.first_match,
                "displayValue": <Link href={firstURL}>{convertTimestamp(Math.floor(new Date(d.first_match) * 0.001), true)}</Link>,
                "className": "date"
            },
            "last": {
                "value": d.last_match,
                "displayValue": <Link href={lastURL}>{convertTimestamp(Math.floor(new Date(d.last_match) * 0.001), true)}</Link>,
                "className": "date"
            }
        };
    });

    return <main>
        <Header>Maps</Header>
        <InteractiveTable headers={headers} rows={rows} width={2}/>
    </main>;
}