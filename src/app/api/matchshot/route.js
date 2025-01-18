import { NextResponse } from "next/server";
import { createCanvas, loadImage, createImageData } from 'canvas';
import { getMatchOGImageData, getMatchMapName } from "@/app/lib/matches.mjs";
import { getMapImageName } from "@/app/lib/generic.mjs";
import { getMapImages } from "@/app/lib/maps.mjs";

export async function GET(req){

    const { searchParams } = new URL(req.url);


    let id = searchParams.get("id");

    if(id === null){
        return NextResponse.json({ "error": "Id is null" }, { "status": 500 })
    }

    id = parseInt(id);

    if(id !== id){
        return NextResponse.json({ "error": "Id must be a valid integer" }, { "status": 500 })
    }

    const matchData = await getMatchOGImageData(id);
    console.log(matchData);

    const fullMapName = await getMatchMapName(id);

    let mapName = "default";

    if(mapName !== null){
        mapName =  getMapImageName(fullMapName);
    }

    const images = await getMapImages([mapName]);

    console.log(images[mapName]);

    const bgImage = (images[mapName] !== undefined) ? images[mapName] : "default.jpg";
   
    const canvas = createCanvas(1200, 630);
    const ctx = canvas.getContext('2d');

    // Write "Awesome!"
    ctx.font = '30px Impact'
    //ctx.rotate(0.1)
   // ctx.fillText('Awesome!', 50, 100)

    // Draw line under text
    var text = ctx.measureText('Awesome!')
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'
    ctx.beginPath()
    ctx.lineTo(50, 102)
    ctx.lineTo(50 + text.width, 102)
    ctx.stroke()

    // Draw cat with lime helmet
    await loadImage(`./public/images/maps/${bgImage}`).then((image) => {
        console.log("test");
        ctx.fillStyle = "white";
        ctx.drawImage(image, 0, 0, 1200, 630)
        ctx.fillText(fullMapName, 50, 100)
    //console.log('<img src="' + canvas.toDataURL() + '" />')
    })

    const width = 20, height = 20
    const arraySize = width * height * 4
    const mydata = createImageData(new Uint8ClampedArray(arraySize), width)


    const a = canvas.toBuffer("image/png");

    const response = new NextResponse(a)
    response.headers.set('content-type', 'image/png');
    return response;
    //return Response.json({"emssage": "trest"});
}