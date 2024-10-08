import Header from "./Header";
import BBParser from "../lib/BBParser";


export default function WelcomeMessage({settings, bDisplay}){

    if(bDisplay === "0") return null;

    const title =  settings["Welcome Title"] || "";
    let message = settings["Welcome Message"] || "";

    if(title === "" || message === "") return;

    message = BBParser(message);

    return <div>
        <Header>{title}</Header>
        <div className="welcome-message">
            <div dangerouslySetInnerHTML={{"__html": message}}></div>
        </div>
    </div>
}