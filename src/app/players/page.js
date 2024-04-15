"use server"
import { getPlayersList } from "../lib/players.mjs";
import Header from "../UI/Header";
import InteractiveTable from "../UI/InteractiveTable";
import CountryFlag from "../UI/CountryFlag";
import { ignore0, toPlaytime } from "../lib/generic.mjs";


export default async function Page({params, searchParams}) {

    const players = await getPlayersList();

    const headers = {
        "name": {"title": "Name"},
        "active": {"title": "Last Active"},
        "score": {"title": "Score"},
        "frags": {"title": "Frags"},
        "kills": {"title": "Kills"},
        "deaths": {"title": "Deaths"},
        "suicides": {"title": "Suicides"},
        "eff": {"title": "Eff"},
        "matches": {"title": "Matches"},
        "playtime": {"title": "Playtime"}
    };

    const rows = [];

    for(let i = 0; i < players.length; i++){

        const p = players[i];

        rows.push({
            "name": {
                "value": p.name.toLowerCase(), 
                "displayValue": <><CountryFlag code={p.country}/>{p.name}</>,
                "className": "player-name-td text-left"
            },
            "score": {"value": p.score, "displayValue": ignore0(p.score)},
            "frags": {"value": p.frags, "displayValue": ignore0(p.frags)},
            "kills": {"value": p.kills, "displayValue": ignore0(p.kills)},
            "deaths": {"value": p.deaths, "displayValue": ignore0(p.deaths)},
            "suicides": {"value": p.suicides, "displayValue": ignore0(p.suicides)},
            "eff": {"value": p.eff, "displayValue": `${p.eff.toFixed(2)}%`},
            "matches": {"value": p.matches, "displayValue": p.matches},
            "playtime": {
                "value": p.playtime, 
                "displayValue": toPlaytime(p.playtime),
                "className": "font-small"
            },
        });
    }

    return <div>
        <Header>Player List</Header>
        <InteractiveTable width={1} headers={headers} rows={rows}/>
    </div>
}