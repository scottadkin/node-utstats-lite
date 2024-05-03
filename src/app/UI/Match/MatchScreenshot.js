import Screenshot from "../Screenshot";
import Header from "../Header";

export default function MatchScreenshot({basic, players}){

    return <div className="text-center margin-bottom-1">
        <Header>Match Screenshot</Header>
        <Screenshot basic={basic} players={players}/>
    </div>
}