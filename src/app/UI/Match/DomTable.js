"use client";
import Header from "../Header";
import InteractiveTable from "../InteractiveTable";

export default function DomTable({data, players}){

    console.log(data);

    const headers = {
        "player": {"title": "Player"}
    };

    for(const pointName of Object.values(data.controlPoints)){

        headers[`cp_${pointName}`] = {"title": pointName}
    }

    return <>
        <Header>Domination Summary</Header>
        <InteractiveTable headers={headers} rows={[]}/>
    </>
}