import styles from "./page.module.css";
import BasicServerList from "./UI/Home/BasicServerList";
import { getBasicList } from "./lib/servers.mjs";
import BasicGametypeList from "./UI/Home/BasicGametypeList";
import { getAll as getAllGametypes } from "./lib/gametypes.mjs";
import { getMostPlayedMaps } from "./lib/maps.mjs";
import { getRecentMatches } from "./lib/matches.mjs";
import BasicMapsList from "./UI/Home/BasicMapsList";
import BasicRecentMatches from "./UI/Home/BasicRecentMatches";

export default async function Home() {

	const servers = await getBasicList();
	const gametypes = await getAllGametypes();
	const mapsData = await getMostPlayedMaps(10);
	const recentMatches = await getRecentMatches(1, 3, 0, 0, 0);

	return <main className={styles.main}>
		<div>
			<BasicRecentMatches data={recentMatches.data}/>
			<BasicMapsList data={mapsData}/>
			<BasicGametypeList gametypes={gametypes}/>
			<BasicServerList servers={servers}/>
		</div>
	</main>
	
}
