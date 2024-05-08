export default function Mutators({data}){

    if(data.length === 0) return null;

    return <>
        <span className="dull">Mutators</span> <span className="font-small">{data}</span>
    </>

}