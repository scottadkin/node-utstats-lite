"use client"
import MatchBox from "./MatchBox";
import styles from "./MatchList.module.css"


export default function MatchesList({data}){

    data = JSON.parse(data);

    return <div className={`center ${styles.wrapper}`}>

        {data.map((m, i) =>{
            return <MatchBox 
                key={i}
                data={m} 
            />
        })}
    </div>
}