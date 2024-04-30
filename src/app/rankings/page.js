import Header from "../UI/Header";
import SearchForm from "../UI/Rankings/SearchForm";
import { getAllNames } from "../lib/gametypes.mjs";
import { getRankings } from "../lib/rankings.mjs";
import { convertTimestamp, getPlayer, toPlaytime, getOrdinal } from "../lib/generic.mjs";
import { getBasicPlayerInfo } from "../lib/players.mjs";
import PlayerLink from "../UI/PlayerLink";
import Pagination from "../UI/Pagination";

export default async function Page({params, searchParams}){

    const gametypeNames = await getAllNames(true);

    //console.log(gametypeNames);

    let gametypeId = (searchParams.gid !== undefined) ? searchParams.gid : (gametypeNames.length > 0) ? gametypeNames[0].id : 0;


    gametypeId = parseInt(gametypeId);
    if(gametypeId !== gametypeId) gametypeId = 0;

    

    let page = (searchParams.p !== undefined) ? parseInt(searchParams.p) : 1;
    if(page !== page) page = 1;

    let perPage = (searchParams.pp !== undefined) ? parseInt(searchParams.pp) : 25;
    if(perPage !== perPage) perPage = 25;
    if(perPage > 100) perPage = 100;


    let timeFrame = (searchParams.tf !== undefined) ? parseInt(searchParams.tf) : 0;

    if(timeFrame !== timeFrame) timeFrame = 0;

    if(timeFrame > 365) timeFrame = 365;

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

        return <tr key={d.player_id}>
            <td className="ordinal">{place}{getOrdinal(place)}</td>
            <td className="text-left"><PlayerLink id={player.id} country={player.country}>{player.name}</PlayerLink></td>
            <td className="date">{convertTimestamp(Math.floor(new Date(d.last_active)) * 0.001, true)}</td>
            <td className="font-small">{toPlaytime(d.playtime)}</td>
            <td>{d.matches}</td>
            <td>{d.score.toFixed(2)}</td>
        </tr>
    });

    if(rows.length === 0){

        rows.push(<tr>
            <td key="-1" colSpan={6}>No data</td>
        </tr>);
    }

    return <main>
        <Header>Rankings</Header>
        <SearchForm gametypeNames={gametypeNames} gametypeId={gametypeId} timeFrame={timeFrame} perPage={perPage} page={page}/>
        <Header>Top {gametypeName} Players</Header>
        <Pagination url={`/rankings/?gid=${gametypeId}&pp=${perPage}&p=`} results={totalResults} perPage={perPage} currentPage={page}/>
        <table className="t-width-4">
            <tbody>
                <tr>
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
        <Pagination url={`/rankings/?gid=${gametypeId}&pp=${perPage}&p=`} results={totalResults} perPage={perPage} currentPage={page}/>
    </main>
}