"use client"
import Header from "../Header";
import { getMapImageName } from "@/app/lib/generic.mjs";


export default function MapImageUploader({}){
    

    return <>
        <Header>Map Image Uploader</Header>
        <form className="form" onSubmit={async (e) =>{
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

            console.log(res);

        }}>
            <div className="info">
                When bulk image uploading you have to manually name the image files, the uploader will remove certain characters.<br/> 
                If you use a single file upload the image is automatically named so the website can use it.<br/>
                Names should all be lowercase(website will automatically do that anyway), and should not contain &#91; &#93; &apos; &#96;<br/><br/>
                <b>Example:</b>
                To manually name a jpg image for the map CTF-Face, name an image file face.jpg, you do not need to include the gametype prefix.
                <br/><br/>
                Allowed file types, .jpg, .jpeg, .png, .gif, .bmp.<br/><br/>
                <span className="red-font">You need to rebuild the website after uploading all your images for the website to be able to display them.</span>
            </div>
            <Header>Bulk Image Uploader</Header>
            <div className="form-row">
                <label>Choose Files</label>
                <input type="file" name="file" id="file" multiple={true} accept=".jpg,.jpeg,.png,.bmp,.gif"/>
            </div>
            <input type="submit" className="submit-button" value="Upload Images"/>
        </form>
    </>
}