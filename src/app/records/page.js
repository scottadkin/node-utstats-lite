import Header from "../UI/Header";
import { getDefaultLifetimeLists, getDefaultMatchLists } from "../lib/records";
import ErrorBox from "../UI/ErrorBox";
import InteractiveTable from "../UI/InteractiveTable";
import CountryFlag from "../UI/CountryFlag";
import { convertTimestamp, getOrdinal, getPlayer, toPlaytime } from "../lib/generic.mjs";
import Link from "next/link";
import TabsLinks from "../UI/TabsLinks";


function getMatchInfo(matches, matchId){

    return matches[matchId] ?? {
        "serverName": "Not Found",
        "gametypeName": "Not Found",
        "mapName": "Not Found"
    };
}

function renderDefaultMatchLists(mode, data){

    const elems = [];

    if(mode !== "match" || data === null) return null;

    const players = data.playerData;
    const matchData = data.matchData;
    
    for(const [type, records] of Object.entries(data.records)){
        
        elems.push(<Header key={type}>{type}</Header>);

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


function renderDefaultLifetimeLists(mode, data){

    if(mode !== "lifetime" || data === null) return null;

    const players = data.playerData;

    const elems = [];
    
    for(const [type, records] of Object.entries(data.records)){
        
        elems.push(<Header key={type}>{type}</Header>);

        const headers = {
            "rank": {"title": "#"},
            "name": {"title": "Player"},
            "date": {"title": "Last Active"},
            "playtime": {"title": "Playtime"},
            "value": {"title": "Value"}
        };

        const rows = [];

        for(let i = 0; i < records.length; i++){

            const r = records[i];

            const player = getPlayer(players, r.player_id);

            rows.push({
                "rank": {"displayValue": `${i+1}${getOrdinal(i+1)}`, "className": "ordinal"},
                "name": {
                    "displayValue": <>
                        <Link href={`/player/${r.player_id}`}><CountryFlag code={player.country}/>{player.name}</Link>
                    </>
                },
                "date": {
                    "displayValue": convertTimestamp(new Date(r.last_active) * 0.001, true),
                    "className": "date"
                },
                "playtime": {
                    "displayValue": toPlaytime(r.playtime),
                    "className": "date"
                },
                "value": {"value": r.record_value}
            });
        }

        elems.push(<InteractiveTable key={type} headers={headers} rows={rows} bNoHeaderSorting={true} width={3}/>);
    }

    return <>
        {elems}
    </>
}

function renderSelect(mode, cat){
    
    //create as a component instead of having it in this file and mark use client

    const match = [
        {"display": "Score", "value": "score"},
        {"display": "Frags", "value": "frags"},
        {"display": "Kills", "value": "kills"},
        {"display": "Deaths", "value": "deaths"},
        {"display": "Suicides", "value": "suicides"},
        {"display": "Team Kills", "value": "team_kills"},
        {"display": "Playtime", "value": "time_on_server"},
        {"display": "TTL", "value": "ttl"},
        {"display": "Best Spree", "value": "spree_best"},
        {"display": "Best Multi Kill", "value": "multi_best"},
        {"display": "Headshots", "value": "headshots"},
    ];

    const lifetime = [];

    const options = (mode === "match") ? match : lifetime;

    

    return <div className="form">
        <div className="form-row">
            <label>Record Type</label>
            <select className="select" value={cat}>
                <option value="" key="-1">-</option>
                {options.map((o, i) =>{
                    return <option key={i} value={o.value}>{o.display}</option>
                })}
            </select>
        </div>
    </div>;
}

export default async function Records({params, searchParams}){

    try{

        console.log(params, searchParams);

        let mode = (searchParams.mode !== undefined) ? searchParams.mode : "match";
        let cat = (searchParams.cat !== undefined) ? searchParams.cat : "";
    
        let data = null;


        if(mode === "match" && cat === ""){

            data = await getDefaultMatchLists();

        }else if(mode === "lifetime" && cat === ""){
            
            data = await getDefaultLifetimeLists();
        }

        const tabs = [
            {"value": "match", "display": "Single Match"},
            {"value": "lifetime", "display": "Lifetime"},
        ];

        return <main>
            <Header>Records</Header>
            {renderSelect(mode, cat)}
            <TabsLinks options={tabs} selectedValue={mode} url="/records/?mode="/>
            {renderDefaultMatchLists(mode, data)}
            {renderDefaultLifetimeLists(mode, data)}
        </main>

    }catch(err){

        return <main>
            <ErrorBox title="Failed to load records">{err.message}</ErrorBox>
        </main>
    }
}