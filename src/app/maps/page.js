import Header from "../UI/Header";
import {getAllBasicAndImages} from "../lib/maps.mjs";
import MapsSearch from "../UI/MapsSearch";
import { getCategorySettings } from "@/app/lib/siteSettings.mjs";

export async function generateMetadata({ params, searchParams }, parent) {

    const settings = await getCategorySettings("Branding");


    return {
        "title": `Map List - ${settings["Site Name"] || "Node UTStats Lite"}`,
        "description": `Search through all maps that have been played on our servers`
    }
}


export default async function MapsPage({searchParams}){

    const {maps, images} = await getAllBasicAndImages();

    //console.log(searchParams);

    let search = (searchParams.search !== undefined) ? searchParams.search : "";

    return <main>
        <Header>Maps</Header>
        <MapsSearch maps={maps} images={images} search={search}/>
    </main>;
}