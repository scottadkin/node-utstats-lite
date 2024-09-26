import Header from "./Header";
import Link from "next/link";

export default function SocialMedia({settings}){

    const discord = (settings["Discord Link"] !== "") ? <Link href={settings["Discord Link"]} target="_blank"><img src="./images/discordicon.svg" alt="discord icon" className="social-media-icon"/></Link>  : null ;
    const twitch = (settings["Twitch Link"] !== "") ? <Link href={settings["Twitch Link"]} target="_blank"><img src="./images/twitchicon.svg" alt="twitch icon" className="social-media-icon"/></Link>: null ;
    const youtube = (settings["Youtube Link"] !== "") ? <Link href={settings["Youtube Link"]} target="_blank"><img src="./images/youtubeicon.svg" alt="youtube icon" className="social-media-icon"/></Link> : null ;  

    if(discord === null && twitch === null && youtube === null) return null;

    return <div className="text-center">
        <Header>Find Us On Social Media</Header>
        {discord}
        {twitch}
        {youtube}
    </div>
}