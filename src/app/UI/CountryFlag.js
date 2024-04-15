import { getCountry } from "../lib/countries.mjs";
import Image from "next/image";
import styles from "./CountryFlag.module.css";

export default function CountryFlag({code}){

    const country = getCountry(code);

    return <div className={styles.wrapper}>
        <Image src={`/images/flags/${country.code.toLowerCase()}.svg`} width={16} height={9} alt="flag"/>
    </div>

}