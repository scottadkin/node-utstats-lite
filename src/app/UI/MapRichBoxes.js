import MapRichBox from "./MapRichBox";
export default function MapRichBoxes({data, images}){

    const elems = [];

    for(let i = 0; i < data.length; i++){

        const d = data[i];

        let image = images[d.name.toLowerCase()];

        if(image === undefined) image = "default.jpg";

        elems.push(<MapRichBox key={i} data={d} image={image}/>);
    }

    return <div className="rich-outter">
        {elems}
    </div>
    
}