import CountryFlag from "@/app/UI/CountryFlag";
import Header from "@/app/UI/Header";
import { getPlayerByAuto, getPlayerGametypeTotals, getPlayerRecentMatches } from "@/app/lib/players.mjs";
import GametypeTotals from "@/app/UI/Player/GametypeTotals";
import { getGametypeNames } from "@/app/lib/gametypes.mjs";
import SpecialEvents from "@/app/UI/Player/SpecialEvents";
import WeaponStats from "@/app/UI/Player/WeaponStats";
import { getPlayerTotals as weaponsGetPlayerTotals, getWeaponNames } from "@/app/lib/weapons.mjs";
import { getPlayerCTFTotals } from "@/app/lib/ctf.mjs";
import RecentMatches from "@/app/UI/Player/RecentMatches";
import ItemStats from "@/app/UI/Player/ItemStats";
import CTFTotals from "@/app/UI/Player/CTFTotals";
import ErrorBox from "@/app/UI/ErrorBox";
import { getPlayerRankings } from "@/app/lib/rankings.mjs";
import Rankings from "@/app/UI/Player/Rankings";
import PermaLink from "@/app/UI/PermaLink";
import { getCategorySettings } from "@/app/lib/siteSettings.mjs";
import { getPageLayout } from "@/app/lib/pageLayout.mjs";
//import {getWeaponNames} from "@/app/lib/weapons.mjs";

export async function generateMetadata({ params, searchParams }, parent) {
    // read route params
    const id = params.id;

    let player = await getPlayerByAuto(id);

    if(player === null){

        player = {
            "name": "Not Found",
            "id": id,
            "country": "xx",
            "playtime": 0
        };
    }
    
    const settings = await getCategorySettings("Branding");

   
    // optionally access and extend (rather than replace) parent metadata
    //const previousImages = (await parent).openGraph?.images || []
   
    return {
        "title": `${player.name} - Player Profile - ${settings["Site Name"] || "Node UTStats Lite"}`,
        "description": `View ${player.name} player summary.`
        /*openGraph: {
            images: ['/some-specific-page-image.jpg', ...previousImages],
        },*/
    }
  }

export default async function Page({params, searchParams}){

    let id = 0;

    if(params.id !== undefined){
        id = params.id;
    }


    let player = await getPlayerByAuto(id);

    if(player === null){

        return <main>
            <ErrorBox title="Failed to load player">Player doesn&apos;t exist</ErrorBox>
        </main>
    }

    const pageSettings = await getCategorySettings("Player");
    const pageLayout = await getPageLayout("Player");

    const realId = player.id;
    const hash = player.hash;

    let totals = [];

    if(player === null){
        player = {"name": "Not Found", "country": "", "id": 0};
    }else{
        totals = await getPlayerGametypeTotals(realId);
    }

    let weaponTotals = [];
    let weaponIds = [];
    let weaponNames = {};

    if(pageSettings["Display Weapons"] === "1"){

        weaponTotals = await weaponsGetPlayerTotals(realId);

        weaponIds = [... new Set(weaponTotals.map((w) =>{
            return w.weapon_id;
        }))]

        weaponNames = await getWeaponNames(weaponIds);
    }

    

    const gametypeIds = [...new Set(
        totals.map((t) =>{
            return t.gametype_id;
         }), 
        ...weaponTotals.map((wt) =>{
        return wt.gametype_id;
    }))];


    const gametypeNames = await getGametypeNames(gametypeIds);

    const ctfTotals = await getPlayerCTFTotals(realId);

    const month = 60 * 60 * 24 * 28;

    const minDate = new Date(Date.now() - month * 1000);

    let rankings = [];

    if(pageSettings["Display Rankings"] === "1"){
        rankings = await getPlayerRankings(realId, minDate);
    }

    

    const elems = [];


    const gametypeElem = (pageSettings["Display Gametype Totals"] === "1") ? <GametypeTotals key="gametypes" data={totals} names={gametypeNames}/> : null;
    elems[pageLayout["Gametype Totals"]] = gametypeElem;

    const ctfElem = (pageSettings["Display CTF"] === "1") ? <CTFTotals key="ctf" data={ctfTotals} gametypeNames={gametypeNames}/> : null; 
    elems[pageLayout["CTF"]] = ctfElem;

    const specialElem = (pageSettings["Display Special Events"] === "1") ? <SpecialEvents key="special" data={totals} gametypeNames={gametypeNames}/> : null; 
    elems[pageLayout["Special Events"]] = specialElem;

    const weaponElem = (pageSettings["Display Weapons"] === "1") ? <WeaponStats totals={weaponTotals} key="weapons" weaponNames={weaponNames} gametypeNames={gametypeNames}/> : null;
    elems[pageLayout["Weapons"]] = weaponElem;

    const rankingElem = (pageSettings["Display Rankings"] === "1") ? <Rankings key="rankings" data={rankings} gametypeNames={gametypeNames}/> : null;
    elems[pageLayout["Rankings"]] = rankingElem;

    const itemsElem = (pageSettings["Display Items"] === "1") ? <ItemStats key="items" data={totals} gametypeNames={gametypeNames}/> : null;
    elems[pageLayout["Items"]] = itemsElem;

    const matchesElem = (pageSettings["Display Recent Matches"] === "1") ? <RecentMatches key="matches" playerId={realId}/> : null;
    elems[pageLayout["Recent Matches"]] = matchesElem;

    return <main>
        <Header>
            <CountryFlag code={player.country}/>{player.name}&apos;s Player Summary
        </Header> 
        <div className="text-center">
            <PermaLink url={`/player/${hash}`} text="Copy Permanent Player Link To Clipboard"/>
        </div>
        {elems}
        
        
        
        
        
        
        
    </main>
}