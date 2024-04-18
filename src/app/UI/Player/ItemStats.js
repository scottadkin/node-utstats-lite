"use client"
import { ignore0 } from "@/app/lib/generic.mjs";
import Header from "../Header";
import InteractiveTable from "../InteractiveTable";
import { useState } from "react";

export default function ItemStats({data, gametypeNames}){

    const [mode, setMode] = useState("0");

    const headers = {
        "gametype": {"title": "Gametype"},
        "item_boots": {"title": "Jump Boots"},
        "item_pads": {"title": "Thigh Pads"},
        "item_invis": {"title": "Invisibility"},
        "item_shp": {"title": "Super Health Pack"},
        "item_belt": {"title": "Shield Belt"},
        "item_amp": {"title": "Damage Amplifier"}
    };

    const rows = [];

    for(let i = 0; i < data.length; i++){

        const d = data[i];
        

        const name = gametypeNames[d.gametype_id] ?? "Not Found";
       

        rows.push({
            "gametype": {
                "value": name.toLowerCase(), 
                "displayValue": name,
                "className": "text-left"
            },
            "item_boots": {"value": d.item_boots, "displayValue": ignore0(d.item_boots)},
            "item_pads": {"value": d.item_pads, "displayValue": ignore0(d.item_pads)},
            "item_invis": {"value": d.item_invis, "displayValue": ignore0(d.item_invis)},
            "item_shp": {"value": d.item_shp, "displayValue": ignore0(d.item_shp)},
            "item_belt": {"value": d.item_belt, "displayValue": ignore0(d.item_belt)},
            "item_amp": {"value": d.item_amp, "displayValue": ignore0(d.item_amp)},
        });

    }


    return <>
        <Header>Item Stats</Header>
        <InteractiveTable width={1} headers={headers} rows={rows}/>
    </>
}