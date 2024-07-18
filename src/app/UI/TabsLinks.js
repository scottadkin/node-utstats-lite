import Link from "next/link";

export default function TabsLinks({options, selectedValue, url}){

    const elems = [];

    for(let i = 0; i < options.length; i++){

        const {display, value} = options[i];

        let className = "tab";

        if(value === selectedValue) className = "tab tab-selected";

        elems.push(<Link key={value} href={`${url}${value}`}>
            <div className={className}>{display}</div>
        </Link>);
    }

    return <div className="tabs-wrapper">
        {elems}
    </div>
}