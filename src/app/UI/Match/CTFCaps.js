import Header from "../Header";
import { getTeamName, MMSS, getTeamColorClass, getPlayer } from "@/app/lib/generic.mjs";
import PlayerLink from "../PlayerLink";


function getAssistString(c, players){

    let message = "";

    if(c.unique_carriers === 1){
        return "Solo Cap";
    }


    return "Assisted Cap";
}

export default function CTFCaps({caps, totalTeams, players}){

    const scores = Array(totalTeams).fill(0);

    const elems = [];

    for(let i = 0; i < caps.length; i++){

        const c = caps[i];

        scores[c.capping_team]++;

        const takenPlayer = getPlayer(players, c.taken_player);
        const capPlayer = getPlayer(players, c.cap_player);

        elems.push(
            <div className={`ctf-cap ${getTeamColorClass(c.capping_team)}`} key={i}>
                <PlayerLink id={c.cap_player} country={capPlayer.country}>{capPlayer.name}</PlayerLink>&nbsp;
                Captured The {getTeamName(c.flag_team)} Flag&nbsp;
                <div className="cap-info">
                    Taken by <b>{takenPlayer.name}</b> @ {MMSS(c.taken_timestamp)}, Capped by <b>{capPlayer.name}</b> @ {MMSS(c.cap_timestamp)}<br/>
                    {getAssistString(c, players)}
                </div>
                <div className="cap-scores">
                    {scores.join(" - ")}
                </div>
            </div>
        );

    }
    //{getTeamName(c.capping_team)} Team Scores!

    console.log(scores);
    return <>
        <Header>CTF Caps</Header>
        <div className="ctf-caps">
            {elems}
        </div>
    </>
}