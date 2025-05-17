import Header from "../Header";
import { convertTimestamp } from "@/app/lib/generic.mjs";

export default function LeagueSettings({settings, mode}){

    let title = "Gametype";

    if(mode === "maps"){
        title = "Map";
    }

    const maxAge = settings["Maximum Match Age In Days"].value;
    const maxMatches = settings["Maximum Match Age In Days"].value;
    const lastRefresh = settings["Last Whole League Refresh"].value;

    return <>
        <Header>{title} CTF League Settings</Header>
        <div className="info">
            <b>Scoring System</b><br/>
            <ul className="text-center">
                <li>3 points if the player is on the winning team.</li>
                <li>1 point if the match ends in a tie.</li>
                <li>0 points for a loss.</li>
            </ul><br/>
            Only matches played in the previous <b>{maxAge} days</b> are counted towards a league.<br/>
            Each player can have a maximum of <b>{maxMatches} matches</b> counted towards a league.<br/> 
            If the player has played more than <b>{maxMatches}</b> matches, only their <b>{maxMatches} most recent matches</b> are counted towards a league.<br/>
            All leagues are refreshed once every 24 hours to remove players and matches outside the specified time frame, and every time a match with the same gametype or map is imported.<br/>
            Last whole {title} League refresh was <b>{convertTimestamp(Math.floor(new Date(lastRefresh) * 0.001))}</b> 
        </div>
    </>
}