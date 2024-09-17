
"use client"
import Header from "@/app/UI/Header";
import MatchScoreBox from "@/app/UI/MatchScoreBox";
import styles from "./BasicInfo.module.css";
import { convertTimestamp, plural, toPlaytime } from "@/app/lib/generic.mjs";
import Mutators from "./Mutators";
import PermaLink from "../PermaLink";

export default function BasicInfo({matchData}){

    const basic = matchData.basic;

    const date = Math.floor(new Date(basic.date) * 0.001);

    const targetScore = (basic.target_score === 0) ? null : <><span className={"dull"}>Target Score</span> {basic.target_score}<br/></>;
    const timeLimit = (basic.time_limit === 0) ? null : <><span className={"dull"}>Time Limit</span> {basic.time_limit} {plural(basic.time_limit, "Minute")}<br/></>;

    return <>
        <Header>Match Report</Header> 
        <div className={styles.wrapper}>
        <MatchScoreBox data={matchData.basic}/>
            <div className={styles.info}>
                
                {convertTimestamp(date)}<br/>
                {basic.gametypeName} <span className={"dull"}>on</span> {basic.mapName}<br/>
                {basic.players} {plural(basic.players, "Player")}<br/>
                <span className={"dull"}>Match Length</span> {toPlaytime(basic.playtime)}<br/>
                <span className={"dull"}>Server</span> {basic.serverName}<br/>
                {targetScore}
                {timeLimit}
                <Mutators data={basic.mutators}/>
            </div>
            <PermaLink url={`/match/${matchData.basic.hash}`} />
        </div>
    </>
}