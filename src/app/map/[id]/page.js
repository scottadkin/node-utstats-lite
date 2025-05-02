import Header from "@/app/UI/Header";
import { getMapImages, getMapInfo, getRecentMatches, getTotalMatches, getMapPlayerAverages, VALID_PLAYER_MAP_MINUTE_AVERAGES } from "@/app/lib/maps.mjs";
import Image from "next/image";
import MatchesList from "@/app/UI/MatchList";
import Pagination from "@/app/UI/Pagination";
import { getCategorySettings } from "@/app/lib/siteSettings.mjs";
import BasicSummary from "@/app/UI/Map/BasicSummary";
import { getPageLayout } from "@/app/lib/pageLayout.mjs";
import TopXPlayers from "@/app/UI/Map/TopXPlayers";
import { getMapWeaponStats } from "@/app/lib/weapons.mjs";
import WeaponStats from "@/app/UI/Map/WeaponStats";
import ActivityHeatMap from "@/app/UI/ActivityHeatMap";
import PlayerRankings from "@/app/UI/Map/PlayerRankings";
import PlayerLeague from "@/app/UI/Map/PlayerLeague";

export async function generateMetadata({ params, searchParams }, parent) {


    const p = await params;

    let id = (p.id !== undefined) ? parseInt(p.id) : 0;
    if(id !== id) id = 0;

    const info = await getMapInfo(id);

    const images = await getMapImages([info.name]);
    const image = images[Object.keys(images)[0]];


	const settings = await getCategorySettings("Branding");

    return {
        "title": `${info.name} - ${settings["Site Name"] || "Node UTStats Lite"}`,
        "description": `View all matches for the map called ${info.name}`,
        "openGraph": {
            "images": [`./images/maps/${image}`]
        }
    }
}

export default async function MapPage({params, searchParams}){

    const p = await params;
    const sp = await searchParams;


    let id = (p.id !== undefined) ? parseInt(p.id) : 0;
    if(id !== id) id = 0;

    let page = (sp.page !== undefined) ? parseInt(sp.page) : 1;
    if(page !== page) page = 1;

    const DEFAULT_PER_PAGE = 25;

    let perPage = (sp.pp !== undefined) ? parseInt(sp.pp) : DEFAULT_PER_PAGE;

    if(perPage !== perPage) perPage = DEFAULT_PER_PAGE;
    if(perPage < 5 || perPage > 100) perPage = DEFAULT_PER_PAGE; 


    const pageSettings = await getCategorySettings("Map");
    const pageLayout = await getPageLayout("Map");


    const info = await getMapInfo(id);

    const images = await getMapImages([info.name]);

    const image = images[Object.keys(images)[0]];

    const recentMatches = await getRecentMatches(id,page,perPage);
    const totalMatches = await getTotalMatches(id);

    const testData = await getMapPlayerAverages(id, "kills", 1, 10);

    const weaponStats = await getMapWeaponStats(id);

    const elems = [];
    
    elems[pageLayout["Basic Summary"]] = (pageSettings["Display Basic Summary"] === "1") ? <BasicSummary key="basic" info={info} /> : null;

    elems[pageLayout["Activity Heatmap"]] = (pageSettings["Display Activity Heatmap"] === "1") ? <ActivityHeatMap key="act" targetId={id} queryMode="get-matches-played-between" apiURL="/api/maps"/> : null;

    elems[pageLayout["Recent Matches"]] = (pageSettings["Display Recent Matches"] === "1") ? <div key="recent">
        <Header>Recent Matches</Header>
        <Pagination currentPage={page} perPage={perPage} url={`/map/${id}/?pp=${perPage}&page=`} results={totalMatches}/>
        <MatchesList data={recentMatches} bIgnoreMap={true}/>
        <Pagination currentPage={page} perPage={perPage} url={`/map/${id}/?pp=${perPage}&page=`} results={totalMatches}/>
    </div> : null;


    elems[pageLayout["Player Top Averages"]] = (pageSettings["Display Player Top Averages"] === "1") ? <TopXPlayers key="top-x" data={testData} mapId={id} category={"kills"} 
        perPage={25} validOptions={VALID_PLAYER_MAP_MINUTE_AVERAGES}/> : null;


    elems[pageLayout["Weapon Statistics"]] = (pageSettings["Display Weapon Statistics"]) ? <WeaponStats key="weapons" data={weaponStats}/> : null ;


    elems[pageLayout["Rankings"]] = (pageSettings["Display Rankings"]) ? <PlayerRankings key="rankings" id={id}/> : null ;

    return <main>
        <Header>{info.name}</Header>
        <PlayerLeague mapId={id}/>
        <div className="map-sshot">
            <Image src={`/images/maps/${image}`} width={1920} height={1080} alt="image"/>
        </div>
        {elems}
        
    </main>
}