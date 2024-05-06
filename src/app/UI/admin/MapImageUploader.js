"use client"
import Header from "../Header";


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

            <div className="form-row">
                <label>Choose Files</label>
                <input type="file" name="file" id="file" multiple={true}/>
            </div>
            <input type="submit" className="submit-button" value="Upload Images"/>
        </form>
    </>
}