import {getRecentMatches} from "../lib/matches.mjs";
import { getAllNames as getAllServerNames } from "../lib/servers.mjs";
import { getAllNames as getAllGametypeNames } from "../lib/gametypes.mjs";
import { getAllNames as getAllMapNames } from "../lib/maps.mjs";
import MatchList from "../UI/MatchList";
import Header from "../UI/Header";
import Pagination from "../UI/Pagination";
import SearchForm from "../UI/Matches/SearchForm";
import { getCategorySettings } from "../lib/siteSettings.mjs";



export default async function Page({params, searchParams}) {

    const pageSettings = await getCategorySettings("Matches");

    const perPage = searchParams?.pp ?? pageSettings["Results Per Page"] ?? 50;
    const page = searchParams?.page ?? 1;
    const server = searchParams?.s ?? 0;
    const gametype = searchParams?.g ?? 0;
    const map = searchParams?.m ?? 0;


    const {data, total} = await getRecentMatches(page, perPage, server, gametype, map);

    const serverNames = await getAllServerNames();
    const gametypeNames = await getAllGametypeNames();
    const mapNames = await getAllMapNames();
    

  
    return (
      <main className={"styles.main"}>
        <div>
            <Header>Recent Matches</Header>
            <SearchForm 
              serverNames={serverNames} 
              gametypeNames={gametypeNames}
              mapNames={mapNames}
              server={server}
              gametype={gametype}
              map={map}
            />
            <Pagination url="/matches?page=" currentPage={page} results={total} perPage={perPage}/>
            <MatchList data={data} />
            <Pagination url="/matches?page=" currentPage={page} results={total} perPage={perPage}/>
        </div>
      </main>
    );
  }