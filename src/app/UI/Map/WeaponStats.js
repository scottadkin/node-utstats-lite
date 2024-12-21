import { toPlaytime } from "@/app/lib/generic.mjs";
import Header from "../Header";
import InteractiveTable from "../InteractiveTable";


function renderBasicTable(data){

    const headers = {
        "name": {"title": "Name"},
        "playtime": {"title": "Playtime"}
    };

    const rows = [];

    for(let i = 0; i < data.length; i++){

        const d = data[i];
        rows.push({
            "name": {"value": d.name.toLowerCase(), "displayValue": d.name, "className": "text-left"},
            "playtime": {"value": d.total_playtime, "displayValue": toPlaytime(d.total_playtime), "className": "date"},
        });
    }

    return <InteractiveTable width={2} headers={headers} rows={rows}/>

}

export default function WeaponStats({data}){

    console.log(data);
    return <>
        <Header>Weapon Statistics</Header>
        {renderBasicTable(data)}
    </>
}