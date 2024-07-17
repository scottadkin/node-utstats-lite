import Header from "../UI/Header";
import { getPlayersMatchRecords, getDefaultMatchLists } from "../lib/records";
import ErrorBox from "../UI/ErrorBox";
import InteractiveTable from "../UI/InteractiveTable";
import CountryFlag from "../UI/CountryFlag";
import { convertTimestamp, getOrdinal, getPlayer, toPlaytime } from "../lib/generic.mjs";
import Link from "next/link";


function getMatchInfo(matches, matchId){

    return matches[matchId] ?? {
        "serverName": "Not Found",
        "gametypeName": "Not Found",
        "mapName": "Not Found"
    };
}

function renderDefaultMatchLists(data){

    const elems = [];

    const players = data.playerData;
    const matchData = data.matchData;
    
    for(const [type, records] of Object.entries(data.records)){
        
        elems.push(<Header key={type}>{type} Records</Header>);

        const headers = {
            "rank": {"title": "#"},
            "name": {"title": "Player"},
            "date": {"title": "Date"},
            "playtime": {"title": "Playtime"},
            "gametype": {"title": "Gametype"},
            "map": {"title": "Map"},
            "value": {"title": "Value"}
        };

        const rows = [];



        for(let i = 0; i < records.length; i++){

            const r = records[i];

            const player = getPlayer(players, r.player_id);

            const matchInfo = getMatchInfo(matchData, r.match_id);

            rows.push({
                "rank": {"displayValue": `${i+1}${getOrdinal(i+1)}`, "className": "ordinal"},
                "name": {
                    "displayValue": <>
                        <Link href={`/match/${r.match_id}`}><CountryFlag code={player.country}/>{player.name}</Link>
                    </>
                },
                "date": {
                    "displayValue": convertTimestamp(new Date(r.match_date) * 0.001, true),
                    "className": "date"
                },
                "playtime": {
                    "displayValue": toPlaytime(r.time_on_server),
                    "className": "date"
                },
                "gametype": {
                    "displayValue": matchInfo.gametypeName
                },
                "map": {
                    "displayValue": matchInfo.mapName
                },
                "value": {"value": r.record_type}
            });
        }

        elems.push(<InteractiveTable key={type} headers={headers} rows={rows} bNoHeaderSorting={true} width={3}/>);
    }

    return <>
        {elems}
    </>
}

export default async function Records({params, searchParams}){

    try{

        console.log(params, searchParams);
    
        let data = await getDefaultMatchLists();

        console.log(data);

        return <main>
            {renderDefaultMatchLists(data)}
        </main>

    }catch(err){

        return <main>
            <ErrorBox title="Failed to load records">{err.message}</ErrorBox>
        </main>
    }
}