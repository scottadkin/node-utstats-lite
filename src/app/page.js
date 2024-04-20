import styles from "./page.module.css";
import BasicServerList from "./UI/Home/BasicServerList";
import { getBasicList } from "./lib/servers.mjs";

export default async function Home() {

	const servers = await getBasicList();

	return <main className={styles.main}>
		<div>
			<BasicServerList servers={servers}/>
		</div>
	</main>
	
}
