import Header from "../UI/Header";
import {getAllStats} from "../lib/maps.mjs";
import MapRichBox from "../UI/MapRichBox";

export async function generateMetadata({ params, searchParams }, parent) {

    return {
        "title": `Map List - Node UTStats Lite`,
        "description": `View all maps that have been played on our servers`
    }
}


export default async function MapsPage({}){

    const {maps, earliest, latest, images} = await getAllStats();

    const elems = [];

    for(let i = 0; i < maps.length; i++){

        const m = maps[i];

        let image = images[m.name.toLowerCase()];

        if(image === undefined) image = "default.jpg";

        elems.push(<MapRichBox key={i} data={m} image={image}/>);
    }

    return <main>
        <Header>Maps</Header>
        <div className="rich-outter">
            {elems}
        </div>
        
    </main>;
}