"use client"
import { useRouter } from "next/navigation";


function sortByName(a,b){

    a = a.name.toLowerCase();
    b = b.name.toLowerCase();

    if(a < b) return -1;
    if(a > b) return 1;
    return 0;
}

export default function SearchForm({serverNames, gametypeNames, mapNames, server, gametype, map, display}){

    const router = useRouter();

    const serverOptions = [];

    for(const [id, name] of Object.entries(serverNames)){

        serverOptions.push({
            "id": parseInt(id),
            "name": name
        });
    }

    const gametypeOptions = [];

    for(const [id, name] of Object.entries(gametypeNames)){
        
        gametypeOptions.push({
            "id": parseInt(id),
            "name": name
        });
    }

    const mapOptions = [];

    for(const [id, name] of Object.entries(mapNames)){
        
        mapOptions.push({
            "id": parseInt(id),
            "name": name
        });
    }

    serverOptions.sort(sortByName);
    gametypeOptions.sort(sortByName);
    mapOptions.sort(sortByName);
    

    return <>
        <div className="form">
            <div className="form-row">
                <label>Server</label>
                <select value={server} onChange={(e) =>{
                        router.push(`/matches?s=${e.target.value}&g=${gametype}&m=${map}&display=${display}`);
                    }}>
                    {serverOptions.map((s) =>{
                        return <option key={s.id} value={s.id}>{s.name}</option>
                    })}
                </select>
            </div>
            <div className="form-row">
            <label>Gametype</label>
            <select value={gametype} onChange={(e) =>{
                router.push(`/matches?s=${server}&g=${e.target.value}&m=${map}&display=${display}`);
            }}>
                {gametypeOptions.map((g) =>{
                    return <option key={g.id} value={g.id}>{g.name}</option>
                })}
            </select>
            </div>
            <div className="form-row">
                <label>Map</label>
                <select value={map} onChange={(e) =>{
                    router.push(`/matches?s=${server}&g=${gametype}&m=${e.target.value}&display=${display}`);
                }}>
                    {mapOptions.map((m) =>{
                        return <option key={m.id} value={m.id}>{m.name}</option>
                    })}
                </select>
            </div>
            <div className="form-row">
                <label>Display Mode</label>
                <select value={display} onChange={(e) =>{
                    router.push(`/matches?s=${server}&g=${gametype}&m=${map}&display=${e.target.value}`);
                }}>
                    <option value="0">Default</option>
                    <option value="1">Table</option>
                </select>
                   
            </div>
        </div>
    </>
}