import Header from "./Header";

export default function WelcomeMessage({settings}){

    const title =  settings["Welcome Title"] || "";
    let message = settings["Welcome Message"] || "";

    if(title === "" || message === "") return;
    
    return <div>
        <Header>{title}</Header>
        <div className="welcome-message">
            {message}
        </div>
    </div>
}