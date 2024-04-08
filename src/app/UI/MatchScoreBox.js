import styles from "./MatchScoreBox.module.css";
import { getTeamColorClass, getTeamIcon } from "../lib/generic.mjs";
import Image from "next/image";

export default function MatchScoreBox({data}){

    let wrapperClassName = styles.solo;
    
    if(data.total_teams === 2) wrapperClassName = styles.duo;
    if(data.total_teams === 3) wrapperClassName = styles.trio;
    if(data.total_teams === 4) wrapperClassName = styles.quad;

    const scoreElems = [];

    if(data.total_teams > 0){

        for(let i = 0; i < data.total_teams; i++){

            scoreElems.push(<div key={i} className={getTeamColorClass(i)}>
                <Image src={`/images/${getTeamIcon(i)}`} alt="image" width={32} height={32} priority={true}/><br/>
                <div className={styles.score}>{data[`team_${i}_score`]}</div>
            </div>);
        }
    }else{

        scoreElems.push(<div key="-1">
            <Image src={`/images/${getTeamIcon(255)}`} alt="image" width={32} height={32} priority={true}/><br/>
            {data.soloWinnerName} Wins with {data.solo_winner_score}
        </div>);
    }

    return <div className={`${styles.wrapper} ${wrapperClassName}`}>
        {scoreElems}
    </div>
}