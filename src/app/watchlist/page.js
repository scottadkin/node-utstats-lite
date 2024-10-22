import Header from "../UI/Header";
import { getCategorySettings } from "../lib/siteSettings.mjs";
import SavedMatches from "../UI/Watchlist/SavedMatches";


export async function generateMetadata({ params, searchParams }, parent) {

    const settings = await getCategorySettings("Branding");

    return {
        "title": `Watchlist - ${settings["Site Name"] || "Node UTStats Lite"}`,
        "description": `Keep a list of players, and matches that you can get back to easily.`
    }
}


export default function Watchlist({}){

    return <div>
        <Header>Watchlist</Header>
        <div className="info">

            Keep a list of players, and matches that you can get back to easily.<br/>
            No account is necessary, everything is saved to your localstorage on your browser.
        </div>
        <SavedMatches />
    </div>
}