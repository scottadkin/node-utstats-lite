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

export default async function Home() {

	const pageSettings = await getCategorySettings("Home");


	const servers = (pageSettings["Display Servers"] === "1") ? await getBasicList() : null;
	const gametypes = (pageSettings["Display Most Played Gametypes"] === "1") ? await getAllGametypes() : null;
	const mapsData = (pageSettings["Display Most Played Maps"] === "1") ? await getMostPlayedMaps(pageSettings["Total Most Played Maps"]) : null;
	const recentMatches = (pageSettings["Display Recent Matches"] === "1") ? await getRecentMatches(1, pageSettings["Total Recent Matches"], 0, 0, 0) : null;

	return <main className={styles.main}>
		<div>
			{(recentMatches !== null) ? <BasicRecentMatches data={recentMatches.data}/> : null}
			{(mapsData !== null) ? <BasicMapsList data={mapsData.data} images={mapsData.images}/> : null}
			{(gametypes !== null) ? <BasicGametypeList gametypes={gametypes}/> : null}
			{(servers !== null) ? <BasicServerList servers={servers}/> : null}
			
		</div>
	</main>
	
}
