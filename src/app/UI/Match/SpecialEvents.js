import Header from "../Header";
import InteractiveTable from "../InteractiveTable";
import { ignore0, plural, getTeamColorClass } from "@/app/lib/generic.mjs";
import PlayerLink from "../PlayerLink";

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
                <td className={teamColor}><PlayerLink id={player.player_id} country={player.country}>{player.name}</PlayerLink></td>
            </tr>
        </tbody>
    </table>
}

export default function SpecialEvents({data, totalTeams}){

    const multiHeaders = {
        "player": 
            {"title": <>Player</>    
        },
        "double": {
            "title": <>Double</>,
            "mouseOverBox": {
                "title": `Double Kill`,
                "content": `Player got 2 kills in a short amount of time without dying`
            }
        },
        "multi": {
            "title": <>Multi</>,
            "mouseOverBox": {
                "title": `Multi Kill`,
                "content": `Player got 3 kills in a short amount of time without dying`
            }
        },
        "ultra": {
            "title": <>Ultra</>,
            "mouseOverBox": {
                "title": `Ultra Kill`,
                "content": `Player got 4 kills in a short amount of time without dying`
            }
        },
        "monster": {
            "title": <>Monster</>,
            "mouseOverBox": {
                "title": `Monster Kill`,
                "content": `Player got 5 or more kills in a short amount of time without dying`
            }
        },
        "bestMulti": {
            "title": <>Best</>,
            "mouseOverBox": {
                "title": `Best Multi Kill`,
                "content": `The most amount of kills the player got in a short amount of time without dying`
            }
        },
    };

    const spreeHeaders = {
        "player": {"title": <>Player</>},
        "spree": {
            "title": <>Killing Spree</>,
            "mouseOverBox": {
                "title": "Killing Spree",
                "content": `Player killed 5 to 9 players in a single life`
            }
        },
        "rampage": {
            "title": <>Rampage</>,
            "mouseOverBox": {
                "title": "Rampage",
                "content": `Player killed 10 to 14 players in a single life`
            }
        },
        "dominating": {
            "title": <>Dominating</>,
            "mouseOverBox": {
                "title": "Dominating",
                "content": `Player killed 15 to 19 players in a single life`
            }
        },
        "unstoppable": {
            "title": <>Unstoppable</>,
            "mouseOverBox": {
                "title": "Unstoppable",
                "content": `Player killed 20 to 24 players in a single life`
            }
        },
        "godlike": {
            "title": <>Godlike</>,
            "mouseOverBox": {
                "title": "Godlike",
                "content": `Player killed at least 25 players in a single life`
            }
        },
        "bestSpree": {
            "title": <>Best</>,
            "mouseOverBox": {
                "title": "Best Spree",
                "content": `Most amount of kills a player got in a single life`
            }
        }
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
                    "displayValue": <PlayerLink id={p.player_id} country={p.country}>{p.name}</PlayerLink>,
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
                    "displayValue": <PlayerLink id={p.player_id} country={p.country}>{p.name}</PlayerLink>,
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

    if(spreeRows.length === 0 && multiRows.length === 0) return null;
    
    return <div>
        <Header>Special Events</Header>
        {renderFirstBlood(data.playerData, totalTeams)}
        {(spreeRows.length === 0) ? null : <InteractiveTable width={3} headers={spreeHeaders} rows={spreeRows}/>}
        {(multiRows.length === 0) ? null : <InteractiveTable width={3} headers={multiHeaders} rows={multiRows}/>}
    </div>
}