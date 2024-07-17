export default function Tabs({options, selectedValue, changeSelected}){

    if(options === undefined) return null;
    if(selectedValue === undefined) selectedValue = "";

    const elems = [];

    for(let i = 0; i < options.length; i++){

        const o = options[i];
 
        let currentClass = "tab";

        if(o.value.toLowerCase() === selectedValue.toLowerCase()){
            currentClass += ` tab-selected`;
        }

        elems.push(<div key={i} className={currentClass} onClick={() =>{
            changeSelected(o.value);
        }}>
            {o.name}
        </div>);
    }

    return <div className="tabs-wrapper">
        {elems}
    </div>
}