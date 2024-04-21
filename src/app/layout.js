import { Inter } from "next/font/google";
import "./globals.css";
import Nav from "./UI/Nav";
import UpdateSession from "./UpdateSession";
import { getSessionInfo } from "./lib/authentication";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Node UTStats Lite",
  description: "Node UTStats for the UTStats-lite mutator",
};

export default async function RootLayout({ children }) {

	const sessionInfo = await getSessionInfo();
	
	return (
		<html lang="en">
		<body className={inter.className}>
			<UpdateSession />
			<Nav sessionInfo={sessionInfo} bAdmin={true}/>
			<div className="padding-top"></div>
			{children}
			<footer>Node UTStats Lite</footer>
		</body>
		</html>
	);
}
