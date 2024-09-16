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


export async function generateMetadata({ params, searchParams }, parent) {
    // read route params

    //const match = new Match();
    const matchId = params.id ?? -1;

    const matchData = await getMatchData(matchId);

    if(matchData.error !== undefined){
        return {
            "title": `Match doesn't exist`,
            "description": `Match with that id does not exist`
        }
    }

    const b = matchData.basic;

    const date = Math.floor(new Date(matchData.basic.date) * 0.001);

   
    return {
        "title": `${b.mapName} - ${convertTimestamp(date, true)}`,
        "description": `Match report for ${b.mapName} (${b.gametypeName}), ${convertTimestamp(date, true)}, ${b.players} ${plural(b.players, "player")}, match length ${toPlaytime(b.playtime)}, server ${b.serverName}.`
    }
}


   

export default async function MatchPage({params, searchParams}) {

    let matchId = params.id ?? -1;

    const matchData = await getMatchData(matchId);

    const weaponImages = await getAllWeaponImages();

    
    if(matchData.error !== undefined){
        return (
            <main>
                <ErrorBox title="Failed to load match">{matchData.error}</ErrorBox>
            </main>
        );
    }

    console.log(matchData.basic.hash);
	const totalTeams = matchData.basic.total_teams;

    return (
		<main>
			<BasicInfo matchData={matchData}/>
            <MatchScreenshot data={matchData}/>
			<FragTable data={matchData} totalTeams={totalTeams}/>
            <CTFTable data={matchData.ctf} players={matchData.basicPlayers} totalTeams={totalTeams}/>
            <DomTable data={matchData.dom} players={matchData.basicPlayers}/>
            <WeaponStats data={matchData.weaponStats} totalTeams={totalTeams} players={matchData.basicPlayers} weaponImages={weaponImages}/>
            <ItemsTable data={matchData.playerData} totalTeams={totalTeams}/>
            <SpecialEvents data={matchData} totalTeams={totalTeams}/>
            <KillsMatchUp kills={matchData.kills} totalTeams={totalTeams} players={matchData.basicPlayers}/>
            <Pings data={matchData.playerData} totalTeams={totalTeams}/>
		</main>
    );
}