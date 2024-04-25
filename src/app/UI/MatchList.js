"use client"
import MatchBox from "./MatchBox";
import styles from "./MatchList.module.css";
import MatchListTable from "./MatchListTable";


export default function MatchesList({data}){


    console.log(data);

    return <div className={`center ${styles.wrapper}`}>
        <MatchListTable data={data}/>
        {/*data.map((m, i) =>{
            return <MatchBox 
                key={i}
                data={m} 
            />
        })*/}
    </div>
}