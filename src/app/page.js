import styles from "./page.module.css";
import BasicServerList from "./UI/Home/BasicServerList";
import { getBasicList } from "./lib/servers.mjs";
import BasicGametypeList from "./UI/Home/BasicGametypeList";
import { getAll as getAllGametypes } from "./lib/gametypes.mjs";
import { getMostPlayedMaps } from "./lib/maps.mjs";
import BasicMapsList from "./UI/Home/BasicMapsList";

export default async function Home() {

	const servers = await getBasicList();
	const gametypes = await getAllGametypes();
	const mapsData = await getMostPlayedMaps(10);

	return <main className={styles.main}>
		<div>
			<BasicMapsList data={mapsData}/>
			<BasicGametypeList gametypes={gametypes}/>
			<BasicServerList servers={servers}/>
		</div>
	</main>
	
}
