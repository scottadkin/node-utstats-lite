"use server"
import { searchPlayers } from "../lib/players.mjs";
import Header from "../UI/Header";
import CountryFlag from "../UI/CountryFlag";
import { convertTimestamp, ignore0, toPlaytime } from "../lib/generic.mjs";
import SearchForm from "../UI/Players/SearchForm";
import Link from "next/link";
import ErrorBox from "../UI/ErrorBox"; 
import Pagination from "../UI/Pagination";
import { getCategorySettings } from "../lib/siteSettings.mjs";


export async function generateMetadata({ params, searchParams }, parent) {

    const settings = await getCategorySettings("Branding");

    return {
        "title": `Player Search - ${settings["Site Name"] || "Node UTStats Lite"}`,
        "description": `Search for a player that has played on our servers.`

    }
  }


function createHeaderURL(targetSortBy, currentSortBy, order){

    if(targetSortBy === currentSortBy){

        if(order === "ASC"){
            order = "DESC";
        }else{
            order = "ASC";
        }
    }

    return `/players/?sortBy=${targetSortBy}&order=${order}`;
}

export default async function Page({params, searchParams}) {
    

    let sortBy = "name";
    let order = "ASC";
    let error = null;
    let name = "";
    let page = 1;

    const sp = await searchParams;

    
    if(sp.page !== undefined){
        page = parseInt(sp.page);
        if(page !== page) page = 1;
        if(page < 1) page = 1;
    }

    if(sp.sortBy !== undefined){
        sortBy = sp.sortBy;
    }

    if(sp.order !== undefined){

        order = sp.order.toUpperCase();

        if(order !== "ASC" && order !== "DESC"){
            order = "ASC";
        }
    }

    if(sp.name !== undefined){
        name = sp.name;
    }

    let perPage = NaN;

    if(sp.perPage !== undefined){
        perPage = sp.perPage;
    }

    perPage = parseInt(perPage);


    const pageSettings = await getCategorySettings("Players");

    if(perPage !== perPage){
        perPage = pageSettings["Results Per Page"];
    }
    
    if(perPage > 100) perPage = 100;

    let players = [];
    let totalPlayers = 0;
    
    try{
        const data = await searchPlayers(name, sortBy, order, page, perPage);
        players = data.players;
        totalPlayers = data.totalPlayers;

    }catch(err){
        console.trace(err);
        error = err.toString();
    }


    const rows = [];

    for(let i = 0; i < players.length; i++){

        const p = players[i];

        const active = Math.floor(new Date(p.last_active) * 0.001);

        const url = `/player/${p.id}`;

        rows.push(<tr key={p.id}>
            <td className="text-left">
                <>
                    <Link href={url}>
                        <CountryFlag code={p.country}/>{p.name}
                    </Link>
                </>
            </td>
            <td className="font-small">
                {convertTimestamp(active, true)}
            </td>
            <td>{ignore0(p.score)}</td>
            <td>{ignore0(p.frags)}</td>
            <td>{ignore0(p.kills)}</td>
            <td>{ignore0(p.deaths)}</td>
            <td>{ignore0(p.suicides)}</td>
            <td>{p.eff.toFixed(2)}&#37;</td>
            <td>{p.matches}</td>
            <td className="font-small">{toPlaytime(p.playtime)}</td>
        </tr>);
    }

    if(rows.length === 0){
        rows.push(<tr>
            <td colSpan={10}>No matches found</td>
        </tr>);
    }

    let pageUrl = `/players?name=${name}&sortBy=${sortBy}&order=${order}&perPage=${perPage}&page=`;

    return <div>
        <Header>Player List</Header>
        <SearchForm originalName={name} originalSortBy={sortBy} originalOrder={order} originalPerPage={perPage}/>
        <ErrorBox title="Failed To Fetch Players">{error}</ErrorBox>
        <Pagination url={pageUrl} results={totalPlayers} perPage={perPage} currentPage={page}/>
        <table className="t-width-1">
            <tbody>
                <tr>
                    <th><Link href={createHeaderURL("name", sortBy, order)}>Name</Link></th>
                    <th><Link href={createHeaderURL("last_active", sortBy, order)}>Last Active</Link></th>
                    <th><Link href={createHeaderURL("score", sortBy, order)}>Score</Link></th>
                    <th><Link href={createHeaderURL("frags", sortBy, order)}>Frags</Link></th>
                    <th><Link href={createHeaderURL("kills", sortBy, order)}>Kills</Link></th>
                    <th><Link href={createHeaderURL("deaths", sortBy, order)}>Deaths</Link></th>
                    <th><Link href={createHeaderURL("suicides", sortBy, order)}>Suicides</Link></th>
                    <th><Link href={createHeaderURL("eff", sortBy, order)}>Eff</Link></th>
                    <th><Link href={createHeaderURL("matches", sortBy, order)}>Matches</Link></th>
                    <th><Link href={createHeaderURL("playtime", sortBy, order)}>Playtime</Link></th>
                </tr>
                {rows}
            </tbody>
        </table>
        <Pagination url={pageUrl} results={totalPlayers} perPage={perPage} currentPage={page}/>
    </div>
}