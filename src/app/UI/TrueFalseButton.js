export default function TrueFalseButton({value, setValue}){

    let text = "False";

    if(value){
        text = "True";
    }

    return <div className={`tf-button ${text.toLowerCase()}`} onClick={setValue}>
        {text}
    </div>
}