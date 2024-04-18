import CountryFlag from "@/app/UI/CountryFlag";
import Header from "@/app/UI/Header";
import { getPlayerById, getPlayerGametypeTotals, getPlayerRecentMatches } from "@/app/lib/players.mjs";
import GametypeTotals from "@/app/UI/Player/GametypeTotals";
import { getGametypeNames } from "@/app/lib/gametypes.mjs";
import SpecialEvents from "@/app/UI/Player/SpecialEvents";
import WeaponStats from "@/app/UI/Player/WeaponStats";
import { getPlayerTotals as weaponsGetPlayerTotals, getWeaponNames } from "@/app/lib/weapons.mjs";
import RecentMatches from "@/app/UI/Player/RecentMatches";
//import {getWeaponNames} from "@/app/lib/weapons.mjs";

export async function generateMetadata({ params, searchParams }, parent) {
    // read route params
    const id = params.id;

    let player = await getPlayerById(id);

    if(player === null){

        player = {
            "name": "Not Found",
            "id": id,
            "country": "xx",
            "playtime": 0
        };
    }

   
    // optionally access and extend (rather than replace) parent metadata
    //const previousImages = (await parent).openGraph?.images || []
   
    return {
        "title": `${player.name} - Player Profile`,
        "description": `View ${player.name} player summary.`
        /*openGraph: {
            images: ['/some-specific-page-image.jpg', ...previousImages],
        },*/
    }
  }

export default async function Page({params, searchParams}){

    console.log("searchParams");
    console.log(searchParams);
    console.log(params);
   

    let id = 0;

    if(params.id !== undefined){

        id = parseInt(params.id);
        if(id !== id) id = 0;

    }

    let player = await getPlayerById(id);
    let totals = [];

    if(player === null){
        player = {"name": "Not Found", "country": "", "id": 0};
    }else{
        totals = await getPlayerGametypeTotals(id);
    }


    const weaponTotals = await weaponsGetPlayerTotals(id);

    const weaponIds = [... new Set(weaponTotals.map((w) =>{
        return w.weapon_id;
    }))]

    const weaponNames = await getWeaponNames(weaponIds);

    const gametypeIds = [...new Set(
        totals.map((t) =>{
            return t.gametype_id;
         }), 
        ...weaponTotals.map((wt) =>{
        return wt.gametype_id;
    }))];


    const gametypeNames = await getGametypeNames(gametypeIds);

    const recentMatches = await getPlayerRecentMatches(id);

    console.log(recentMatches);

    const dates = [...new Set(recentMatches.map((r) =>{
        return r.match_date;
    }))]

    console.log(dates);

    return <main>
        <Header><CountryFlag code={player.country}/>{player.name}'s Player Summary</Header> 
        <GametypeTotals data={totals} names={gametypeNames}/>
        <SpecialEvents data={totals} gametypeNames={gametypeNames}/>
        <WeaponStats totals={weaponTotals} weaponNames={weaponNames} gametypeNames={gametypeNames}/>
        <RecentMatches data={recentMatches}/>
    </main>
}