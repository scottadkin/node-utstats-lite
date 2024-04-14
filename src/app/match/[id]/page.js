"use server"
import Image from "next/image";
import {getMatchData} from "@/app/lib/matches.mjs";
import Header from "@/app/UI/Header";
import MatchScoreBox from "@/app/UI/MatchScoreBox";
import FragTable from "@/app/UI/Match/FragTable";
import SpecialEvents from "@/app/UI/Match/SpecialEvents";
import WeaponStats from "@/app/UI/Match/WeaponStats";
import KillsMatchUp from "@/app/UI/Match/KillsMatchUp";
import CTFTable from "@/app/UI/Match/CTFTable";
import DomTable from "@/app/UI/Match/DomTable";
import ItemsTable from "@/app/UI/Match/ItemsTable";


export async function generateMetadata({ params, searchParams }, parent) {
    // read route params

    //const match = new Match();
    const id = params.id;

    //const matchData = await match.get(1);
   
    // fetch data
    //const product = await fetch(`https://.../${id}`).then((res) => res.json())
   
    // optionally access and extend (rather than replace) parent metadata
    //const previousImages = (await parent).openGraph?.images || []
   
    return {
        title: `Match ${id}`,
        /*openGraph: {
            images: ['/some-specific-page-image.jpg'],
        },*/
    }
}


   

export default async function MatchPage({params, searchParams}) {

    let matchId = params.id ?? -1;

    const matchData = await getMatchData(matchId);
	const totalTeams = matchData.basic.total_teams;

    console.log(matchData);

    return (
		<main>
			<Header>Match Report</Header> 
			<MatchScoreBox data={matchData.basic}/>
			<FragTable data={matchData} totalTeams={totalTeams}/>
            <CTFTable data={matchData.ctf} players={matchData.basicPlayers} totalTeams={totalTeams}/>
            <DomTable data={matchData.dom} players={matchData.basicPlayers}/>
            <WeaponStats data={matchData.weaponStats} totalTeams={totalTeams} players={matchData.basicPlayers}/>
            <ItemsTable data={matchData.playerData} totalTeams={totalTeams}/>
            <SpecialEvents data={matchData} totalTeams={totalTeams}/>
            <KillsMatchUp kills={matchData.kills} totalTeams={totalTeams} players={matchData.basicPlayers}/>
		</main>
    );
}