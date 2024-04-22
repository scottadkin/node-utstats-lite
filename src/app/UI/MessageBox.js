"use client"
import styles from "./MessageBox.module.css";

export default function MessageBox({children, title}){

    if(children === null) return;

    return <div className={styles.wrapper}>
        <div className={styles.title}>{title ?? "No title specified"}</div>
        <div className={styles.content}>
            {children}
        </div>
    </div>
}