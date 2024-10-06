import Header from "../Header";
import { convertTimestamp, toPlaytime } from "@/app/lib/generic.mjs";

export default function BasicSummary({info}){

    return <>
        <Header>Basic Summary</Header>
        <table className="t-width-1">
            <tbody>
                <tr>
                    <th>First Match</th>
                    <th>Last Match</th>
                    <th>Matches Played</th>
                    <th>Playtime</th>    
                </tr>
                <tr>
                    <td className="date">{convertTimestamp(new Date(info.first_match) * 0.001, true)}</td>
                    <td className="date">{convertTimestamp(new Date(info.last_match * 0.001), true)}</td>
                    <td>{info.matches}</td>
                    <td className="date">{toPlaytime(info.playtime)}</td>
                </tr>
            </tbody>
        </table>
    </>
}