import Header from "./Header";

export default function WelcomeMessage({settings}){

    return <div>
        <Header>{settings["Welcome Title"]}</Header>
        <div className="welcome-message">
            {settings["Welcome Message"]}
        </div>
    </div>
}