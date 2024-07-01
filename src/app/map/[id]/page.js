import Header from "@/app/UI/Header";
import { getMapImages, getMapInfo } from "@/app/lib/maps.mjs";
import Image from "next/image";

export async function generateMetadata({ params, searchParams }, parent) {

    let id = (params.id !== undefined) ? parseInt(params.id) : 0;
    if(id !== id) id = 0;

    const info = await getMapInfo(id);


    return {
        "title": `${info.name} - Node UTStats Lite`,
        "description": `View all matches for the map called ${info.name}`
    }
}

export default async function MapPage({params, searchParams}){

    let id = (params.id !== undefined) ? parseInt(params.id) : 0;
    if(id !== id) id = 0;


    const info = await getMapInfo(id);

    const images = await getMapImages([info.name]);

    const image = images[Object.keys(images)[0]];

    return <main>
        <Header>{info.name}</Header>
        <div className="map-sshot">
            <Image src={`/images/maps/${image}`} width={1920} height={1080} alt="image"/>
        </div>
    </main>
}