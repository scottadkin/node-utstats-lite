import Header from "../UI/Header";
import { getDefaultLifetimeLists, getDefaultMatchLists, getPlayersMatchRecords } from "../lib/records";
import ErrorBox from "../UI/ErrorBox";
import InteractiveTable from "../UI/InteractiveTable";
import CountryFlag from "../UI/CountryFlag";
import { convertTimestamp, getOrdinal, getPlayer, toPlaytime } from "../lib/generic.mjs";
import Link from "next/link";
import TabsLinks from "../UI/TabsLinks";
import DropDown from "../UI/Records/DropDown";
import {VALID_PLAYER_MATCH_TYPES, VALID_PLAYER_LIFETIME_TYPES} from "@/app/lib/validRecordTypes";


function getMatchInfo(matches, matchId){

    return matches[matchId] ?? {
        "serverName": "Not Found",
        "gametypeName": "Not Found",
        "mapName": "Not Found"
    };
}

function getRecordTitle(types, target){

    for(let i = 0; i < types.length; i++){

        const t = types[i];

        if(t.value === target) return t.display;
    }

    return "Not Found";
}

function renderDefaultMatchLists(mode, cat, data){

    const elems = [];

    if(mode !== "match" || data === null || cat !== "") return null;

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


function renderDefaultLifetimeLists(mode, cat, data){

    if(mode !== "lifetime" || data === null || cat !== "") return null;

    const players = data.playerData;

    const elems = [];

    const title = getRecordTitle(VALID_PLAYER_LIFETIME_TYPES, cat);
    
    for(const [type, records] of Object.entries(data.records)){
        
        elems.push(<Header key={cat}>{title}</Header>);

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

        elems.push(<InteractiveTable key={cat} headers={headers} rows={rows} bNoHeaderSorting={true} width={3}/>);
    }

    return <>
        {elems}
    </>
}

function renderSelect(mode, cat){
    
    return <DropDown mode={mode} cat={cat}/>
}


function renderSingleMatchList(mode, cat, data){

    if(mode !== "match" || data === null || cat === "") return null;

    //console.log(data);

    const players = data.playerData;
    const records = data.records;


   // console.log(Object.keys(data));

    const elems = [];

    const title = getRecordTitle(VALID_PLAYER_MATCH_TYPES, cat);

    elems.push(<Header key={cat}>{title}</Header>);

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

       // console.log(r);

        const player = getPlayer(players, r.player_id);
        const matchInfo = getMatchInfo(data.matchData, r.match_id);

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

    elems.push(<InteractiveTable key={cat} headers={headers} rows={rows} bNoHeaderSorting={true} width={3}/>)

    return <>
        {elems}
    </>
}

export default async function Records({params, searchParams}){

    try{


        let page = 1;
        let perPage = 25;

        console.log(params, searchParams);

        let mode = (searchParams.mode !== undefined) ? searchParams.mode : "match";
        let cat = (searchParams.cat !== undefined) ? searchParams.cat : "";
    
        let data = null;


        if(mode === "match" && cat === ""){

            data = await getDefaultMatchLists();

        }else if(mode === "lifetime" && cat === ""){
            
            data = await getDefaultLifetimeLists();

        }else if(mode === "match"){
            data = await getPlayersMatchRecords(cat, page, perPage, false);
        }

        const tabs = [
            {"value": "match", "display": "Single Match"},
            {"value": "lifetime", "display": "Lifetime"},
        ];

        return <main>
            <Header>Records</Header>
            {renderSelect(mode, cat)}
            <TabsLinks options={tabs} selectedValue={mode} url={`/records/?mode=`}/>
            {renderDefaultMatchLists(mode, cat, data)}
            {renderDefaultLifetimeLists(mode, cat, data)}
            {renderSingleMatchList(mode, cat, data)}
        </main>

    }catch(err){

        return <main>
            <ErrorBox title="Failed to load records">{err.message}</ErrorBox>
        </main>
    }
}