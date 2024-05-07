import CountryFlag from "@/app/UI/CountryFlag";
import Header from "@/app/UI/Header";
import { getPlayerById, getPlayerGametypeTotals, getPlayerRecentMatches } from "@/app/lib/players.mjs";
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

    let id = 0;

    if(params.id !== undefined){

        id = parseInt(params.id);
        if(id !== id) id = 0;

    }

    let player = await getPlayerById(id);

    if(player === null){

        return <main>
            <ErrorBox title="Failed to load player">Player doesn&apos;t exist</ErrorBox>
        </main>
    }

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

    const ctfTotals = await getPlayerCTFTotals(id);

    const month = 60 * 60 * 24 * 28;

    const minDate = new Date(Date.now() - month * 1000);

    const rankings = await getPlayerRankings(id, minDate);

    

    return <main>
        <Header><CountryFlag code={player.country}/>{player.name}&apos;s Player Summary</Header> 
        <GametypeTotals data={totals} names={gametypeNames}/>
        <CTFTotals data={ctfTotals} gametypeNames={gametypeNames}/>
        <SpecialEvents data={totals} gametypeNames={gametypeNames}/>
        <WeaponStats totals={weaponTotals} weaponNames={weaponNames} gametypeNames={gametypeNames}/>
        <Rankings data={rankings} gametypeNames={gametypeNames}/>
        <ItemStats data={totals} gametypeNames={gametypeNames}/>
        <RecentMatches playerId={id}/>
    </main>
}