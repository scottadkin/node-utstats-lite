import Header from "@/app/UI/Header";
import { getMapImages, getMapInfo, getRecentMatches, getTotalMatches } from "@/app/lib/maps.mjs";
import Image from "next/image";
import MatchesList from "@/app/UI/MatchList";
import Pagination from "@/app/UI/Pagination";
import { getCategorySettings } from "@/app/lib/siteSettings.mjs";
import BasicSummary from "@/app/UI/Map/BasicSummary";
import { getPageLayout } from "@/app/lib/pageLayout.mjs";

export async function generateMetadata({ params, searchParams }, parent) {

    let id = (params.id !== undefined) ? parseInt(params.id) : 0;
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

    let id = (params.id !== undefined) ? parseInt(params.id) : 0;
    if(id !== id) id = 0;

    let page = (searchParams.page !== undefined) ? parseInt(searchParams.page) : 1;
    if(page !== page) page = 1;

    const DEFAULT_PER_PAGE = 25;

    let perPage = (searchParams.pp !== undefined) ? parseInt(searchParams.pp) : DEFAULT_PER_PAGE;

    if(perPage !== perPage) perPage = DEFAULT_PER_PAGE;
    if(perPage < 5 || perPage > 100) perPage = DEFAULT_PER_PAGE; 


    const pageSettings = await getCategorySettings("Map");
    const pageLayout = await getPageLayout("Map");


    const info = await getMapInfo(id);

    const images = await getMapImages([info.name]);

    const image = images[Object.keys(images)[0]];

    const recentMatches = await getRecentMatches(id,page,perPage);
    const totalMatches = await getTotalMatches(id);

    //const matchIds = await getAllMatchIds(id);

    //console.log(matchIds);

   // const query = `SELECT nstats_matches.id,nstats_matches.map_id, nstats_match_players.* 
    //FROM nstats_matches LEFT JOIN nstats_match_players ON nstats_matches.id=nstats_match_players.match_id ORDER BY kills DESC LIMIT 10`;


    const elems = [];
    
    elems[pageLayout["Basic Summary"]] = (pageSettings["Display Basic Summary"] === "1") ? <BasicSummary key="basic" info={info} /> : null;

    elems[pageLayout["Recent Matches"]] = (pageSettings["Display Recent Matches"] === "1") ? <div key="recent">
        <Header>Recent Matches</Header>
        <Pagination currentPage={page} perPage={perPage} url={`/map/${id}/?pp=${perPage}&page=`} results={totalMatches}/>
        <MatchesList data={recentMatches} bIgnoreMap={true}/>
        <Pagination currentPage={page} perPage={perPage} url={`/map/${id}/?pp=${perPage}&page=`} results={totalMatches}/>
    </div> : null;

    return <main>
        <Header>{info.name}</Header>
        <div className="map-sshot">
            <Image src={`/images/maps/${image}`} width={1920} height={1080} alt="image"/>
        </div>
        {elems}
        
    </main>
}