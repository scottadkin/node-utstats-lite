"use client"
import styles from "./NotificationCluster.module.css";
import Image from "next/image";

export default function NotificationCluster({state, dispatch}){


    if(state.messages.length === 0) return null;

    return <div className={styles.wrapper} onClick={() =>{
        dispatch({"type": "clear-all"});
    }}>
        <div className="close-button" title="Close All">
            <Image src="/images/controlpoint.png" alt="x" width={20} height={20}/>
        </div>
        {state.messages.map((m, i) =>{

            const type = m.type.toLowerCase();

            let className = "team-none";
            let title = "";

            if(type === "error"){

                title = "Error";
                className = "team-red";

            }else if(type === "pass"){

                title = "Success";
                className = "team-green";

            }else if(type === "warning"){

                title = "Warning";
                className = "team-yellow";
            }

            return <div key={i} className={className}>
                <div className={styles.box}>
                    <div className={styles.title}>{title}</div>
                    {m.message}
                </div>
            </div>
        })}
    </div>
}