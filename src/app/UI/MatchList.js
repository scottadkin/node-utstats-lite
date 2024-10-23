"use client"
import dynamic from "next/dynamic";
//import MatchListTable from "./MatchListTable";
const MatchListTable = dynamic(() => import("./MatchListTable"), {
    ssr: false
  });


export default function MatchesList({data, bIgnoreMap}){

    if(bIgnoreMap === undefined) bIgnoreMap = false;

    return <div className={`center`}>
        <MatchListTable data={data} bIgnoreMap={bIgnoreMap}/>
    </div>
}