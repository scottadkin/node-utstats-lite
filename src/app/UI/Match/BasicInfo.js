
"use client"
import Header from "@/app/UI/Header";
import MatchScoreBox from "@/app/UI/MatchScoreBox";
import styles from "./BasicInfo.module.css";
import { convertTimestamp, plural, toPlaytime } from "@/app/lib/generic.mjs";

export default function BasicInfo({matchData}){

    const basic = matchData.basic;

    const date = Math.floor(new Date(basic.date) * 0.001);

    return <>
        <Header>Match Report</Header> 
        <div className={styles.wrapper}>
        
        <div className={styles.info}>
            {convertTimestamp(date)}<br/>
            {basic.gametypeName} <span className={styles.dull}>on</span> {basic.mapName}<br/>
            {basic.players} {plural(basic.players, "Player")}<br/>
            <span className={styles.dull}>Match Length</span> {toPlaytime(basic.playtime)}<br/>
            <span className={styles.dull}>Server</span> {basic.serverName}
        </div>
		<MatchScoreBox data={matchData.basic}/>
        </div>
    </>
}