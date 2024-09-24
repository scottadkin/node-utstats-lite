import Header from "../UI/Header";
import {getAllBasicAndImages} from "../lib/maps.mjs";
import MapsSearch from "../UI/MapsSearch";

export async function generateMetadata({ params, searchParams }, parent) {

    return {
        "title": `Map List - Node UTStats Lite`,
        "description": `View all maps that have been played on our servers`
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