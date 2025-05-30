import Header from "../UI/Header";
import TabsLinks from "../UI/TabsLinks";
import { getUniqueMapLeagues, getLeagueCategorySettings, getValidGametypes, getLastestMapGametypePlayed } from "../lib/ctfLeague.mjs";
import { getGametypeNames } from "../lib/gametypes.mjs";
import { getMapNames } from "../lib/maps.mjs";
import  DefaultGametypeDisplay from "../UI/CTFLeague/DefaultGametypeDisplay";
import MapDisplay from "../UI/CTFLeague/MapDisplay";
import LeagueSettings from "../UI/CTFLeague/LeagueSettings";
import { setInt } from "../lib/generic.mjs";

export async function generateMetadata({ params, searchParams }, parent) {
    //const slug = (await params).slug
    
    const sp = await searchParams;
   
    let mode = sp.mode ?? "gametypes";
    mode = mode.toLowerCase();
    let title = "";
    let desc = "View all tables for the various player ctf leagues.";

    let id = setInt(sp.id, 0);
    let gId = setInt(sp.gid, 0);


    const lastMapGametypeCombo = await getLastestMapGametypePlayed();

    if(mode === "gametypes" && lastMapGametypeCombo !== null){

        console.log("id", id);
        if(id === 0){
            id = lastMapGametypeCombo.gametype_id;
        }else{
            console.log("WILL YOU JUST FUCK IOFFF");
        }
    }

    if(mode === "maps" && id === 0 && lastMapGametypeCombo !== null){
        id = lastMapGametypeCombo.map_id;
    }
    
    if(mode === "maps" && gId === 0 && lastMapGametypeCombo !== null){
         gId = lastMapGametypeCombo.gametype_id;
    }

    let gametypeNames = {};

    if(lastMapGametypeCombo !== null){

        gametypeNames = await getGametypeNames([id], true);

        if(mode === "gametypes"){

            if(gametypeNames[id] !== undefined){
                title = `${gametypeNames[id]} - CTF League`;
                desc = `View the ${gametypeNames[id]} table for the player ctf league.`;
            }else if(id === 0){
                console.log(gametypeNames);
                title = "Player CTF League";
            }


        }else if(mode === "maps"){
            title = "Maps";
            const mapNames = await getMapNames([id]);

            gametypeNames = await getGametypeNames([gId], true);

            const map = mapNames[id] ?? "Not Found";
            const gametype = gametypeNames[gId] ?? "Not Found";

            desc = `View the ${map} (${gametype}) table for the player ctf league.`;
            title = `${map} (${gametype}) - CTF League`;
            
        }
    }

    
    return {
        "title": title,
        "description": desc,
    }
}

export default async function Page({params, searchParams}){

    const p = await params;
    const sp = await searchParams;

    let mode = sp.mode ?? "";
    let id = sp.id ?? null;

    let page = setInt(sp.page, 1);
    if(page < 1) page = 1;

    if(mode === "") mode = "gametypes";
    mode = mode.toLowerCase();

    id = parseInt(id);

    const gametypeIds = await getValidGametypes();
    const gametypeNames = await getGametypeNames(gametypeIds, true);

    const lastMapGametypeCombo = await getLastestMapGametypePlayed();

    const leagueSettings = (mode === "gametypes") ? await getLeagueCategorySettings("gametypes") : await getLeagueCategorySettings("maps");
   
    const tabs = [
        {"display": "Gametypes", "value": "gametypes"},
        {"display": "Maps", "value": "maps"}
    ];

    const elems = [];

    if(mode === "gametypes"){

        if(id !== id && lastMapGametypeCombo !== null){
            id = lastMapGametypeCombo.gametype_id;
        }


        elems.push(<DefaultGametypeDisplay names={gametypeNames} selectedGametype={id} page={page} key="d-gametypes" />);
    }else{

        const mapIds = await getUniqueMapLeagues();
        const mapNames = await getMapNames(mapIds);
        
        elems.push(<MapDisplay 
            latestGametypeMapCombo={lastMapGametypeCombo} 
            leagueSettings={leagueSettings} 
            gametypeNames={gametypeNames} 
            mapNames={mapNames} key="d-maps" 
        />);
    }

    return <main>
        <Header>CTF League</Header>
        <TabsLinks options={tabs} url={`/ctfleague?mode=`} selectedValue={mode}/>
        <LeagueSettings settings={leagueSettings} mode={mode}/>
        {elems}
    </main>
}