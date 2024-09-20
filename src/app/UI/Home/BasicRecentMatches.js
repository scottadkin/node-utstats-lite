import Header from "../Header";
import MatchesBoxView from "../MatchesBoxView";

export default function BasicRecentMatches({data}){

    return <>
        <Header>Recent Matches</Header>
        <MatchesBoxView data={data}/>
    </>
}