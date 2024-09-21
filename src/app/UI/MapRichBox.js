import Image from "next/image";
import Link from "next/link";
import { toPlaytime, convertTimestamp } from "../lib/generic.mjs";

export default function MapRichBox({data, image}){

    return <Link href={`/map/${data.id}`}>
        <div className="rich-wrapper">
            <div className="rich-title">{data.name}</div>
            <div className="rich-image">
                <Image src={`/images/maps/${image}`} alt="image" width="350"  height="197" />
            </div>
            <div className="rich-info">
                {data.matches} Match{(data.matches !== 1) ? "es" : "" } Played<br/>
                Playtime {toPlaytime(data.playtime)}<br/>
                Last Match {convertTimestamp(data.last_match, true, false, true)}
            </div>
        </div>
    </Link>
}