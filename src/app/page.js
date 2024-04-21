import styles from "./page.module.css";
import BasicServerList from "./UI/Home/BasicServerList";
import { getBasicList } from "./lib/servers.mjs";
import BasicGametypeList from "./UI/Home/BasicGametypeList";
import { getAll as getAllGametypes } from "./lib/gametypes.mjs";

export default async function Home() {

	const servers = await getBasicList();
	const gametypes = await getAllGametypes();

	return <main className={styles.main}>
		<div>
			<BasicGametypeList gametypes={gametypes}/>
			<BasicServerList servers={servers}/>

		</div>
	</main>
	
}
