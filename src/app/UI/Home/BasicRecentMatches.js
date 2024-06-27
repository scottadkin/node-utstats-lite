import Header from "../Header";
import MatchList from "../MatchList";

export default function BasicRecentMatches({data}){

    return <>
        <Header>Recent Matches</Header>
        <MatchList data={data}/>
    </>
}