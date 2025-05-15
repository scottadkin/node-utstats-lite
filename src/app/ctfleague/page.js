import Header from "../UI/Header";
import TabsLinks from "../UI/TabsLinks";
import { getUniqueGametypeLeagues, getUniqueMapLeagues, getLeagueCategorySettings, getGametypesTopX } from "../lib/ctfLeague.mjs";
import { getGametypeNames } from "../lib/gametypes.mjs";
import { getMapNames } from "../lib/maps.mjs";
import { DefaultGametypeDisplay } from "../UI/CTFLeague/DefaultGametypeDisplay";

export default async function Page({params, searchParams}){

    const p = await params;
    const sp = await searchParams;

    let mode = sp.mode ?? "";

    if(mode === "") mode = "gametypes";

    mode = mode.toLowerCase();

    const gametypeIds = await getUniqueGametypeLeagues();
    const gametypeNames = await getGametypeNames(gametypeIds, true);


    const mapIds = await getUniqueMapLeagues();
    const mapNames = await getMapNames(mapIds);
   

    const gametypeSettings = await getLeagueCategorySettings("gametypes");
    const mapSettings = await getLeagueCategorySettings("maps");

    const tabs = [
        {"display": "Gametypes", "value": "gametypes"},
        {"display": "Maps", "value": "maps"}
    ];

    let data = null;

    const elems = [];

    if(mode === "gametypes"){

        data = await getGametypesTopX(gametypeIds, 10);

        elems.push(<DefaultGametypeDisplay data={data} names={gametypeNames} key="d-gametypes" />);
    }

    return <main>
        <Header>CTF League</Header>
        <TabsLinks options={tabs} url={`/ctfleague?mode=`} selectedValue={mode}/>
        <div className="info">Display league settings here</div>
        {elems}
    </main>
}