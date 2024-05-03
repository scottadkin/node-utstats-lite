import Screenshot from "../Screenshot";
import Header from "../Header";

export default function MatchScreenshot({data}){

    return <div className="text-center margin-bottom-1">
        <Header>Match Screenshot</Header>
        <Screenshot data={data}/>
    </div>
}