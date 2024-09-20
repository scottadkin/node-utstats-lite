import Image from "next/image";
import Link from "next/link";
import styles from "./MatchRichBox.module.css";
import { convertTimestamp, toPlaytime } from "../lib/generic.mjs";
import MatchScoreBox from "./MatchScoreBox";

export default function MatchesBoxView({data}){

    return <Link href={`/match/${data.id}`}>
        <div className={styles.wrapper}>
            <div className={styles.title}>{data.mapName}</div>
            <div>
                <Image src={`/images/maps/${data.mapImage}`} alt="map-sshot" width={350} height={197}/>
            </div>
            <div className={styles.info}>
                <div className={styles.white}>
                    {data.gametypeName}
                </div>
                {convertTimestamp(Math.floor(new Date(data.date) * 0.001), true)}
            
                <div className={styles.white}>
                    {data.players} Player{(data.players !== 1) ? "s" : ""}
                </div>
            
              {toPlaytime(data.playtime)}
            
            </div>
            <MatchScoreBox data={data}/>
        </div>
    </Link>
}