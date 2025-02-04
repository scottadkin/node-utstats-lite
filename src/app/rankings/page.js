import Header from "../UI/Header";
import SearchForm from "../UI/Rankings/SearchForm";
import { getAllNames as getAllGametypeNames, getGametypeNames, getLastPlayedGametype } from "../lib/gametypes.mjs";
import { getAllNames as getAllMapNames, getLastPlayedMapId } from "../lib/maps.mjs";
import { getRankings } from "../lib/rankings.mjs";
import { convertTimestamp, getPlayer, toPlaytime, getOrdinal, plural } from "../lib/generic.mjs";
import { getBasicPlayerInfo } from "../lib/players.mjs";
import PlayerLink from "../UI/PlayerLink";
import Pagination from "../UI/Pagination";
import { getCategorySettings } from "../lib/siteSettings.mjs";
import TabsLinks from "../UI/TabsLinks";


const DEFAULT_PER_PAGE = 25;

function setTargetId(searchParams, typeNames, paramKey){

    if(typeNames.length === 0) return 0;

    let firstId = 0;

    if(typeNames.length > 0) firstId = typeNames[0].id;

    let id = (searchParams[paramKey] !== undefined) ? parseInt(searchParams[paramKey]) : firstId;

    if(id !== id) id = firstId;

    return id;
}

function setTargetName(names, targetId){

    targetId = parseInt(targetId);

    for(let i = 0; i < names.length; i++){

        const g = names[i];
        if(g.id === targetId) return g.name;
    }

    if(names.length === 0) return "";

    return "Not Found";
}

function setTimeFrame(searchParams){

    let timeFrame = (searchParams.tf !== undefined) ? parseInt(searchParams.tf) : 28;

    if(timeFrame !== timeFrame) timeFrame = 0;

    if(timeFrame > 365) timeFrame = 365;

    return timeFrame;
}

/**
 * get last played id if no id chosen by user
 * @param {*} sp 
 * @param {*} names 
 * @param {*} mode 
 * @param {*} targetKey 
 * @returns 
 */
async function getTargetId(sp, names, mode, targetKey){

    let targetId = setTargetId(sp, names, targetKey);

    if(mode === "gametype"){

        if(sp.gid === undefined){

            const lastPlayedId = await getLastPlayedGametype();

            if(lastPlayedId !== null){
                targetId = lastPlayedId;
            }
        }
    }else{

        if(sp.mid === undefined){

            const lastPlayedId = await getLastPlayedMapId();

            if(lastPlayedId !== null){
                targetId = lastPlayedId;
            }
        }
    }

    return targetId;
}

export async function generateMetadata({ params, searchParams }, parent) {

    const sp = await searchParams;

    let mode = sp.mode ?? "gametype";
    let targetKey = "gid";

    if(mode !== "gametype" && mode !== "map") mode = "gametype";

    if(mode === "map") targetKey = "mid";

    let names = [];

    if(mode === "gametype"){
        names = await getAllGametypeNames(true);
    }else{
        targetKey = "mid";
        names = await getAllMapNames(true);
    }

    const targetId = await getTargetId(sp, names, mode, targetKey);

    const targetName = setTargetName(names, targetId);
    const timeFrame = setTimeFrame(sp);

    let timeFrameString = `, all time rankings.`;
    if(timeFrame > 0){
        timeFrameString = `, active players in the last ${timeFrame} ${plural(timeFrame, "day")}`;
    }

    const settings = await getCategorySettings("Branding");

    return {
        "title": `${targetName} Rankings - ${settings["Site Name"] || "Node UTStats Lite"}`,
        "description": `View the top ranking players for the ${(mode === "gametype") ? "gametype" : "map"} ${targetName}${timeFrameString}`
    }
}

export default async function Page({params, searchParams}){

    const sp = await searchParams;
    
    let mode = sp.mode ?? "gametype";
    let targetKey = "gid";

    if(mode !== "gametype" && mode !== "map") mode = "gametype";

    if(mode === "map") targetKey = "mid";

    let names = [];

    if(mode === "gametype"){
        names = await getAllGametypeNames(true);
    }else{
        targetKey = "mid";
        names = await getAllMapNames(true);
    }

    const targetId = await getTargetId(sp, names, mode, targetKey);

    let page = (sp.p !== undefined) ? parseInt(sp.p) : 1;
    if(page !== page) page = 1;

    let perPage = (sp.pp !== undefined) ? parseInt(sp.pp) : DEFAULT_PER_PAGE;
    if(perPage !== perPage) perPage = DEFAULT_PER_PAGE;
    if(perPage > 100) perPage = 100;

    let tf = (sp.tf !== undefined) ? parseInt(sp.tf) : 28;
    if(tf !== tf) tf = 28; 


    const timeFrame = setTimeFrame(sp);

    const {data, totalResults} = await getRankings(targetId, page, perPage, timeFrame, mode);

    const playerIds = data.map((d) =>{
        return d.player_id;
    });

    const players = await getBasicPlayerInfo(playerIds);

    const rows = data.map((d, i) =>{

        const player = getPlayer(players, d.player_id);

        const place = perPage * (page - 1) + i + 1;

        return <tr key={i}>
            <td className="ordinal">{place}{getOrdinal(place)}</td>
            <td className="text-left"><PlayerLink id={player.id} country={player.country}>{player.name}</PlayerLink></td>
            <td className="date">{convertTimestamp(Math.floor(new Date(d.last_active)) * 0.001, true)}</td>
            <td className="font-small">{toPlaytime(d.playtime)}</td>
            <td>{d.matches}</td>
            <td>{d.score.toFixed(2)}</td>
        </tr>
    });

    if(rows.length === 0){

        rows.push(<tr key="-1">
            <td key="-1" colSpan={6}>No data</td>
        </tr>);
    }

    const tabOptions = [
        {"value": "gametype", "display": "Gametypes"},
        {"value": "map", "display": "Maps"},
    ];

    return <main>
        <Header>{(mode === "gametype") ? "Gametype" : "Map"} Rankings</Header>
        <TabsLinks selectedValue={mode} url={"/rankings?mode="} options={tabOptions}/>
        <SearchForm targetNames={names} targetId={targetId} timeFrame={timeFrame} perPage={perPage} page={page} mode={mode} targetKey={targetKey}/>
        <Header>Top {setTargetName(names, targetId)} Players</Header>
        <Pagination url={`/rankings/?mode=${mode}&${targetKey}=${targetId}&tf=${tf}&pp=${perPage}&p=`} results={totalResults} perPage={perPage} currentPage={page}/>
        <table className="t-width-3">
            <tbody>
                <tr key={-2}>
                    <th>Place</th>
                    <th>Player</th>
                    <th>Last Active</th>
                    <th>Playtime</th>
                    <th>Matches</th>
                    <th>Score</th>
                </tr>
                {rows}
            </tbody>
        </table>
        <Pagination url={`/rankings/?mode=${mode}&${targetKey}=${targetId}&tf=${tf}&pp=${perPage}&p=`} results={totalResults} perPage={perPage} currentPage={page}/>
    </main>
}