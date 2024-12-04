"use client"
import Header from "../Header";
import { getTeamName, MMSS, getTeamColorClass, getPlayer, toPlaytime, plural } from "@/app/lib/generic.mjs";
import PlayerLink from "../PlayerLink";
import BasicMouseOver from "../BasicMouseOver";
import { useState } from "react";
import BasicTeamScoreBox from "../BasicTeamScoreBox";

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

    return <>Covered By: {elems}<br/></>;
}


function getCarryTimesElem(c, players){

    //return null;
    //if(c.carryTimes.length === 1) return null;

    const elems = [
        <span key="start">Carried By: </span>
    ];

    for(let i = 0; i < c.carryTimes.length; i++){

        const current = c.carryTimes[i];

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
                <span>{(i === 0) ? "" : ", "}<b>{player.name}</b> {toPlaytime(current.carry_time, true)}</span>
        </BasicMouseOver>);

    }

    return <>{elems}<br/></>;
}


function renderButtons(caps, capIndex, setCapIndex){

    const totalCaps = caps.length;

    return <div className="ctf-cap-buttons">
        <div className="font-small padding-1">
            Displaying Cap {capIndex + 1} Of {totalCaps}
        </div>
    
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
       
    </div>
}

function createDropElems(c){

    if(c.total_drops === 0) return null;

    return <>Dropped: {c.total_drops}{plural(c.total_drops, " Time")} for a total of {toPlaytime(c.drop_time, true)}<br/></>
}

function getCapEventList(type, c, teamId, players){

    const totals = {};

    const targetType = (type === "kills") ? "kills" : "suicides";

    const targetPlayerid = (type === "kills") ? "killerId" : "playerId"; 
    const targetTeamId = (type === "kills") ? "killerTeam" : "playerTeam";

    for(let i = 0; i < c[targetType].length; i++){

        const k = c[targetType][i];

        if(k[targetTeamId] !== teamId) continue;

        if(totals[k[targetPlayerid]] === undefined){
            totals[k[targetPlayerid]] = 0;
        }

        totals[k[targetPlayerid]]++;
    }

    const data = [];

    for(const [playerId, kills] of Object.entries(totals)){
        data.push([playerId, kills]);
    }

    data.sort((a, b) =>{
        a = a[1];
        b = b[1];

        if(a < b) return -1;
        if(a > b) return 1;
        return 0;
    });

    console.log(data);

    const elems = [];

    for(let i = 0; i < data.length; i++){

        const d = data[i];
        const player = getPlayer(players, d[0]);
        elems.push(<span key={i}>{(i > 0) ? ", " : ""}<b>{player.name}</b>({d[1]})</span>);
    }


    if(elems.length === 0) return <>No Kills Found</>;

    return <>{elems}</>
}

function createTeamFragsInfo(players, c, totalTeams, type){


    //TODO: Hover displays mouse over with player names with total kills/suicides
    const elems = [];

    let red,blue,green,yellow,string;

    if(type === "kills"){

        red = c.red_kills;
        blue = c.blue_kills;
        green = c.green_kills;
        yellow = c.yellow_kills;
        string = "Kill";

    }else if(type === "suicides"){
        red = c.red_suicides;
        blue = c.blue_suicides;
        green = c.green_suicides;
        yellow = c.yellow_suicides;
        string = "Suicide";
    }

    console.log(c);

    const mouseOverTitle = "Team Kill List";

    elems.push(<BasicMouseOver key="red" title={mouseOverTitle} content={getCapEventList(type, c, 0, players)}>
        <div className="team-red ctf-cap-frags">
            {red} {plural(red, string)}
        </div>
    </BasicMouseOver>);

    elems.push(<BasicMouseOver key="blue" title={mouseOverTitle} content={getCapEventList(type, c, 1, players)}>
        <div className="team-blue ctf-cap-frags">{blue} {plural(blue, string)}</div>
    </BasicMouseOver>);

    if(totalTeams > 2){

        elems.push(<BasicMouseOver key="green" title={mouseOverTitle} content={getCapEventList(type, c, 2, players)}>
            <div className="team-green ctf-cap-frags">{green} {plural(green, string)}</div>
        </BasicMouseOver>);
    }

    if(totalTeams > 3){
        elems.push(<BasicMouseOver key="yellow" title={mouseOverTitle} content={getCapEventList(type, c, 3, players)}>
            <div className="team-yellow ctf-cap-frags">{yellow} {plural(yellow, string)}</div>
        </BasicMouseOver>);
    }


    let className = "duo";
    if(totalTeams === 3){
        className = "trio";
    }else if(totalTeams === 4){
        className = "quad";
    }

    return <div className={className}>{elems}</div>
}

export default function CTFCaps({caps, totalTeams, players}){


    const [capIndex, setCapIndex] = useState(0);

    const scores = Array(totalTeams).fill(0);

    console.log(caps);

    const elems = [];

    for(let i = 0; i < caps.length; i++){

        const c = caps[i];

        scores[c.capping_team]++;

        if(i !== capIndex) continue;

        const takenPlayer = getPlayer(players, c.taken_player);
        const capPlayer = getPlayer(players, c.cap_player);

        elems.push(
            <div className={`ctf-cap ${getTeamColorClass(c.capping_team)}`} key={i}>
                <BasicTeamScoreBox totalTeams={totalTeams} red={scores[0]} blue={scores[1]} green={scores[2]} yellow={scores[3]}/><br/>
                <PlayerLink id={c.cap_player} country={capPlayer.country}>{capPlayer.name}</PlayerLink>&nbsp;
                Captured The {getTeamName(c.flag_team)} Flag&nbsp; <span className="yellow-font">{toPlaytime(c.cap_time, true)}</span>
                <div className="cap-info">
                    Taken By: <b>{takenPlayer.name}</b> @ {MMSS(c.taken_timestamp)}, Capped by <b>{capPlayer.name}</b> @ {MMSS(c.cap_timestamp)}<br/>
                    {getCarryTimesElem(c, players)}
                    {createCoverElems(c, players)}
                    {createDropElems(c)}
                </div>
                {createTeamFragsInfo(players, c, totalTeams, "kills")}
                {createTeamFragsInfo(players, c, totalTeams, "suicides")}
                
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