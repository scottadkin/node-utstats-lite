import Header from "../UI/Header";
import SearchForm from "../UI/Rankings/SearchForm";
import { getAllNames, getLastPlayedGametype } from "../lib/gametypes.mjs";
import { getRankings } from "../lib/rankings.mjs";
import { convertTimestamp, getPlayer, toPlaytime, getOrdinal, plural } from "../lib/generic.mjs";
import { getBasicPlayerInfo } from "../lib/players.mjs";
import PlayerLink from "../UI/PlayerLink";
import Pagination from "../UI/Pagination";
import { getCategorySettings } from "../lib/siteSettings.mjs";


function setGametypeId(searchParams, gametypeNames){

    let firstGametypeId = 0;

    if(gametypeNames.length > 0) firstGametypeId = gametypeNames[0].id;

    let gametypeId = (searchParams.gid !== undefined) ? parseInt(searchParams.gid) : firstGametypeId;

    if(gametypeId !== gametypeId) gametypeId = firstGametypeId;

    return gametypeId;
}

function setGametypeName(gametypeNames, targetId){

    targetId = parseInt(targetId);

    for(let i = 0; i < gametypeNames.length; i++){

        const g = gametypeNames[i];
        if(g.id === targetId) return g.name;
    }

    return "Not Found";
}

function setTimeFrame(searchParams){

    let timeFrame = (searchParams.tf !== undefined) ? parseInt(searchParams.tf) : 28;

    if(timeFrame !== timeFrame) timeFrame = 0;

    if(timeFrame > 365) timeFrame = 365;

    return timeFrame;
}

export async function generateMetadata({ params, searchParams }, parent) {

    const gametypeNames = await getAllNames(true);

    const sp = await searchParams;

    let gametypeId = setGametypeId(sp, gametypeNames);

    if(sp.gid === undefined){

        const lastPlayedId = await getLastPlayedGametype();

        if(lastPlayedId !== null){
            gametypeId = lastPlayedId;
        }

    }

    const gametypeName = setGametypeName(gametypeNames, gametypeId);
    const timeFrame = setTimeFrame(sp);

    let timeFrameString = `, all time rankings.`;
    if(timeFrame > 0){
        timeFrameString = `, active players in the last ${timeFrame} ${plural(timeFrame, "day")}`;
    }

    const settings = await getCategorySettings("Branding");

    return {
        "title": `${gametypeName} Rankings - ${settings["Site Name"] || "Node UTStats Lite"}`,
        "description": `View the top ranking players for the gametype ${gametypeName}${timeFrameString}`
    }
}

export default async function Page({params, searchParams}){

    const sp = await searchParams;
    const gametypeNames = await getAllNames(true);

    let gametypeId = setGametypeId(sp, gametypeNames);

    if(sp.gid === undefined){

        const lastPlayedId = await getLastPlayedGametype();

        if(lastPlayedId !== null){
            gametypeId = lastPlayedId;
        }

    }

    let page = (sp.p !== undefined) ? parseInt(sp.p) : 1;
    if(page !== page) page = 1;

    let perPage = (sp.pp !== undefined) ? parseInt(sp.pp) : 25;
    if(perPage !== perPage) perPage = 25;
    if(perPage > 100) perPage = 100;

    let tf = (sp.tf !== undefined) ? parseInt(sp.tf) : 28;
    if(tf !== tf) tf = 28; 


    const timeFrame = setTimeFrame(sp);

    const {data, totalResults} = await getRankings(gametypeId, page, perPage, timeFrame);

    const playerIds = data.map((d) =>{
        return d.player_id;
    });

    const players = await getBasicPlayerInfo(playerIds);

    //console.log(data, gametypeId);

    let gametypeName = "Not Found";

    for(let i = 0; i < gametypeNames.length; i++){

        const g = gametypeNames[i];

        if(g.id === gametypeId){
            gametypeName = g.name;
            break;
        }
    }

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

    return <main>
        <Header>Rankings</Header>
        <SearchForm gametypeNames={gametypeNames} gametypeId={gametypeId} timeFrame={timeFrame} perPage={perPage} page={page}/>
        <Header>Top {gametypeName} Players</Header>
        <Pagination url={`/rankings/?gid=${gametypeId}&tf=${tf}&pp=${perPage}&p=`} results={totalResults} perPage={perPage} currentPage={page}/>
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
        <Pagination url={`/rankings/?gid=${gametypeId}&tf=${tf}&pp=${perPage}&p=`} results={totalResults} perPage={perPage} currentPage={page}/>
    </main>
}