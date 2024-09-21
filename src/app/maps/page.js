import Header from "../UI/Header";
import {getAllBasicAndImages} from "../lib/maps.mjs";
import MapRichBoxes from "../UI/MapRichBoxes";

export async function generateMetadata({ params, searchParams }, parent) {

    return {
        "title": `Map List - Node UTStats Lite`,
        "description": `View all maps that have been played on our servers`
    }
}


export default async function MapsPage({}){

    const {maps, images} = await getAllBasicAndImages();

    return <main>
        <Header>Maps</Header>
        <div className="rich-outter">
            <MapRichBoxes data={maps} images={images}/>
        </div> 
    </main>;
}