import { NextResponse } from "next/server";
import serverMatchScreenshot from "@/app/lib/serverMatchScreenshot.mjs";

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

    
    const sshot = new serverMatchScreenshot(id, 1200, 630);

    const sshotData = await sshot.create();

    const response = new NextResponse(sshotData);
    response.headers.set('content-type', 'image/jpeg');
    return response;
    //return Response.json({"emssage": "trest"});
}