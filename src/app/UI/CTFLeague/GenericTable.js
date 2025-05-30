import { getOrdinal, getPlayer, ignore0 } from "@/app/lib/generic.mjs";
import InteractiveTable from "../InteractiveTable";
import PlayerLink from "../PlayerLink";


export default function GenericTable({title, data, playerNames, bDisplayAllButton, page, perPage}){

    if(bDisplayAllButton === undefined) bDisplayAllButton = false;
    if(page === undefined) page = 1;
    if(perPage === undefined) perPage = 25;

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
        
        let player = null;

        if(playerNames !== null){
            player = getPlayer(playerNames, r.player_id);
        }else if(r.playerName !== undefined){
            player = {"id": r.player_id,"name": r.playerName, "country": r.playerCountry};
        }else{
            player = r.player;
        }

        let place = (page - 1) * perPage + i + 1;

        return {
            "place": {"value": i+1, "displayValue": `${place}${getOrdinal(place)}`, "className": "ordinal"},
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
        {(!bDisplayAllButton) ? null : <div className="view-all center">View All {title} Entries</div>}
    </>
}