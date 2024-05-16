"use client"
import styles from "./MessageBox.module.css";
import Image from "next/image";

export default function MessageBox({children, title, clearMessage}){

    if(children === null) return;

    return <div className={styles.wrapper}>
        <div className={styles.title}>{title ?? "No title specified"}</div>
        <div className="close-button" onClick={() =>{
            clearMessage();
        }}>
            <Image src={`/images/controlpoint.png`} alt="x" width={20} height={20} />
        </div>
        <div className={styles.content}>
            {children}
        </div>
    </div>
}