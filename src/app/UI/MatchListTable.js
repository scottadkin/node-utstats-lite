import { convertTimestamp, MMSS } from "../lib/generic.mjs";

export default function MatchListTable({data}){

    const rows = [];

    for(let i = 0; i < data.length; i++){

        const d = data[i];

        const date = Math.floor(new Date(d.date) * 0.001);

        rows.push(<tr key={d.id}>
            <td>{d.mapName}</td>
            <td>{d.gametypeName}</td>
            <td>{d.serverName}</td>
            <td>{convertTimestamp(date, true)}</td>
            <td>{d.players}</td>
            <td>{MMSS(d.playtime)}</td>
        </tr>);
    }

    return <>
        <table>
            <tbody>
                <tr>   
                    <th>Map</th>
                    <th>Gametype</th>
                    <th>Server</th>
                    <th>Date</th>
                    <th>Players</th>
                    <th>Playtime</th>
                </tr>
                {rows}
            </tbody>
        </table>
    </>
}