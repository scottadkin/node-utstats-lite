import InteractiveTable from "../InteractiveTable";
import Header from "../Header";

export default function GametypeTotals({data}){

    const headers = {
        "gametype": {"title": "Gametype"},

    };
    return <>
        <Header>Gametype Totals</Header>
        <InteractiveTable headers={headers} rows={data}/>
    </>
}