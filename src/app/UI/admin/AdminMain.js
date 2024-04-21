"use client"
import Tabs from "../Tabs";
import FTPManager from "./FTPManager";
import { useState } from "react";

export default function AdminMain(){

    const [mode, setMode] = useState("ftp");

    return <>
        <Tabs 
            options={[
                {"name": "Test", "value": "0"},
                {"name": "FTP Manager", "value": "ftp"},
            ]}
            selectedValue={mode}
            changeSelected={(value) =>{
                setMode(value);
            }}
        />
        {(mode === "ftp") ? <FTPManager /> : null }
    </>
}