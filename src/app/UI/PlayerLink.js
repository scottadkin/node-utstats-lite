import Link from "next/link";
import CountryFlag from "./CountryFlag";

export default function PlayerLink({id, country, children, bNewTab}){

    if(bNewTab === undefined) bNewTab = false;

    return <Link href={`/player/${id}`} target={`${bNewTab} ? "_blank" : ""`}>
        <CountryFlag code={country}/>
        {children}
    </Link>
}