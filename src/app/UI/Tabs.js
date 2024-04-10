import styles from "./Tabs.module.css";

export default function Tabs({options, selectedValue, changeSelected}){

    if(options === undefined) return null;
    if(selectedValue === undefined) selectedValue = "";

    const elems = [];

    for(let i = 0; i < options.length; i++){

        const o = options[i];
 
        let currentClass = styles.tab;

        if(o.value.toLowerCase() === selectedValue.toLowerCase()){
            currentClass += ` ${styles.selected}`;
        }

        elems.push(<div className={currentClass} onClick={() =>{
            changeSelected(o.value);
        }}>
            {o.name}
        </div>);
    }

    return <div className={styles.wrapper}>
        {elems}
    </div>
}