"use server"
import {getMatchData} from "@/app/lib/matches.mjs";
import FragTable from "@/app/UI/Match/FragTable";
import SpecialEvents from "@/app/UI/Match/SpecialEvents";
import WeaponStats from "@/app/UI/Match/WeaponStats";
import KillsMatchUp from "@/app/UI/Match/KillsMatchUp";
import CTFTable from "@/app/UI/Match/CTFTable";
import DomTable from "@/app/UI/Match/DomTable";
import ItemsTable from "@/app/UI/Match/ItemsTable";
import BasicInfo from "@/app/UI/Match/BasicInfo";
import { convertTimestamp, plural, toPlaytime } from "@/app/lib/generic.mjs";
import Pings from "@/app/UI/Match/Pings";
import ErrorBox from "@/app/UI/ErrorBox";
import MatchScreenshot from "@/app/UI/Match/MatchScreenshot";
import { getAllImages as getAllWeaponImages, bWeaponImageExist } from "@/app/lib/weapons.mjs";
import { getCategorySettings } from "@/app/lib/siteSettings.mjs";
import { getPageLayout } from "@/app/lib/pageLayout.mjs";
import JSONInfo from "@/app/UI/Match/JSONInfo";


import AddToSavedMatches from "@/app/UI/Match/AddToSavedMatches";


export async function generateMetadata({ params, searchParams }, parent) {
    // read route params

    const settings = await getCategorySettings("Branding");

    //const match = new Match();
    const matchId = params.id ?? -1;

    const matchData = await getMatchData(matchId);

    if(matchData.error !== undefined){
        return {
            "title": `Match doesn't exist - ${settings["Site Name"] || "Node UTStats Lite"}`,
            "description": `Match with that id does not exist`
        }
    }

    const b = matchData.basic;

    const date = Math.floor(new Date(matchData.basic.date) * 0.001);

   
    return {
        "title": `${b.mapName} - ${convertTimestamp(date, true)} - ${settings["Site Name"] || "Node UTStats Lite"}`,
        "description": `Match report for ${b.mapName} (${b.gametypeName}), ${convertTimestamp(date, true)}, ${b.players} ${plural(b.players, "player")}, match length ${toPlaytime(b.playtime)}, server ${b.serverName}.`
    }
}


   

export default async function MatchPage({params, searchParams}) {

    let matchId = params.id ?? -1;

    const matchData = await getMatchData(matchId);

    const weaponImages = await getAllWeaponImages();

    const pageSettings = await getCategorySettings("Match");
    const pageLayout = await getPageLayout("Match");

    if(matchData.error !== undefined){
        return (
            <main>
                <ErrorBox title="Failed to load match">{matchData.error}</ErrorBox>
            </main>
        );
    }

	const totalTeams = matchData.basic.total_teams;


    const elems = [];


    elems[pageLayout["Basic Info"]] = (pageSettings["Display Basic Info"] === "1") ? <BasicInfo key="basic" matchData={matchData}/> : null;
    elems[pageLayout["Screenshot"]] = (pageSettings["Display Screenshot"] === "1") ? <MatchScreenshot key="sshot" data={matchData}/> : null;
    elems[pageLayout["Frags"]] = (pageSettings["Display Frags"] === "1") ? <FragTable key="frags" data={matchData} totalTeams={totalTeams}/> : null;
    elems[pageLayout["CTF"]] = (pageSettings["Display CTF"] === "1") ? <CTFTable key="ctf" data={matchData.ctf} players={matchData.basicPlayers} totalTeams={totalTeams}/> : null;
    elems[pageLayout["DOM"]] = (pageSettings["Display DOM"] === "1") ? <DomTable key="dom" data={matchData.dom} players={matchData.basicPlayers}/>: null;
    elems[pageLayout["Weapons"]] = (pageSettings["Display Weapons"] === "1") ? <WeaponStats key="weapons" data={matchData.weaponStats} totalTeams={totalTeams} players={matchData.basicPlayers} weaponImages={weaponImages}/> : null;
    elems[pageLayout["Items"]] = (pageSettings["Display Items"] === "1") ? <ItemsTable key="items" data={matchData.playerData} totalTeams={totalTeams}/> : null;
    elems[pageLayout["Special Events"]] = (pageSettings["Display Special Events"] === "1") ? <SpecialEvents key="special" data={matchData} totalTeams={totalTeams}/> : null;
    elems[pageLayout["Kills"]] = (pageSettings["Display Kills"] === "1") ? <KillsMatchUp key="kills" kills={matchData.kills} totalTeams={totalTeams} players={matchData.basicPlayers}/> : null;
    elems[pageLayout["Pings"]] = (pageSettings["Display Pings"] === "1") ? <Pings key="pings" data={matchData.playerData} totalTeams={totalTeams}/> : null;
    elems[pageLayout["JSON Links"]] = (pageSettings["Display JSON Links"] === "1") ? <JSONInfo key="json" matchId={matchId}/> : null;

    return (
		<main>
            <AddToSavedMatches hash={matchData.basic.hash}/>
            {elems}
		</main>
    );
}