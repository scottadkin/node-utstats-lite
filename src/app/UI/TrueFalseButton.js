export default function TrueFalseButton({value, setValue, bTableElem}){

    if(bTableElem === undefined) bTableElem = false;

    let text = "False";

    if(value){
        text = "True";
    }

    if(bTableElem){
        return <td className={`tf-button ${text.toLowerCase()} text-center`} onClick={setValue}>
            {text}
        </td>
    }

    return <div className={`tf-button ${text.toLowerCase()} text-center`} onClick={setValue}>
        {text}
    </div>
}