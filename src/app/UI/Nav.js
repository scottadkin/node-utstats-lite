"use client"
import styles from "./Nav.module.css";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "../lib/authentication";

import useLocalStorage from "../hooks/useLocalStorage";


export default function Nav({settings, sessionInfo, bAdmin, layout}){

    const router = useRouter();
    const pathname = usePathname().toLowerCase();


    const options = [];

    if(settings["Display Home"] === "1"){

        options.push({
                "name": "Home", 
                "url": "/", 
                "bExactMatchesOnly": true,
                "matches": ["/"],
                "index": layout["Home"]
            }
        );
    }

    if(settings["Display Matches"] === "1"){

        options.push({
                "name": "Matches", 
                "url": "/matches", 
                "matches": [
                    "/match/",
                    "/matches"
                ],
                "index": layout["Matches"]
            }
        );
    }


    if(settings["Display Players"] === "1"){

        options.push({
                "name": "Players",
                "url": "/players",
                "matches": [
                    "/players",
                    "/player/"
                ],
                "index": layout["Players"]
            }
        );
    }

    if(settings["Display Rankings"] === "1"){

        options.push({
                "name": "Rankings",
                "url": "/rankings",
                "matches": [
                    "/rankings",
                ],
                "index": layout["Rankings"]
            }
        );
    }

    if(settings["Display Records"] === "1"){

        options.push({
                "name": "Records",
                "url": "/records",
                "matches": [
                    "/records",
                ],
                "index": layout["Records"]
            }
        );
    }

    if(settings["Display Maps"] === "1"){

        options.push({
                "name": "Maps",
                "url": "/maps",
                "matches": [
                    "/map",
                ],
                "index": layout["Maps"]
            }
        );
    }

    if(sessionInfo !== null && settings["Display Admin"] === "1"){

        options.push({
            "name": "Admin",
            "url": "/admin",
            "matches": [
                "/admin"
            ],
            "index": layout["Admin"]
        });
    }


    if(sessionInfo === null){

        if(settings["Display Login/Register"] === "1"){

            options.push({
                "name": "Login",
                "url": "/login",
                "matches": ["/login"],
                "index": layout["Login/Register"]
            });

            options.push({
                "name": "Register",
                "url": "/register",
                "matches": ["/register"],
                "index": layout["Login/Register"]
            });   
        }

    }else{

        options.push({
            "name": `Logout ${sessionInfo.username}`,
            "url": "#",
            "matches": ["#"],
            "onClick": async () =>{
                const a = await logout();
                
                router.push("/");
                router.refresh();
            },
            "index": layout["Login/Register"]
        });
    }

    const elems = [];

    options.sort((a, b) =>{

        a = a.index;
        b = b.index;

        if(a < b) return -1;
        if(a > b) return 1;
        return 0;
    });

    for(let i = 0; i < options.length; i++){

        const o = options[i];

        let bActive = false;
   
        for(let x = 0; x < o.matches.length; x++){

            const m = o.matches[x];

            const bExactMatchesOnly = o?.bExactMatchesOnly || false;
  
            if(!bExactMatchesOnly){

                if(pathname.toLowerCase().startsWith(m)){
                    bActive = true;
                    break;
                }

            }else{

                if(pathname === m) {
                    bActive = true; 
                    break;
                }
            }    
        }
        
        const className = (bActive) ? styles.active : "";

        const elem = <a href={o.url} key={i} className={className} onClick={(o.onClick !== undefined) ? o.onClick : null}>
            {o.name}
        </a>;

        elems.push(elem);
    }




    const local = useLocalStorage();
    
    if(typeof localStorage !== "undefined"){
  
        const savedMatches = local.getItem("savedMatches");
        const savedPlayers = local.getItem("savedPlayers");

        if(savedMatches !== null){
            elems.push(<a href={"#"} key={"saved-matches"} className={"className"}>
                Saved Matches
            </a>);
        }

        if(savedPlayers !== null){
            elems.push(<a href={"#"} key={"saved-players"} className={"className"}>
                Saved Players
            </a>);
        }
    }

    return <nav className={styles.wrapper}>
        {elems}
    </nav>
}