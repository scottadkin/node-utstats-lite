import Image from "next/image";
import {getMatchData} from "@/app/lib/matches.mjs";
import Header from "@/app/UI/Header";
import MatchScoreBox from "@/app/UI/MatchScoreBox";
import { getTeamColorClass } from "../../lib/generic.mjs";
import FragTable from "@/app/UI/Match/FragTable";
import SpecialEvents from "@/app/UI/Match/SpecialEvents";
import WeaponStats from "@/app/UI/Match/WeaponStats";


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

    return (
		<main>
			<Header>Match Report</Header> 
			<MatchScoreBox data={matchData.basic}/>
			<FragTable data={JSON.stringify(matchData)} totalTeams={totalTeams}/>
      		<WeaponStats data={matchData.weaponStats} totalTeams={totalTeams} players={matchData.basicPlayers}/>
      		<SpecialEvents data={JSON.stringify(matchData)} totalTeams={totalTeams}/>
		</main>
    );
}