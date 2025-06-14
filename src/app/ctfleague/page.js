import Header from "../UI/Header";
import TabsLinks from "../UI/TabsLinks";
import { getUniqueMapLeagues, getLeagueCategorySettings, getValidGametypes, getLastestMapGametypePlayed, getLeaguesEnabledStatus } from "../lib/ctfLeague.mjs";
import { getGametypeNames } from "../lib/gametypes.mjs";
import { getMapNames } from "../lib/maps.mjs";
import  DefaultGametypeDisplay from "../UI/CTFLeague/DefaultGametypeDisplay";
import MapDisplay from "../UI/CTFLeague/MapDisplay";
import LeagueSettings from "../UI/CTFLeague/LeagueSettings";
import { setInt } from "../lib/generic.mjs";
import { getCategorySettings } from "../lib/siteSettings.mjs";



function setIds(sp, mode, lastMapGametypeCombo){

    let id = setInt(sp.id, 0);
    let gId = setInt(sp.gid, 0);

    if(mode === "gametypes" && lastMapGametypeCombo !== null){

        if(id === 0){
            id = lastMapGametypeCombo.gametype_id;
        }
    }

    if(mode === "maps" && id === 0 && lastMapGametypeCombo !== null){
        id = lastMapGametypeCombo.map_id;
    }
    
    if(mode === "maps" && gId === 0 && lastMapGametypeCombo !== null){
         gId = lastMapGametypeCombo.gametype_id;
    }


    return {id, gId};
}

export async function generateMetadata({ params, searchParams }, parent) {
    //const slug = (await params).slug
    
    const sp = await searchParams;

    const leagueStatus = await getLeaguesEnabledStatus();

    if(!leagueStatus.maps && !leagueStatus.gametypes){

        return {
            "title": "CTF League Disabled",
            "description": "CTF league has been disabled."
        }
    } 
   
    let mode = sp.mode ?? "gametypes";
    mode = mode.toLowerCase();
    let title = "";
    let desc = "View all tables for the various player ctf leagues.";

    const settings = await getCategorySettings("Branding");

    const lastMapGametypeCombo = await getLastestMapGametypePlayed();
    
    const {id, gId} = setIds(sp, mode, lastMapGametypeCombo);

    let gametypeNames = {};

    if(lastMapGametypeCombo !== null){

        gametypeNames = await getGametypeNames([id], true);

        if(mode === "gametypes"){

            if(gametypeNames[id] !== undefined){
                title = `${gametypeNames[id]} - CTF League`;
                desc = `View the ${gametypeNames[id]} table for the player ctf league.`;
            }else if(id === 0){
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

        title += ` - ${settings["Site Name"] || "Node UTStats Lite"}`;
    }

    
    return {
        "title": title,
        "description": desc,
    }
}

export default async function Page({params, searchParams}){

    const p = await params;
    const sp = await searchParams;

    const leagueStatus = await getLeaguesEnabledStatus();

    if(!leagueStatus.maps && !leagueStatus.gametypes){

        return <main><div className="info">
            CTF League is disabled.
        </div> </main>
    } 

    let mode = sp.mode ?? "";
    //let id = sp.id ?? null;

    let page = setInt(sp.page, 1);
    if(page < 1) page = 1;

    if(mode === ""){

        if(leagueStatus.gametypes){
            mode = "gametypes";
        }else if(leagueStatus.maps){
            mode = "maps";
        }
    }
    mode = mode.toLowerCase();

    const lastMapGametypeCombo = await getLastestMapGametypePlayed();
    
    const {id, gId} = setIds(sp, mode, lastMapGametypeCombo);

    const perPage = 25;

    const gametypeIds = await getValidGametypes();
    const gametypeNames = await getGametypeNames(gametypeIds, true);

    //const lastMapGametypeCombo = await getLastestMapGametypePlayed();

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

        elems.push(<DefaultGametypeDisplay names={gametypeNames} selectedGametype={id} page={page} perPage={perPage} key="d-gametypes" />);

    }else{

        const mapIds = await getUniqueMapLeagues();
        const mapNames = await getMapNames(mapIds);
        
        elems.push(<MapDisplay 
            latestGametypeMapCombo={lastMapGametypeCombo} 
            leagueSettings={leagueSettings} 
            gametypeNames={gametypeNames} 
            perPage={perPage}
            selectedMap={id}
            selectedGametype={gId}
            mapNames={mapNames} key="d-maps" 
        />);
    }

    let tabsElem = null;
    
    if(leagueStatus.maps && leagueStatus.gametypes){
        tabsElem = <TabsLinks options={tabs} url={`/ctfleague?mode=`} selectedValue={mode}/>;
    }



    return <main>
        <Header>CTF League</Header>
        {tabsElem}
        <LeagueSettings settings={leagueSettings} mode={mode}/>
        {elems}
    </main>
}