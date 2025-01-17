import { ImageResponse } from "next/og";
import { getMatchMapName } from "@/app/lib/matches.mjs";
import { getMapImageName} from "@/app/lib/maps.mjs";
import { headers } from 'next/headers';
 
export async function generateImageMetadata({ params }) {

   // console.log(test);
  //const images = await getOGImages(params.id)
  //console.log("fart");
    return [{
        "id": params.id,
        "size": { "width": 1200, "height": 600 },
        "alt": "Match Sshot",
        "contentType": 'image/png',
    }]

  /*return images.map((image, idx) => ({
    id: idx,
    size: { width: 1200, height: 600 },
    alt: image.text,
    contentType: 'image/png',
  }))*/
}
 
export default async function Image({ params, id }) {
  //const productId = (await params).id
  //const imageId = id
 // const text = await getCaptionForImage(productId, imageId)

    console.log(params);


    const fullMapName = await getMatchMapName(params.id);

    let mapName = "default";

    if(mapName !== null){
        mapName = await getMapImageName(fullMapName);
    }

    const headersList = await headers();
    
    const host = headersList.get('host') ?? "127.0.0.1"; // to get domain
   // console.log(headersList.get('next-url')); // to get url
    const proto = headersList.get("x-forwarded-proto") ?? "https";


    //for(const a of headersList.entries()){
   //     console.log(a);
   // }

 
    return new ImageResponse(
        (
        <div
            style={
            {
                // ...
                "backgroundColor": "red",
                "backgroundImage": `url(${proto}://${host}/images/maps/${mapName}.jpg)`,
                "width": "100%",
                "height": "100%",
                "color": "white",
                "fontSize": "82px"
            }
            }
        >
            {fullMapName}
        </div>
        )
     )
    }