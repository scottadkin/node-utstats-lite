import MatchRichBox from "./MatchRichBox";

export default function MatchesBoxView({data}){
 
    const elems = [];

    for(let i = 0; i < data.length; i++){

        const d = data[i];

        elems.push(
            <MatchRichBox key={i} data={d}/>
        );
    }

    return <div className="rich-outter">
        {elems}
    </div>
}