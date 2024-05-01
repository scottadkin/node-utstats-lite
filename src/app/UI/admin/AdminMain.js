"use client"
import Tabs from "../Tabs";
import FTPManager from "./FTPManager";
import ImporterSettings from "./ImporterSettings";
import ImporterHistory from "./ImporterHistory";
import { useState } from "react";
import UserAccounts from "./UserAccounts";
import BackupManager from "./BackupManager";
import SiteSettings from "./SiteSettings";
import RankingSettings from "./RankingSettings";
import RecalculateRankings from "./RecalculateRankings";

export default function AdminMain(){

    const [mode, setMode] = useState("rankings-all");

    return <>
        <Tabs 
            options={[
                {"name": "Site Settings", "value": "settings"},
                {"name": "FTP Manager", "value": "ftp"},
                {"name": "Importer Settings", "value": "importer"},
                {"name": "Importer History", "value": "importer-history"},
                {"name": "User Accounts", "value": "users"},
                {"name": "Ranking Settings", "value": "rankings"},
                {"name": "Recalculate All Rankings", "value": "rankings-all"},
                //{"name": "Backup Manager", "value": "backup"},
            ]}
            selectedValue={mode}
            changeSelected={(value) =>{
                setMode(value);
            }}
        />
        {(mode === "ftp") ? <FTPManager /> : null }
        {(mode === "importer") ? <ImporterSettings /> : null }
        {(mode === "importer-history") ? <ImporterHistory /> : null }
        {(mode === "users") ? <UserAccounts /> : null }
        {(mode === "settings") ? <SiteSettings /> : null }
        {(mode === "backup") ? <BackupManager /> : null}
        {(mode === "rankings") ? <RankingSettings /> : null}
        {(mode === "rankings-all") ? <RecalculateRankings /> : null}

    </>
}