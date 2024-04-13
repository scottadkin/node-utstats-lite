import { convertTimestamp, MMSS } from "../lib/generic.mjs";
import MatchScoreBox from "./MatchScoreBox";
import Link from "next/link";


export default function MatchListTable({data}){

    const rows = [];

    for(let i = 0; i < data.length; i++){

        const d = data[i];

        const date = Math.floor(new Date(d.date) * 0.001);

        const url = `/match/${d.id}`;

        rows.push(<tr key={d.id}>
            <td><Link href={url}>{d.mapName}</Link></td>
            <td><Link href={url}>{d.gametypeName}</Link></td>
            <td><Link href={url}>{d.serverName}</Link></td>
            <td><Link href={url}>{convertTimestamp(date, true)}</Link></td>
            <td><Link href={url}>{d.players}</Link></td>
            <td><Link href={url}>{MMSS(d.playtime)}</Link></td>
            <td>
                <MatchScoreBox data={d} small={true}/>
            </td>
        </tr>);
    }

    return <>
        <table className="t-width-1">
            <tbody>
                <tr>   
                    <th>Map</th>
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