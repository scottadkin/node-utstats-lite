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
import MapImageUploader from "./MapImageUploader";
import PlayerMerger from "./PlayerMerger";
import PlayerManager from "./PlayerManager";
import ClearDatabase from "./ClearDatabase";
import MatchesManager from "./MatchesManager";
import GametypesManager from "./GametypesManager";
import CTFLeague from "./CTFLeague";

export default function AdminMain(){

    const [mode, setMode] = useState("ctf-league");

    return <>
        <Tabs 
            options={[
                {"name": "Site Settings", "value": "settings"},
                {"name": "FTP Manager", "value": "ftp"},
                {"name": "Importer Settings", "value": "importer"},
                {"name": "Importer History", "value": "importer-history"},
                {"name": "User Accounts", "value": "users"},
                {"name": "Matches Manager", "value": "matches"},
                {"name": "Gametypes Manager", "value": "gametypes"},
                {"name": "Ranking Settings", "value": "rankings"},
                {"name": "Recalculate All Rankings", "value": "rankings-all"},
                {"name": "CTF League", "value": "ctf-league"},
                {"name": "Map Image Uploader", "value": "map-img"},
                {"name": "Player Merger", "value": "player-merge"},
                {"name": "Player Manager", "value": "player-manager"},
                {"name": "Clear Database Tables", "value": "clear-database"}
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
        {(mode === "map-img") ? <MapImageUploader /> : null}
        {(mode === "player-merge") ? <PlayerMerger /> : null}
        {(mode === "player-manager") ? <PlayerManager /> : null}
        {(mode === "clear-database") ? <ClearDatabase /> : null}
        {(mode === "matches") ? <MatchesManager /> : null}
        {(mode === "gametypes") ? <GametypesManager /> : null}
        {(mode === "ctf-league") ? <CTFLeague /> : null}

    </>
}