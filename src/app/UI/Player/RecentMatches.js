import Header from "../Header";
import InteractiveTable from "../InteractiveTable";

export default function RecentMatches({data}){

    const headers = {
        "date": {"title": "Date"},
        "gametype": {"title": "Gametype"},
        "map": {"title": "Map"},
        "playtime": {"title": "Playtime"},
        "result": {"title": "Match Result"}
    };
    const rows = [];

    return <>
        <Header>Recent Matches</Header>
        <InteractiveTable width={1} headers={headers} rows={rows}/>
    </>
}