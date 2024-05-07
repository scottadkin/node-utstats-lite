import InteractiveTable from "../InteractiveTable";
import Header from "../Header";
import { ignore0, toPlaytime, convertTimestamp } from "@/app/lib/generic.mjs";

export default function GametypeTotals({data, names}){

    const headers = {
        "gametype": {"title": "Gametype"},
        "last": {"title": "Last Active"},
        "score": {"title": "Score"},
        "frags": {"title": "Frags"},
        "deaths": {"title": "Deaths"},
        "suicides": {"title": "Suicides"},
        "teamKills": {"title": "Team Kills"},
        "eff": {"title": "Eff"},
        "matches": {"title": "Matches"},
        "wins": {"title": "Wins"},
        "winrate": {"title": "Win Rate"},
        "playtime": {"title": "Playtime"}

    };

    const rows = [];

    for(let i = 0; i < data.length; i++){

        const d = data[i];

        const date = Math.floor(new Date(d.last_active) * 0.001);

        rows.push({
            "gametype": {
                "value": names[d.gametype_id].toLowerCase(), 
                "displayValue": names[d.gametype_id],
                "className": "text-left"
            },
            "last": {
                "value": date, "displayValue": convertTimestamp(date, true),
                "className": "date"
            },
            "matches": {"value": d.total_matches, "displayValue": d.total_matches},
            "playtime": {
                "value": d.playtime, 
                "displayValue": toPlaytime(d.playtime),
                "className": "font-small"
            },
            "score": {"value": d.score, "displayValue": ignore0(d.score)},
            "frags": {"value": d.frags, "displayValue": ignore0(d.frags)},
            "deaths": {"value": d.deaths, "displayValue": ignore0(d.deaths)},
            "suicides": {"value": d.score, "displayValue": ignore0(d.suicides)},
            "teamKills": {"value": d.team_kills, "displayValue": ignore0(d.team_kills)},
            "eff": {"value": d.efficiency, "displayValue": `${d.efficiency.toFixed(2)}%`},
            "wins": {"value": d.wins, "displayValue": ignore0(d.wins)},
            "winrate": {"value": d.winrate, "displayValue": `${d.winrate.toFixed(2)}%`},
        });
    }

    return <>
        <Header>Gametype Totals</Header>
        <InteractiveTable width={1} headers={headers} rows={rows}/>
    </>
}