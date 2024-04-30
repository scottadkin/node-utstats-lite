"use client"
import styles from "./Nav.module.css";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { logout } from "../lib/authentication";


export default function Nav({settings, sessionInfo, bAdmin}){

    const router = useRouter();
    const pathname = usePathname().toLowerCase();


    const options = [
        {
            "name": "Home", 
            "url": "/", 
            "bExactMatchesOnly": true,
            "matches": ["/"]},
        {
            "name": "Matches", 
            "url": "/matches", 
            "matches": [
                "/match/",
                "/matches"
            ]
        }, 
        {
            "name": "Players",
            "url": "/players",
            "matches": [
                "/players",
                "/player/"
            ]
        },
        {
            "name": "Rankings",
            "url": "/rankings",
            "matches": [
                "/rankings",
            ]
        }
    ];

    if(sessionInfo !== null){

        options.push({
            "name": "Admin",
            "url": "/admin",
            "matches": [
                "/admin"
            ]
        });
    }


    if(sessionInfo === null){

        if(settings["Display Login/Register"] === "1"){

            options.push({
                "name": "Login",
                "url": "/login",
                "matches": ["/login"]
            });

            options.push({
                "name": "Register",
                "url": "/register",
                "matches": ["/register"]
            });   
        }

    }else{

        options.push({
            "name": `Logout ${sessionInfo.username}`,
            "url": "#",
            "matches": ["#"],
            "onClick": async () =>{
                const a = await logout();
    
                
                console.log(a);
    
                
                router.push("/");
                router.refresh();
            }
        });
    }

    const elems = [];

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

    return <nav className={styles.wrapper}>
        {elems}
    </nav>
}