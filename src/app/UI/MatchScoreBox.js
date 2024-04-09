import styles from "./MatchScoreBox.module.css";
import { getTeamColorClass, getTeamIcon } from "../lib/generic.mjs";
import Image from "next/image";

export default function MatchScoreBox({data, small}){

    let wrapperClassName = "solo";

    if(small === undefined) small = false;
    
    if(data.total_teams === 2) wrapperClassName = "duo";
    if(data.total_teams === 3) wrapperClassName = "trio";
    if(data.total_teams === 4) wrapperClassName = "quad";

    const scoreElems = [];

    if(data.total_teams > 0){

        for(let i = 0; i < data.total_teams; i++){

            const image = (!small) ? <Image src={`/images/${getTeamIcon(i)}`} alt="image" width={32} height={32} priority={true}/> : null;

            scoreElems.push(<div key={i} className={getTeamColorClass(i)}>     
                {image}
                <div className={styles.score}>{data[`team_${i}_score`]}</div>
            </div>);
        }

    }else{

        const image = (!small) ? <Image src={`/images/${getTeamIcon(255)}`} alt="image" width={32} height={32} priority={true}/> : null;

        scoreElems.push(<div key="-1">
            {image}
            <div className={styles.score}>{data.soloWinnerName} Wins with {data.solo_winner_score}</div>
        </div>);
    }

    return <div className={`${(!small) ? styles.wrapper: ""} ${wrapperClassName}`}>
        {scoreElems}
    </div>
}