"use client"
import Header from "../Header";
import { getTeamName, MMSS, getTeamColorClass, getPlayer, toPlaytime } from "@/app/lib/generic.mjs";
import PlayerLink from "../PlayerLink";
import BasicMouseOver from "../BasicMouseOver";
import { useState } from "react";

function createCoverElems(c, players){

    const elems = [];

    const covers = c.covers;

    const playerTotalCovers = [];

    for(const [playerId, timestamps] of Object.entries(covers)){

        playerTotalCovers.push({"playerId": playerId, "timestamps": timestamps.length});
    }

    playerTotalCovers.sort((a, b) =>{

        a = a.timestamps;
        b = b.timestamps;
        if(a > b) return -1;
        if(a < b) return 1;
        return 0;
    });

    for(let i = 0; i < playerTotalCovers.length; i++){

        const p = playerTotalCovers[i];


        const timestamps = covers[p.playerId];

        const player = getPlayer(players, parseInt(p.playerId));

        let timestampString = ``;

        for(let i = 0; i < timestamps.length; i++){

            timestampString += `${(i === 0) ? "" : ", " }${MMSS(timestamps[i])}`
        }


        elems.push(<span key={p.playerId}>
            {(elems.length === 0) ? "" : ", "}
            <BasicMouseOver 
                content={<span className="date">{timestampString}</span>} 
                title="Cover Timestamps">
                    <b>{player.name}</b> ({timestamps.length})
            </BasicMouseOver>
        </span>);

    }


    if(elems.length === 0) return null;

    return <>Covered By: {elems}</>;
}


function getCarryTimesElem(c, players){

    //if(c.carryTimes.length === 1) return null;

    const elems = [
        <>Carried By: </>
    ];

    for(let i = 0; i < c.carryTimes.length; i++){

        const current = c.carryTimes[i];
        console.log(current);

        //TODO: add mouse over elem to display timestamps of pickedup and dropped

        const player = getPlayer(players, current.player_id);


       elems.push(<BasicMouseOver key={i}
            content={
                <span className="date">
                    Picked Up: <span className="white">{MMSS(current.start_timestamp)}</span>,
                    {(i === c.carryTimes.length - 1) ? ` Capped` : ` Dropped`} <span className="white">{MMSS(current.end_timestamp)}</span>
                </span>
            } 
            title="Carry Info">
                <span key={i}>{(i === 0) ? "" : ", "}<b>{player.name}</b> {toPlaytime(current.carry_time, true)}</span>
        </BasicMouseOver>);

        //elems.push(<span key={i}>{(i === 0) ? "" : ", "}<b>{player.name}</b> {toPlaytime(current.carry_time, true)}</span>);
    }

    return <>{elems}<br/></>;
}


function renderButtons(caps, capIndex, setCapIndex){

    const totalCaps = caps.length;
    console.log(caps);


    return <>
        <div className="small-button"  onClick={() =>{
            setCapIndex((capIndex) => {
                if(capIndex - 1 < 0) return capIndex;
                return capIndex - 1;
            });
        }}>Previous</div>
        <div className="small-button" onClick={() =>{
            setCapIndex((capIndex) => {
                if(capIndex + 1 >= totalCaps) return capIndex;

                return capIndex + 1;
            });
        }}>Next</div>
        <div className="small-info">
            Displaying Cap {capIndex + 1} Of {totalCaps}
        </div>
       
    </>
}

export default function CTFCaps({caps, totalTeams, players}){


    const [capIndex, setCapIndex] = useState(0);

    const scores = Array(totalTeams).fill(0);

    console.log(caps);

    const elems = [];

    for(let i = 0; i < caps.length; i++){

        const c = caps[i];

        scores[c.capping_team]++;

        const takenPlayer = getPlayer(players, c.taken_player);
        const capPlayer = getPlayer(players, c.cap_player);

        elems.push(
            <div className={`ctf-cap ${getTeamColorClass(c.capping_team)}`} key={i}>
                <PlayerLink id={c.cap_player} country={capPlayer.country}>{capPlayer.name}</PlayerLink>&nbsp;
                Captured The {getTeamName(c.flag_team)} Flag&nbsp;
                <div className="cap-info">
                    Taken By: <b>{takenPlayer.name}</b> @ {MMSS(c.taken_timestamp)}, Capped by <b>{capPlayer.name}</b> @ {MMSS(c.cap_timestamp)}<br/>
                    {getCarryTimesElem(c, players)}
                    {createCoverElems(c, players)}
                </div>
                <div className="cap-scores">
                    {scores.join(" - ")}
                </div>
            </div>
        );

    }

    return <>
        <Header>CTF Caps</Header>
        <div className="ctf-caps">
            {renderButtons(caps, capIndex, setCapIndex)}
            {elems}
        </div>
    </>
}