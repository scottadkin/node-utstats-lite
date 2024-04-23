"use client"
import Tabs from "../Tabs";
import FTPManager from "./FTPManager";
import ImporterSettings from "./ImporterSettings";
import ImporterHistory from "./ImporterHistory";
import { useState } from "react";

export default function AdminMain(){

    const [mode, setMode] = useState("importer-history");

    return <>
        <Tabs 
            options={[
                {"name": "FTP Manager", "value": "ftp"},
                {"name": "Importer Settings", "value": "importer"},
                {"name": "Importer History", "value": "importer-history"},
            ]}
            selectedValue={mode}
            changeSelected={(value) =>{
                setMode(value);
            }}
        />
        {(mode === "ftp") ? <FTPManager /> : null }
        {(mode === "importer") ? <ImporterSettings /> : null }
        {(mode === "importer-history") ? <ImporterHistory /> : null }
    </>
}