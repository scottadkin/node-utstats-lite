import { convertTimestamp, MMSS } from "../lib/generic.mjs";
import MatchScoreBox from "./MatchScoreBox";
import Link from "next/link";


export default function MatchListTable({data, bIgnoreMap}){

    const rows = [];


    for(let i = 0; i < data.length; i++){

        const d = data[i];

        const date = Math.floor(new Date(d.date) * 0.001);

        const url = `/match/${d.id}`;

        rows.push(<tr key={d.id}>
            {(!bIgnoreMap) ? <td><Link href={url}>{d.mapName}</Link></td> : null}
            <td><Link href={url}>{d.gametypeName}</Link></td>
            <td><Link href={url}>{d.serverName}</Link></td>
            <td className="date"><Link href={url}>{convertTimestamp(date, true)}</Link></td>
            <td><Link href={url}>{d.players}</Link></td>
            <td><Link href={url}>{MMSS(d.playtime)}</Link></td>
            <MatchScoreBox data={d} small={true} bTableElem={true}/>
        </tr>);
    }

    if(rows.length === 0){
        rows.push(<tr key={"none"}>
            <td colSpan={7}>No matches found</td>
        </tr>);
    }

    return <>
        <table className="t-width-1">
            <tbody>
                <tr>   
                    {(!bIgnoreMap) ? <th>Map</th> : null}
                    <th>Gametype</th>
                    <th>Server</th>
                    <th>Date</th>
                    <th>Players</th>
                    <th>Playtime</th>
                    <th>Result</th>
                </tr>
                {rows}
            </tbody>
        </table>
    </>
}