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
import { getTypeDisplayName} from "@/app/lib/validRecordTypes";
import Pagination from "../UI/Pagination";
import { getCategorySettings } from "../lib/siteSettings.mjs";
import { getAllNames } from "../lib/gametypes.mjs";


export async function generateMetadata(props) {


    const searchParams = await props.searchParams;

    const sp = searchParams;


    const mode = (sp.mode !== undefined) ? sp.mode.toLowerCase() : "match"; 
    let cat = (sp.cat !== undefined) ? sp.cat.toLowerCase() : "kills";

    if(cat === "") cat = "kills";

    let gametype = sp?.g ?? "-1";

    gametype = parseInt(gametype);
    if(gametype !== gametype) gametype = -1;
    
    const catDisplayName = getTypeDisplayName(mode, cat);

    const singleMatchTotals = await getTotalMatchRecords(gametype);
    const lifetimeTotals = await getTotalLifetimeRecords(gametype);

    const gametypeNames = await getAllNames(false);
    gametypeNames[-1] = "";
    gametypeNames[0] = "";

    let gametypeName = gametypeNames[gametype] ?? "Not Found";

    if(gametypeName !== ""){
        gametypeName = `(${gametypeName})`;
    }
    
    const settings = await getCategorySettings("Branding");

    const title = (catDisplayName !== null) ? `${catDisplayName} Records ${gametypeName} - ${(mode === "match") ? "Single Match" : "Lifetime"}` : "Invalid Record Type";

    
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


function RenderSelect(mode, cat, gametypeNames, selectedGametype){

    
    return <>
        <DropDown mode={mode} cat={cat} gametypeNames={gametypeNames} selectedGametype={selectedGametype}/>    
    </>
}


function renderSingleMatchList(mode, cat, gametype, data, totalResults, page, perPage){

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
                </>,
                "className": "player-name-td"
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
        <Pagination url={`/records?mode=${mode}&cat=${cat}&g=${gametype}&perPage=${perPage}&page=`} currentPage={page} perPage={perPage} results={totalResults}/>
    </>
}

function renderSingleLifetimeList(mode, cat, gametype, data, totalResults, page, perPage){
    

    if(mode !== "lifetime") return null;

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
                </>,      
                "className": "player-name-td"
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
        <Pagination url={`/records?mode=${mode}&cat=${cat}&g=${gametype}&perPage=${perPage}&page=`} currentPage={page} perPage={perPage} results={totalResults}/>
    </>
}

async function testFart(props){

    //const searchParams = await props.searchParams;

    return {}//searchParams;
}

export default async function Page(props){

    const searchParams = await props.searchParams;

    try{

        //const searchParams = await testFart(props)// await props.searchParams;

        const sp = searchParams;

        let page = (sp.page !== undefined) ? parseInt(sp.page) : 1;
        let perPage = (sp.perPage !== undefined) ? parseInt(sp.perPage) : 25;

        if(page !== page) page = 1;
        if(page < 1) page = 1;

        if(perPage !== perPage) perPage = 25;
        if(perPage < 5 || perPage > 100) perPage = 25;

        let mode = (sp.mode !== undefined) ? sp.mode : "match";
        let cat = (sp.cat !== undefined) ? sp.cat : "kills";
        let gametype = sp?.g ?? "-1";

        gametype = parseInt(gametype);
        if(gametype !== gametype) gametype = -1;
    
        if(cat === "") cat = "kills";

        const gametypeNames = await getAllNames(true);

        let data = null;

        let totalResults = 0;


        if(mode === "match"){
            totalResults = await getTotalMatchRecords(gametype);
        }else{
            totalResults = await getTotalLifetimeRecords(gametype);
        }

        if(mode === "match"){

            data = await getPlayersMatchRecords(cat, gametype, page, perPage, false);

        }else if(mode === "lifetime"){
            
            
            data = await getPlayersLifetimeRecords(cat, gametype, page, perPage, false);
        }

        const tabs = [
            {"value": "match", "display": "Single Match"},
            {"value": "lifetime", "display": "Lifetime"},
        ];

        return <main>
            <Header>Records</Header>
            <DropDown mode={mode} cat={cat} gametypeNames={gametypeNames} selectedGametype={gametype}/>   
            <TabsLinks options={tabs} selectedValue={mode} url={`/records/?mode=`}/>
            {renderSingleMatchList(mode, cat, gametype, data, totalResults, page, perPage)}
            {renderSingleLifetimeList(mode, cat, gametype, data, totalResults, page, perPage)}
        </main>

    }catch(err){

        console.trace(err);

        return <main>
            <ErrorBox title="Failed to load records">{err.message}</ErrorBox>
        </main>
    }
}