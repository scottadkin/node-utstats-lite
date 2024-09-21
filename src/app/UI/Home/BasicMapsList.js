import Header from "../Header";
import MapRichBoxes from "../MapRichBoxes";

export default function BasicMapsList({data, images}){


    return <>
        <Header>Most Played Maps</Header>
        <MapRichBoxes data={data} images={images}/>
    </>
}