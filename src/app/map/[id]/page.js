import Header from "@/app/UI/Header";
import { getMapImages, getMapInfo, getRecentMatches, getTotalMatches, getAllMatchIds } from "@/app/lib/maps.mjs";
import Image from "next/image";
import MatchesList from "@/app/UI/MatchList";
import Pagination from "@/app/UI/Pagination";
import { simpleQuery } from "@/app/lib/database.mjs";

export async function generateMetadata({ params, searchParams }, parent) {

    let id = (params.id !== undefined) ? parseInt(params.id) : 0;
    if(id !== id) id = 0;

    const info = await getMapInfo(id);


    return {
        "title": `${info.name} - Node UTStats Lite`,
        "description": `View all matches for the map called ${info.name}`
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


    const info = await getMapInfo(id);

    const images = await getMapImages([info.name]);

    const image = images[Object.keys(images)[0]];

    const recentMatches = await getRecentMatches(id,page,perPage);
    const totalMatches = await getTotalMatches(id);

    //const matchIds = await getAllMatchIds(id);

    //console.log(matchIds);

   // const query = `SELECT nstats_matches.id,nstats_matches.map_id, nstats_match_players.* 
    //FROM nstats_matches LEFT JOIN nstats_match_players ON nstats_matches.id=nstats_match_players.match_id ORDER BY kills DESC LIMIT 10`;

    //console.log(await simpleQuery(query));

    return <main>
        <Header>{info.name}</Header>
        <div className="map-sshot">
            <Image src={`/images/maps/${image}`} width={1920} height={1080} alt="image"/>
        </div>
        <Header>Recent Matches</Header>
        <Pagination currentPage={page} perPage={perPage} url={`/map/${id}/?pp=${perPage}&page=`} results={totalMatches}/>
        <MatchesList data={recentMatches} bIgnoreMap={true}/>
        <Pagination currentPage={page} perPage={perPage} url={`/map/${id}/?pp=${perPage}&page=`} results={totalMatches}/>
    </main>
}