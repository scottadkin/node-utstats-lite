"use client"
import MatchListTable from "./MatchListTable";


export default function MatchesList({data, bIgnoreMap}){

    if(bIgnoreMap === undefined) bIgnoreMap = false;

    return <div className={`center`}>
        <MatchListTable data={data} bIgnoreMap={bIgnoreMap}/>
    </div>
}