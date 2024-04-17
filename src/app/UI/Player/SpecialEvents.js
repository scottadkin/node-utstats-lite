"use client"
import Header from "../Header";
import { useState } from "react";
import InteractiveTable from "../InteractiveTable";
import { ignore0, plural } from "@/app/lib/generic.mjs";
import Tabs from "../Tabs";

export default function SpecialEvents({data, gametypeNames}){

    const [mode, setMode] = useState("all");


    const multiHeaders = {
        "gametype": {
            "title": "Gametype"
        },
        "double": {
            "title": <>Double Kill</>,
            "mouseOverBox": {
                "title": `Double Kill`,
                "content": `Player got 2 kills in a short amount of time without dying`
            }
        },
        "multi": {
            "title": <>Multi Kill</>,
            "mouseOverBox": {
                "title": `Multi Kill`,
                "content": `Player got 3 kills in a short amount of time without dying`
            }
        },
        "ultra": {
            "title": <>Ultra Kill</>,
            "mouseOverBox": {
                "title": `Ultra Kill`,
                "content": `Player got 4 kills in a short amount of time without dying`
            }
        },
        "monster": {
            "title": <>Monster Kill</>,
            "mouseOverBox": {
                "title": `Monster Kill`,
                "content": `Player got 5 or more kills in a short amount of time without dying`
            }
        },
        "bestMulti": {
            "title": <>Best Multi Kill</>,
            "mouseOverBox": {
                "title": `Best Multi Kill`,
                "content": `The most amount of kills the player got in a short amount of time without dying`
            }
        },
    };
    

    const spreeHeaders = {
        "gametype": {
            "title": "Gametype"
        },
        "spree": {
            "title": <>Killing Spree</>,
            "mouseOverBox": {
                "title": "Killing Spree",
                "content": `Player killed 5 to 9 players in a single life`
            }
        },
        "rampage": {
            "title": <>Rampage</>,
            "mouseOverBox": {
                "title": "Rampage",
                "content": `Player killed 10 to 14 players in a single life`
            }
        },
        "dominating": {
            "title": <>Dominating</>,
            "mouseOverBox": {
                "title": "Dominating",
                "content": `Player killed 15 to 19 players in a single life`
            }
        },
        "unstoppable": {
            "title": <>Unstoppable</>,
            "mouseOverBox": {
                "title": "Unstoppable",
                "content": `Player killed 20 to 24 players in a single life`
            }
        },
        "godlike": {
            "title": <>Godlike</>,
            "mouseOverBox": {
                "title": "Godlike",
                "content": `Player killed at least 25 players in a single life`
            }
        },
        "bestSpree": {
            "title": <>Best</>,
            "mouseOverBox": {
                "title": "Best Spree",
                "content": `Most amount of kills a player got in a single life`
            }
        }
    }

    if(mode === "all"){
        delete spreeHeaders.gametype;
        delete multiHeaders.gametype;
    }

    const spreeRows = [];
    const multiRows = [];

    for(let i = 0; i < data.length; i++){

        const d = data[i];

        if(mode === "all" && d.gametype_id !== 0) continue;

        spreeRows.push({
            "gametype": {
                "value": gametypeNames[d.gametype_id] ?? "Not Found",
                "className": "text-left"
            },
            "spree": {
                "value": d.spree_1, 
                "displayValue": ignore0(d.spree_1)    
            },
            "rampage": {
                "value": d.spree_2, 
                "displayValue": ignore0(d.spree_2)    
            },
            "dominating": {
                "value": d.spree_3, 
                "displayValue": ignore0(d.spree_3)    
            },
            "unstoppable": {
                "value": d.spree_4, 
                "displayValue": ignore0(d.spree_4)    
            },
            "godlike": {
                "value": d.spree_5, 
                "displayValue": ignore0(d.spree_5)    
            },
            "bestSpree": {
                "value": d.spree_best, 
                "displayValue": `${d.spree_best} ${plural(d.spree_best, "Kill")}`    
            }
        });

        multiRows.push({
            "gametype": {
                "value": gametypeNames[d.gametype_id] ?? "Not Found",
                "className": "text-left"
            },
            "double": {
                "value": d.multi_1, 
                "displayValue": ignore0(d.multi_1)    
            },
            "multi": {
                "value": d.multi_2, 
                "displayValue": ignore0(d.multi_2)    
            },
            "ultra": {
                "value": d.multi_3, 
                "displayValue": ignore0(d.multi_3)    
            },
            "monster": {
                "value": d.multi_4, 
                "displayValue": ignore0(d.multi_4)    
            },
            "bestMulti": {
                "value": d.multi_best, 
                "displayValue": `${d.multi_best} ${plural(d.multi_best, "Kill")}`   
            }
        });

    }

    let tabsElem = null;

    if(data.length > 2){
        tabsElem = <Tabs 
            options={[
                {"name": "All", "value": "all"},
                {"name": "Gametypes", "value": "gametypes"},
            ]}
            changeSelected={(value) =>{
                setMode(value);
            }}
            selectedValue={mode}
        />
    }

    return <>
        <Header>
            Special Events
        </Header>
        {tabsElem}
        <InteractiveTable width={2} headers={spreeHeaders} rows={spreeRows}/>
        <InteractiveTable width={2} headers={multiHeaders} rows={multiRows}/>
    </>
}