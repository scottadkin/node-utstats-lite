"use client"
import Link from "next/link";
import styles from "./MatchBox.module.css";
import Image from "next/image";
import MatchScoreBox from "./MatchScoreBox";
import { convertTimestamp, toPlaytime, plural } from "../lib/generic.mjs";

export default function MatchBox({data}){

    const finalDate = Math.floor(new Date(data.date) * 0.001);

    return <Link href={`/match/${data.id}`}>
        <div className={styles.wrapper}>
            <div className={styles.map}>
                {data.mapName}
            </div>      
            <div className={styles.gametype}>
                {data.gametypeName}
            </div>  
            <div className={styles.server}>
                {data.serverName}
            </div>  
            <Image src={`/images/maps/${data.mapImage}`} alt="image" width={360} height={202} />
            <div className={styles.info}>
                {data.players} {plural(data.players, "Player")}<br/>
                {toPlaytime(data.playtime)}<br/>
                {convertTimestamp(finalDate, false)}
            </div>
            <MatchScoreBox data={data}/>
        </div>
    </Link>
}