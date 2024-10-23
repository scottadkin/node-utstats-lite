import Header from "../UI/Header";
import { getPlayersLifetimeRecords, 
    getPlayersMatchRecords, getTotalMatchRecords, getTotalLifetimeRecords } from "../lib/records";
import ErrorBox from "../UI/ErrorBox";
import InteractiveTable from "../UI/InteractiveTable";
import CountryFlag from "../UI/CountryFlag";
import { convertTimestamp, getOrdinal, getPlayer, toPlaytime } from "../lib/generic.mjs";
import Link from "next/link";
import TabsLinks from "../UI/TabsLinks";
import DropDown from "../UI/Records/DropDown";
import {VALID_PLAYER_MATCH_TYPES, VALID_PLAYER_LIFETIME_TYPES, getTypeDisplayName} from "@/app/lib/validRecordTypes";
import Pagination from "../UI/Pagination";
import { getCategorySettings } from "../lib/siteSettings.mjs";


export async function generateMetadata({ params, searchParams }, parent) {


    const sp = await searchParams;

    const mode = (sp.mode !== undefined) ? sp.mode.toLowerCase() : "match"; 
    let cat = (sp.cat !== undefined) ? sp.cat.toLowerCase() : "kills";

    if(cat === "") cat = "kills";
    
    const catDisplayName = getTypeDisplayName(mode, cat);

    const singleMatchTotals = await getTotalMatchRecords();
    const lifetimeTotals = await getTotalLifetimeRecords();
    

    const settings = await getCategorySettings("Branding");

    const title = (catDisplayName !== null) ? `${catDisplayName} Records - ${(mode === "match") ? "Single Match" : "Lifetime"}` : "Invalid Record Type";

    
    return {
        "title": `${title} - ${settings["Site Name"] || "Node UTStats Lite"}`,
        "description": `View player records for different match and lifetime events, there are a total of ${singleMatchTotals} data entries for each single match event, and ${lifetimeTotals} data entries for player lifetime totals.`,
        "openGraph": {},
    }
}

function getMatchInfo(matches, matchId){

    return matches[matchId] ?? {
        "serverName": "Not Found",
        "gametypeName": "Not Found",
        "mapName": "Not Found"
    };
}


function renderSelect(mode, cat){
    
    return <DropDown mode={mode} cat={cat}/>
}


function renderSingleMatchList(mode, cat, data, totalResults, page, perPage){

    if(mode !== "match" || data === null || cat === "") return null;

    const players = data.playerData;
    const records = data.records;

    const elems = [];

    const title = getTypeDisplayName(mode, cat);

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

        let value = r.record_type;
        let displayValue = r.record_type;

        const place = i + perPage * (page - 1) + 1;

        rows.push({
            "rank": {"displayValue": `${place}${getOrdinal(place)}`, "className": "ordinal"},
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
                "displayValue": <Link href={`matches?s=0&g=0&m=${matchInfo.map_id}`}>{matchInfo.mapName}</Link>
            },
            "value": {"value": value, "displayValue": <Link href={`/match/${matchInfo.id}`}>{displayValue}</Link>}
        });
    }

    elems.push(<InteractiveTable key={`table_${cat}`} headers={headers} rows={rows} bNoHeaderSorting={true} width={3}/>)

    return <>
        {elems}
        <Pagination url={`/records?mode=${mode}&cat=${cat}&perPage=${perPage}&page=`} currentPage={page} perPage={perPage} results={totalResults}/>
    </>
}

function renderSingleLifetimeList(mode, cat, data, totalResults, page, perPage){
    

    if(mode !== "lifetime" || data === null || cat === "") return null;

    const players = data.playerData;
    const records = data.records;

    const elems = [];

    const title = getTypeDisplayName(mode, cat);
    
    
    elems.push(<Header key={`header-${cat}`}>{title}</Header>);

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

        const place = i + perPage * (page - 1) + 1;

        rows.push({
            "rank": {"displayValue": `${place}${getOrdinal(place)}`, "className": "ordinal"},
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


    return <>
        {elems}
        <Pagination url={`/records?mode=${mode}&cat=${cat}&perPage=${perPage}&page=`} currentPage={page} perPage={perPage} results={totalResults}/>
    </>
}

export default async function Records({params, searchParams}){

    try{

        const sp = await searchParams;
        
        let page = (sp.page !== undefined) ? parseInt(sp.page) : 1;
        let perPage = (sp.perPage !== undefined) ? parseInt(sp.perPage) : 25;

        if(page !== page) page = 1;
        if(page < 1) page = 1;

        if(perPage !== perPage) perPage = 25;
        if(perPage < 5 || perPage > 100) perPage = 25;

        let mode = (sp.mode !== undefined) ? sp.mode : "match";
        let cat = (sp.cat !== undefined) ? sp.cat : "kills";
    
        if(cat === "") cat = "kills";

        let data = null;

        let totalResults = 0;

        if(mode === "match"){
            totalResults = await getTotalMatchRecords();
        }else{
            totalResults = await getTotalLifetimeRecords();
        }

        console.log(`totalRecords = ${totalResults}`);

        if(mode === "match"){

            data = await getPlayersMatchRecords(cat, page, perPage, false);

        }else if(mode === "lifetime"){
            
            data = await getPlayersLifetimeRecords(cat, 0, page, perPage, false);
        }

        const tabs = [
            {"value": "match", "display": "Single Match"},
            {"value": "lifetime", "display": "Lifetime"},
        ];

        return <main>
            <Header>Records</Header>
            {renderSelect(mode, cat)}
            <TabsLinks options={tabs} selectedValue={mode} url={`/records/?mode=`}/>
            {renderSingleMatchList(mode, cat, data, totalResults, page, perPage)}
            {renderSingleLifetimeList(mode, cat, data, totalResults, page, perPage)}
        </main>

    }catch(err){

        return <main>
            <ErrorBox title="Failed to load records">{err.message}</ErrorBox>
        </main>
    }
}