import { getTeamColorClass } from "../lib/generic.mjs";

export default function BasicTeamScoreBox({red, blue, green, yellow}){
    
    const elems = [];

    if(red != undefined) elems.push(<div key="red" className={`basic-team-score ${getTeamColorClass(0)}`}>{red}</div>);
    if(blue != undefined) elems.push(<div key="blue" className={`basic-team-score ${getTeamColorClass(1)}`}>{blue}</div>);
    if(green != undefined) elems.push(<div key="green" className={`basic-team-score ${getTeamColorClass(2)}`}>{green}</div>);
    if(yellow != undefined) elems.push(<div key="yellow"className={`basic-team-score ${getTeamColorClass(3)}`} >{yellow}</div>);


    if(elems.length === 0) elems.push(<div>No Scores Found</div>);

    let className = "";

    if(elems.length === 2) className = "duo";
    if(elems.length === 3) className = "trio";
    if(elems.length === 4) className = "quad";


    return <div className={`basic-team-scores ${className}`}>
        {elems}
    </div>
}