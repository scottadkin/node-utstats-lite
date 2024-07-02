"use client"
import MatchBox from "./MatchBox";
import styles from "./MatchList.module.css";
import MatchListTable from "./MatchListTable";


export default function MatchesList({data, bIgnoreMap}){

    if(bIgnoreMap === undefined) bIgnoreMap = false;

    return <div className={`center ${styles.wrapper}`}>
        <MatchListTable data={data} bIgnoreMap={bIgnoreMap}/>
    </div>
}