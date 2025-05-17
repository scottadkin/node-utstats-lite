import Header from "../UI/Header";
import TabsLinks from "../UI/TabsLinks";
import { getUniqueMapLeagues, getLeagueCategorySettings, getGametypesTopX, getValidGametypes } from "../lib/ctfLeague.mjs";
import { getGametypeNames } from "../lib/gametypes.mjs";
import { getMapNames } from "../lib/maps.mjs";
import  DefaultGametypeDisplay from "../UI/CTFLeague/DefaultGametypeDisplay";
import MapDisplay from "../UI/CTFLeague/MapDisplay";
import LeagueSettings from "../UI/CTFLeague/LeagueSettings";

export default async function Page({params, searchParams}){

    const p = await params;
    const sp = await searchParams;

    let mode = sp.mode ?? "";
    let id = sp.id ?? null;

    if(mode === "") mode = "gametypes";
    mode = mode.toLowerCase();

    id = parseInt(id);

    const gametypeIds = await getValidGametypes();
    const gametypeNames = await getGametypeNames(gametypeIds, true);

    const leagueSettings = (mode === "gametypes") ? await getLeagueCategorySettings("gametypes") : await getLeagueCategorySettings("maps");
   
    const tabs = [
        {"display": "Gametypes", "value": "gametypes"},
        {"display": "Maps", "value": "maps"}
    ];

    let data = null;

    const elems = [];

    if(mode === "gametypes"){

        data = await getGametypesTopX(gametypeIds, 10);

        elems.push(<DefaultGametypeDisplay data={data} names={gametypeNames} key="d-gametypes" />);
    }else{

        const mapIds = await getUniqueMapLeagues();
        const mapNames = await getMapNames(mapIds);
        elems.push(<MapDisplay leagueSettings={leagueSettings} gametypeNames={gametypeNames} mapNames={mapNames} key="d-maps" />);
    }

    return <main>
        <Header>CTF League</Header>
        <TabsLinks options={tabs} url={`/ctfleague?mode=`} selectedValue={mode}/>
        <LeagueSettings settings={leagueSettings} mode={mode}/>
        {elems}
    </main>
}