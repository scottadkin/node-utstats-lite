"use server"
import { getPlayersList } from "../lib/players.mjs";
import Header from "../UI/Header";
import CountryFlag from "../UI/CountryFlag";
import { convertTimestamp, ignore0, toPlaytime } from "../lib/generic.mjs";
import SearchForm from "../UI/Players/SearchForm";
import Link from "next/link";


export default async function Page({params, searchParams}) {


    //click on headers should be a link to search result ordered by that column

    
    const players = await getPlayersList();


    const rows = [];

    for(let i = 0; i < players.length; i++){

        const p = players[i];

        const active = Math.floor(new Date(p.last_active) * 0.001);


        rows.push(<tr key={p.id}>
            <td className="player-name-td text-left">
                <><CountryFlag code={p.country}/>{p.name}</>
            </td>
            <td className="font-small">
                {convertTimestamp(active, true)}
            </td>
            <td>{ignore0(p.score)}</td>
            <td>{ignore0(p.frags)}</td>
            <td>{ignore0(p.kills)}</td>
            <td>{ignore0(p.deaths)}</td>
            <td>{ignore0(p.suicides)}</td>
            <td>{p.eff.toFixed(2)}&#37;</td>
            <td>{p.matches}</td>
            <td className="font-small">{toPlaytime(p.playtime)}</td>
        </tr>);
    }

    return <div>
        <Header>Player List</Header>
        <SearchForm />
        <table className="t-width-1">
            <tbody>
                <tr>
                    <th><Link href={`/players/?sortby=name`}>Name</Link></th>
                    <th><Link href={`/players/?sortby=active`}>Last Active</Link></th>
                    <th><Link href={`/players/?sortby=score`}>Score</Link></th>
                    <th><Link href={`/players/?sortby=frags`}>Frags</Link></th>
                    <th><Link href={`/players/?sortby=kills`}>Kills</Link></th>
                    <th><Link href={`/players/?sortby=deaths`}>Deaths</Link></th>
                    <th><Link href={`/players/?sortby=suicides`}>Suicides</Link></th>
                    <th><Link href={`/players/?sortby=eff`}>Eff</Link></th>
                    <th><Link href={`/players/?sortby=matches`}>Matches</Link></th>
                    <th><Link href={`/players/?sortby=playtime`}>Playtime</Link></th>
                </tr>
                {rows}
            </tbody>
        </table>
        
    </div>
}