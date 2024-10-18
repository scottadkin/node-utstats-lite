import Header from "../Header";
import Link from "next/link";


export default function JSONInfo({matchId}){

    return <div className="text-center margin-bottom-1">
        <Header>JSON API Links</Header>
        <Link target="_blank" href={`/api/json/match?id=${matchId}&mode=basic`}>
            <div className="json-link">
                <div className="json-title">Basic Info,</div>
            </div>
        </Link>
        <Link target="_blank" href={`/api/json/match?id=${matchId}&mode=players`}>
            <div className="json-link">
                <div className="json-title">Player Stats,</div>
            </div>
        </Link>
        <Link target="_blank" href={`/api/json/match?id=${matchId}&mode=kills-detailed`}>
            <div className="json-link">
                <div className="json-title">Detailed Kills,</div>
            </div>
        </Link>
        <Link target="_blank" href={`/api/json/match?id=${matchId}&mode=kills-basic`}>
            <div className="json-link">
                <div className="json-title">Basic Kills</div>
            </div>
        </Link>
    </div>
}