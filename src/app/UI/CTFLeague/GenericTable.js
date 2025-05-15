import { getOrdinal, getPlayer, ignore0 } from "@/app/lib/generic.mjs";
import InteractiveTable from "../InteractiveTable";
import PlayerLink from "../PlayerLink";


export default function GenericTable({title, data, type, gametypeNames, mapNames, playerNames}){


    const headers = {
            "place": {"title": "Place"},
            "player": {"title": "Player"},
            "total_matches": {"title": "Played"},
            "wins": {"title": "Wins"},
            "draws": {"title": "Draws"},
            "loss": {"title": "Losses"},
            "cap_for": {"title": "Caps For"},
            "cap_against": {"title": "Caps Against"},
            "cap_offset": {"title": "Cap Offset"},
            "points": {"title": "Points"},
        };

 
     const rows = data.map((r, i) =>{
        
        const player = getPlayer(playerNames, r.player_id);

        return {
            "place": {"value": i+1, "displayValue": `${i + 1}${getOrdinal(i + 1)}`, "className": "ordinal"},
            "player": {
                "value": "", 
                "displayValue": <PlayerLink bNewTab={true} country={player.country} id={player.id}>{player.name}</PlayerLink>,
                "className": "text-left"
            },
            "total_matches": {"value": r.total_matches},
            "wins": {"value": r.wins, "displayValue": ignore0(r.wins)},
            "draws": {"value": r.draws, "displayValue": ignore0(r.draws)},
            "loss": {"value": r.losses, "displayValue": ignore0(r.losses)},
            "cap_for": {"value": r.cap_for, "displayValue": ignore0(r.cap_for)},
            "cap_against": {"value": r.cap_against, "displayValue": ignore0(r.cap_against)},
            "cap_offset": {"value": r.cap_offset, "displayValue": (r.cap_offset > 0) ? `+${r.cap_offset}` : r.cap_offset},
            "points": {"value": r.points, "displayValue": ignore0(r.points)},
        }
    });


    return <>
        <InteractiveTable width={2} headers={headers} rows={rows} bNoHeaderSorting={true}/>
        <div className="view-all center">View All {title} Entries</div>
    </>
}