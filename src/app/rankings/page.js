import Header from "../UI/Header";
import SearchForm from "../UI/Rankings/SearchForm";
import { getAllNames } from "../lib/gametypes.mjs";
import { getRankings } from "../lib/rankings.mjs";
import { convertTimestamp, getPlayer, toPlaytime } from "../lib/generic.mjs";
import { getBasicPlayerInfo } from "../lib/players.mjs";
import CountryFlag from "../UI/CountryFlag";

export default async function Page({params, searchParams}){

    const gametypeNames = await getAllNames(true);

    //console.log(gametypeNames);

    let gametypeId = (searchParams.gid !== undefined) ? searchParams.gid : (gametypeNames.length > 0) ? gametypeNames[0].id : 0;

    let timeFrame = searchParams?.tf ?? 0;

    gametypeId = parseInt(gametypeId);
    if(gametypeId !== gametypeId) gametypeId = 0;

    timeFrame = parseInt(timeFrame);
    if(timeFrame !== timeFrame) timeFrame = 0;

    if(timeFrame > 365) timeFrame = 365;

    const data = await getRankings(gametypeId);

    const playerIds = data.map((d) =>{
        return d.player_id;
    });

    const players = await getBasicPlayerInfo(playerIds);
    console.log(players);

    console.log(playerIds);
    //console.log(data, gametypeId);

    let gametypeName = "Not Found";

    for(let i = 0; i < gametypeNames.length; i++){

        const g = gametypeNames[i];

        if(g.id === gametypeId){
            gametypeName = g.name;
            break;
        }
    }

    return <main>
        <Header>Rankings</Header>
        <SearchForm gametypeNames={gametypeNames} gametypeId={gametypeId} timeFrame={timeFrame}/>
        <Header>Top {gametypeName} Players</Header>
        <table className="t-width-4">
            <tbody>
                <tr>
                    <th>Player</th>
                    <th>Last Active</th>
                    <th>Playtime</th>
                    <th>Matches</th>
                    <th>Score</th>
                </tr>
                {data.map((d) =>{

                    const player = getPlayer(players, d.player_id);
                    return <tr key={d.player_id}>
                        <td className="text-left"><CountryFlag code={player.country}/>{player.name}</td>
                        <td className="date">{convertTimestamp(Math.floor(new Date(d.last_active)) * 0.001, true)}</td>
                        <td className="font-small">{toPlaytime(d.playtime)}</td>
                        <td>{d.matches}</td>
                        <td>{d.score.toFixed(2)}</td>
                    </tr>
                })}
            </tbody>
        </table>
    </main>
}