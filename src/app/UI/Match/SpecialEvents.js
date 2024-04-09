import Header from "../Header";
import InteractiveTable from "../InteractiveTable";
import { ignore0, plural, getTeamColorClass } from "@/app/lib/generic.mjs";
import CountryFlag from "../CountryFlag";

function bHadAnyMultiEvents(playerData){

    const events = [
        "multi_1","multi_2","multi_3","multi_4",
    ];

    if(playerData.multi_best < 2) return false;

    for(let i = 0; i < events.length; i++){

        const e = events[i];
        if(playerData[e] !== 0) return true;
    }

    return false;
}

function bHadAnySpreeEvents(playerData){

    const events = [
        "spree_1","spree_2","spree_3","spree_4","spree_5","spree_best",
    ];

    if(playerData.spree_best < 5) return false;

    for(let i = 0; i < events.length; i++){

        const e = events[i];
        if(playerData[e] !== 0) return true;
    }

    return false;
}


function renderFirstBlood(data, totalTeams){

    let player = null;

    for(let i = 0; i < data.length; i++){

        const p = data[i];

        if(p.first_blood === 1){
            player = p;
            break;
        }
    }

    if(player === null) return null;

    let teamColor = "";

    if(totalTeams > 0){
        teamColor = getTeamColorClass(player.team);
    }

    return <table>
        <tbody>
            <tr>
                <td>First Blood</td>
                <td className={teamColor}><CountryFlag code={player.country}/>{player.name}</td>
            </tr>
        </tbody>
    </table>
}

export default function SpecialEvents({data, totalTeams}){

    data = JSON.parse(data);

    const multiHeaders = {
        "player": {"title": <>Player</>},
        "double": {"title": <>Double Kill</>},
        "multi": {"title": <>Multi Kill</>},
        "ultra": {"title": <>Ultra Kill</>},
        "monster": {"title": <>Monster Kill</>},
        "bestMulti": {"title": <>Best</>},
    };

    const spreeHeaders = {
        "player": {"title": <>Player</>},
        "spree": {"title": <>Killing Spree</>},
        "rampage": {"title": <>Rampage</>},
        "dominating": {"title": <>Dominating</>},
        "unstoppable": {"title": <>Unstoppable</>},
        "godlike": {"title": <>Godlike</>},
        "bestSpree": {"title": <>Best</>}
    }

    const multiRows = [];
    const spreeRows = [];

    for(let i = 0; i < data.playerData.length; i++){

        const p = data.playerData[i];

        let teamColor = "";

        if(totalTeams > 0){
            teamColor = getTeamColorClass(p.team);
        }

        if(bHadAnyMultiEvents(p)){

            multiRows.push({
                "player": {
                    "value": p.name.toLowerCase(), 
                    "displayValue": <><CountryFlag code={p.country}/>{p.name}</>,
                    "className": `text-left ${teamColor} player-name-td`
                },
                "double": {"value": p.multi_1, "displayValue": ignore0(p.multi_1)},
                "multi": {"value": p.multi_2, "displayValue":  ignore0(p.multi_2)},
                "ultra": {"value": p.multi_3, "displayValue":  ignore0(p.multi_3)},
                "monster": {"value": p.multi_4, "displayValue":  ignore0(p.multi_4)},
                "bestMulti": {"value": p.multi_best, "displayValue":  <>{p.multi_best} {plural(p.multi_best, "kill")}</>},
            });
        }

        if(bHadAnySpreeEvents(p)){

            spreeRows.push({
                "player": {
                    "value": p.name.toLowerCase(), 
                    "displayValue": <><CountryFlag code={p.country}/>{p.name}</>,
                    "className": `text-left ${teamColor} player-name-td`
                },
                "spree": {"value": p.spree_1, "displayValue":  ignore0(p.spree_1)},
                "rampage": {"value": p.spree_2, "displayValue":  ignore0(p.spree_2)},
                "dominating": {"value": p.spree_3, "displayValue":  ignore0(p.spree_3)},
                "unstoppable": {"value": p.spree_4, "displayValue":  ignore0(p.spree_4)},
                "godlike": {"value": p.spree_5, "displayValue":  ignore0(p.spree_5)},
                "bestSpree": {"value": p.spree_best, "displayValue":  <>{p.spree_best} {plural(p.spree_best, "kill")}</>},
            });
        }
    }

    return <div className="test">
        <Header>Special Events</Header>
        {renderFirstBlood(data.playerData, totalTeams)}
        {(spreeRows.length === 0) ? null : <InteractiveTable width={3} headers={spreeHeaders} rows={spreeRows}/>}
        {(multiRows.length === 0) ? null : <InteractiveTable width={3} headers={multiHeaders} rows={multiRows}/>}
    </div>
}