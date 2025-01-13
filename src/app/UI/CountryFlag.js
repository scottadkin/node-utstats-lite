import { getCountry } from "../lib/countries.mjs";
import Image from "next/image";

export default function CountryFlag({code}){

    const country = getCountry(code);

    return <div className="country-flag-wrapper">
        <Image src={`/images/flags/${country.code.toLowerCase()}.svg`} width={16} height={9} alt="flag"/>
    </div>

}