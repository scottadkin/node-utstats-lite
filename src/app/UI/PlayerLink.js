import Link from "next/link";
import CountryFlag from "./CountryFlag";

export default function PlayerLink({id, country, children}){

    return <Link href={`/player/${id}`}>
        <CountryFlag code={country}/>
        {children}
    </Link>
}