import { Inter } from "next/font/google";
import "./globals.css";
import Nav from "./UI/Nav";
import UpdateSession from "./UpdateSession";
import { getSessionInfo } from "./lib/authentication";
import { getCategorySettings } from "./lib/siteSettings.mjs";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Node UTStats Lite",
  description: "Node UTStats for the UTStats-lite mutator",
};

export default async function RootLayout({ children }) {

	const sessionInfo = await getSessionInfo();

	const navSettings = await getCategorySettings("Nav");
	
	return (
		<html lang="en">
		<body className={inter.className}>
			<UpdateSession />
			<Nav settings={navSettings} sessionInfo={sessionInfo} bAdmin={true}/>
			<div className="padding-top"></div>
			{children}
			<footer>
				<a href="https://github.com/scottadkin/node-utstats-lite">Node UTStats Lite website</a> for the <a href="https://github.com/rxut/UTStatsLite">UTStats Lite Mutator</a><br/>
				Version preview 1<br/>
				Website &copy; 2024 Scott Adkin<br/>
				UTStats mod was originally created by azazel, AnthraX, and toa, with additions by Skillz, killereye, Enakin, Loki and rork.<br/>
				UTStats-lite changes by rX
			</footer>
		</body>
		</html>
	);
}
