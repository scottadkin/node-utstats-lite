import styles from "./page.module.css";
import BasicServerList from "./UI/Home/BasicServerList";
import { getBasicList } from "./lib/servers.mjs";
import BasicGametypeList from "./UI/Home/BasicGametypeList";
import { getAll as getAllGametypes } from "./lib/gametypes.mjs";
import { getMostPlayedMaps } from "./lib/maps.mjs";
import { getRecentMatches } from "./lib/matches.mjs";
import BasicMapsList from "./UI/Home/BasicMapsList";
import BasicRecentMatches from "./UI/Home/BasicRecentMatches";
import { getCategorySettings } from "./lib/siteSettings.mjs";
import SocialMedia from "./UI/SocialMedia";
import WelcomeMessage from "./UI/WelcomeMessage";
import { getPageLayout } from "./lib/pageLayout.mjs";
import ActivityHeatMap from "./UI/ActivityHeatMap";



export default async function Home() {

	const pageSettings = await getCategorySettings("Home");
	const socialSettings = await getCategorySettings("Social Media");
	const welcomeMessageSettings = await getCategorySettings("Welcome Message");


	const servers = (pageSettings["Display Servers"] === "1") ? await getBasicList() : null;
	const gametypes = (pageSettings["Display Most Played Gametypes"] === "1") ? await getAllGametypes() : null;
	const mapsData = (pageSettings["Display Most Played Maps"] === "1") ? await getMostPlayedMaps(pageSettings["Total Most Played Maps"]) : null;
	const recentMatches = (pageSettings["Display Recent Matches"] === "1") ? await getRecentMatches(1, pageSettings["Total Recent Matches"], 0, 0, 0) : null;


	const pageLayout = await getPageLayout("Home");
	
	const elems = [];

	elems[pageLayout["Welcome Message"]] = <WelcomeMessage key="welcome" settings={welcomeMessageSettings} bDisplay={pageSettings["Display Welcome Message"]}/>;
	elems[pageLayout["Social Media"]] = <SocialMedia key="social" settings={socialSettings} bDisplay={pageSettings["Display Social Media"]}/>;

	elems[pageLayout["Recent Matches"]] = (recentMatches !== null) ? <BasicRecentMatches key="matches" data={recentMatches.data}/> : null;
	elems[pageLayout["Most Played Maps"]] = (mapsData !== null) ? <BasicMapsList key="maps" data={mapsData.data} images={mapsData.images}/> : null;
	elems[pageLayout["Most Played Gametypes"]] = (gametypes !== null) ? <BasicGametypeList key="gametypes" gametypes={gametypes}/> : null;
	elems[pageLayout["Servers"]] = (servers !== null) ? <BasicServerList key="servers" servers={servers}/> : null;

	if(pageSettings["Display Activity Heatmap"] === "1"){
		elems[pageLayout["Activity Heatmap"]] = <ActivityHeatMap queryMode="get-matches-played-between" apiURL="/api/matches"/>;
	}

	

	return <main className={styles.main}>
		<div>
			{elems}		
		</div>
	</main>
	
}
