"use client"
import Header from "../Header";
import { getMapImageName } from "@/app/lib/generic.mjs";
import { useEffect, useReducer } from "react";
import ErrorBox from "../ErrorBox";

const acceptFiles = ".jpg,.jpeg,.png,.bmp,.gif";

async function loadData(dispatch){

    try{

        const req = await fetch("/api/admin?mode=get-map-images");
        const res = await req.json();

        if(res.error !== undefined) throw new Error(res.error);

        dispatch({"type": "loaded", "images": res.images, "names": res.mapNames});

    }catch(err){
        console.trace(err);
        dispatch({"type": "error", "message": err.toString()});
    }
}

function reducer(state, action){

    switch(action.type){
        case "loaded": {
            return {
                ...state,
                "names": action.names,
                "images": action.images
            }
        }
        case "error": {
            return {
                ...state,
                "error": action.message
            }
        }
    }
    return state;
}


async function uploadSingle(dispatch, fileName, e){

    try{

        e.preventDefault();

        const formData = new FormData();

        formData.append(fileName, e.target.file.files[0]);

        const req = await fetch("/api/admin/imageUploader", {
            "method": "POST",
            "body": formData
        });

        const res = await req.json();

        if(res.error !== undefined) throw new Error(res.error);

        await loadData(dispatch);

        e.target.reset();
        
    }catch(err){
        console.trace(err);
        dispatch({"type": "error", "message": err.toString()});
    }
}

function getFileStatus(images, targetFile){

    const imageIndex = images.indexOf(`${targetFile}.jpg`)

    if(imageIndex !== -1) return <td className="team-green">Found</td>;

    const stripExtReg = /^(.+)\..+$/i;

    for(let i = 0; i < images.length; i++){

        const img = images[i];

        const eResult = stripExtReg.exec(img);

        if(eResult === null) continue;

        //console.log(eResult);
        const sIndex = targetFile.indexOf(eResult[1]);

        if(sIndex !== -1){

            return <td className="team-yellow font-small">Partial Match<br/>({img})</td>
        }
    }

    return <td className="team-red">Missing</td>
}

function renderSingleUploads(state, dispatch){

    const rows = [];

    for(let i = 0; i < state.names.length; i++){

        const n = state.names[i];

        const cleanName = getMapImageName(n.name)

        rows.push(<tr key={i}>
            <td className="text-left">{n.name}</td>
            <td>{cleanName}.jpg</td>
            {getFileStatus(state.images, cleanName)}
            <td>
                <form onSubmit={(e) =>{
                    uploadSingle(dispatch, cleanName, e);
                }}>
                    <input type="file" name="file" accept={acceptFiles}/>
                    <input type="submit" value="Upload Image" />
                </form>
            </td>
        </tr>);
    }
    return <table className="t-width-1">
        <tbody>
            <tr>
                <th>Name</th>
                <th>Required File</th>
                <th>File Status</th>
                <th>Action</th>
            </tr>
            {rows}
        </tbody>
    </table>
}

export default function MapImageUploader({}){
    
    const [state, dispatch] = useReducer(reducer, {
        "names": [],
        "images": [],
        "error": null
    });

    useEffect(() =>{

        loadData(dispatch);

    }, []);

    return <>
        <Header>Map Image Uploader</Header>
        <form className="form margin-bottom-1" onSubmit={async (e) =>{
            e.preventDefault();
            console.log(e);
            console.log(e.target.file.files);

            const formData = new FormData();
            //formData.append("file", e.target.file.files[0]);


            let i = 0;
            for(const file of e.target.file.files){
                console.log(file);
                formData.append(`file_${i}`, file);
                i++;
            }


            const req = await fetch("/api/admin/imageUploader", {
                "method": "POST",
                "body": formData
            });

            const res = await req.json();
            await loadData(dispatch);

            e.target.reset();

            console.log(res);

        }}>
            <div className="info">
                When bulk image uploading you have to manually name the image files, the uploader will remove certain characters.<br/> 
                If you use a single file upload the image is automatically named so the website can use it.<br/>
                Names should all be lowercase(website will automatically do that anyway), and should not contain &#91; &#93; &apos; &#96;<br/><br/>
                <b>Example: </b>
                To manually name a jpg image for the map CTF-Face, name an image file face.jpg, you do not need to include the gametype prefix.<br/>
                If you have multiple different version of the same map e.g CTF-Face, CTF-Face-LE100, CTF-Another-Face, the website will fallback and find a partial match for an image an use face.jpg.
                <br/><br/>
                Allowed file types, .jpg, .jpeg, .png, .gif, .bmp.<br/><br/>
                <span className="red-font">You need to rebuild the website after uploading all your images for the website to be able to display them.</span>
            </div>
            <Header>Bulk Image Uploader</Header>
            <div className="form-row">
                <label>Choose Files</label>
                <input type="file" name="file" id="file" multiple={true} accept={acceptFiles}/>
            </div>
            <input type="submit" className="submit-button" value="Upload Images"/>
        </form>
        <ErrorBox title="Error">{state.error}</ErrorBox>
        <Header>
            Single Map Uploads
        </Header>
        {renderSingleUploads(state, dispatch)}
    </>
}