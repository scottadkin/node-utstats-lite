
import Header from "../Header";
import GenericTable from "./GenericTable";

export default function DefaultGametypeDisplay({data, names}){

    const elems = [];

    for(const [typeId, entries] of Object.entries(data.data)){

        const id = parseInt(typeId);


        elems.push(<div key={id}>
            <Header>{names[id] ?? "Not Found"}</Header>
            <GenericTable title={names[id] ?? "Not Found"} data={entries} playerNames={data.playerNames}/>
        </div>);
    }

    return <>
        {elems}
    </>
}