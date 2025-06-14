import { Inter } from "next/font/google";
import "./globals.css";
import Nav from "./UI/Nav";
import UpdateSession from "./UpdateSession";
import { getSessionInfo } from "./lib/authentication";
import { getCategorySettings } from "./lib/siteSettings.mjs";
import { headers } from 'next/headers';
import { getPageLayout } from "./lib/pageLayout.mjs";
import { getLeaguesEnabledStatus } from "./lib/ctfLeague.mjs";

const inter = Inter({ subsets: ["latin"] });


export async function generateMetadata({ params, searchParams }, parent) {


	const headersList = await headers();
  
    const host = headersList.get("host"); // to get domain
    //console.log(headersList.get('next-url')); // to get url

    const protocal = headersList.get("x-forwarded-proto");

	const settings = await getCategorySettings("Branding");

	return {
		"metadataBase": `${protocal}://${host}`,
	  	"title": settings["Site Name"] || "Node UTStats Lite",
		"description": settings["Description"] || "Stats based website made for the UTStats-lite mutator.",
		"siteName": settings["Site Name"],
		"openGraph": {
			"images": [`./images/maps/default.jpg`]
		}
	}
}

export default async function RootLayout({ children }) {

	const sessionInfo = await getSessionInfo();

	const navSettings = await getCategorySettings("Nav");
	const navLayout = await getPageLayout("Nav");
	const leagueStatus = await getLeaguesEnabledStatus();
	
	return (
		<html lang="en">
		<body className={inter.className}>
			<UpdateSession />
			<Nav settings={navSettings} sessionInfo={sessionInfo} bAdmin={true} layout={navLayout} leagueStatus={leagueStatus}/>
			<div className="padding-top"></div>
			{children}
			<footer>
				<a href="https://github.com/scottadkin/node-utstats-lite">Node UTStats Lite Website</a> for the <a href="https://github.com/rxut/UTStatsLite">UTStats Lite Mutator</a><br/>
				Website Version 1.8.0 &copy; 2024-2025 Scott Adkin<br/>
				UTStats-lite changes by rX <br/>
				UTStats mod was originally created by azazel, AnthraX, and toa, with additions by Skillz, killereye, Enakin, Loki and rork.
				
			</footer>
		</body>
		</html>
	);
}
