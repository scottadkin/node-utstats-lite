export default function PerPageDropDown({selectedValue, setValue}){

    const valid = [5, 10, 15, 20, 25, 50, 75, 100];

    return <select value={selectedValue} onChange={(e) =>{
        setValue(e.target.value);
    }}>
        {valid.map((v) =>{
            return <option key={v} value={v}>{v}</option>
        })}
    </select>
}