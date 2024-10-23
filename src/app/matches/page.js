import {getRecentMatches} from "../lib/matches.mjs";
import { getAllNames as getAllServerNames } from "../lib/servers.mjs";
import { getAllNames as getAllGametypeNames } from "../lib/gametypes.mjs";
import { getAllNames as getAllMapNames } from "../lib/maps.mjs";
import MatchList from "../UI/MatchList";
import MatchesBoxView from "../UI/MatchesBoxView";
import Header from "../UI/Header";
import Pagination from "../UI/Pagination";
import SearchForm from "../UI/Matches/SearchForm";
import { getCategorySettings } from "../lib/siteSettings.mjs";


export async function generateMetadata({ params, searchParams }, parent) {

  const settings = await getCategorySettings("Branding");

  return {
      "title": `Recent Matches - ${settings["Site Name"] || "Node UTStats Lite"}`,
      "description": `Search through all matches palyed on our servers.`
  }
}



export default async function Page({params, searchParams}) {

    const pageSettings = await getCategorySettings("Matches");
    //const setting = await getCategorySettings("Branding");

    const sp = await searchParams;

    const perPage = sp?.pp ?? pageSettings["Results Per Page"] ?? 50;
    const page = sp?.page ?? 1;
    const server = sp?.s ?? 0;
    const gametype = sp?.g ?? 0;
    const map = sp?.m ?? 0;
    const display = sp?.display ?? "0";

    const {data, total} = await getRecentMatches(page, perPage, server, gametype, map);

    const serverNames = await getAllServerNames();
    const gametypeNames = await getAllGametypeNames();
    const mapNames = await getAllMapNames();
    

    const pageURL = `/matches?s=${server}&g=${gametype}&m=${map}&display=${display}&page=`;

    const matchElems = (display === "0") ? <MatchesBoxView data={data}/> : <MatchList data={data} bIgnoreMap={false}/> ;

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
                display={display}
            />
            <Pagination url={pageURL} currentPage={page} results={total} perPage={perPage}/>
            {matchElems}
            <Pagination url={pageURL} currentPage={page} results={total} perPage={perPage}/>
        </div>
      </main>
    );
  }