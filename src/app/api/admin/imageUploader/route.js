import { getSessionInfo } from "@/app/lib/authentication";
import {writeFile} from "node:fs/promises";


function bValidFile(file){

    const validTypes = ["image/png", "image/jpg", "image/jpeg"];
    const validExt = [".jpg", ".jpeg", ".png"];

    if(file.type == undefined) return false;
    if(file.name == undefined) return false;

    if(validTypes.indexOf(file.type) === -1) return false;
    
    const extReg = /^.+(\..+)$/i;

    console.log(file.name);
    const extResult = extReg.exec(file.name);
    if(extResult === null) return false;


    console.log(extResult);
    const ext = extResult[1].toLowerCase();

    if(validExt.indexOf(ext) === -1) return false;
    
    return true;
}


export async function POST(req, res){

    try{
        const sessionInfo = await getSessionInfo();
        if(sessionInfo === null) throw new Error(`You are not logged in`);


        const formData = await req.formData();
        console.log(formData);
        console.log(formData.get("file_0"));
        console.log([...formData.keys()]);

        const files = [...formData.entries()];


        const messages = [];


        for(let i = 0; i < files.length; i++){

            const file = files[i];
            console.log(file);

            if(bValidFile(file[1])){

                const buffer = Buffer.from(await file[1].arrayBuffer());

                await writeFile(`./public/images/test/${file[1].name.toLowerCase()}`, buffer);
                messages.push({"type": "pass", "content": `${file[1].name} uploaded successfully`});
                
            }else{
                console.log("NOT A VALID FILE");
                messages.push({"type": "error", "content": `${file[1].name} failed to upload because it's not an allowed filetype.`});
            }

            
        }
        //const file = formData.get("file");
        //console.log("file");
        //console.log(file);

       // const buffer = Buffer.from(await file.arrayBuffer());
       // console.log(buffer);

        //console.log();

        //const buffer = Buffer.from(await files[0].arrayBuffer());

        return Response.json({"messages": messages});
    }catch(err){

        return Response.json({"error": err.toString()});
    }
}