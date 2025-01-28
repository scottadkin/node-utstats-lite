import { getSessionInfo } from "@/app/lib/authentication";
import { getAllFTPSettings, addServer, editServer, deleteServer } from "@/app/lib/ftp";
import { updateSettings as updateLogsFolderSettings, getSettings as getLogsFolderSettings} from "@/app/lib/logsfoldersettings.mjs";
import { getHistory as getImporterHistory, getImporterNames, getRejectedHistory, getLogImportHistory } from "@/app/lib/importer.mjs";
import { getAllUsers, adminUpdateUser } from "@/app/lib/users.mjs";
import { getAllSettings as getAllSiteSettings, updateSettings as updateSiteSettings, restorePageSettings } from "@/app/lib/siteSettings.mjs";
import { 
    getAllSettings as getAllRankingSettings, 
    recalculateAll as recalculateAllRankings, 
    updateSettings as updateRankingSettings, 
    recalculatePlayersByIds as recalculatePlayersRankingByIds
} from "@/app/lib/rankings.mjs";
import { getAllNames as getAllMapNames, getAllImages as getAllMapImages } from "@/app/lib/maps.mjs";
import { adminGetAllHistory as getAllUserHistory, getAllNames as getAllPlayerNames, adminAssignHWIDUsageToPlayerId, 
    updatePlayerGametypeTotals, getMasterPlayersStats, updateMasterPlayer,
    adminRenamePlayer, adminDeletePlayer, recalcAllPlayerTotals 
} from "@/app/lib/players.mjs";
import { changePlayerIds as changeKillsPlayerIds } from "@/app/lib/kills.mjs";
import { changePlayerIds as changeCTFPlayerIds } from "@/app/lib/ctf.mjs";
import { changePlayerMatchIds as changeWeaponPlayerMatchIds } from "@/app/lib/weapons.mjs";
import { changePlayerMatchIds as changeDominationPlayerMatchIds} from "@/app/lib/domination.mjs";
import { clearAllDataTables } from "@/app/lib/admin";
import { getAllPagesLayout, saveChanges as savePageLayoutChanges, restoreDefaultPageLayout } from "@/app/lib/pageLayout.mjs";
import { changePlayerMatchIds as changeDamagePlayerMatchIds } from "@/app/lib/damage.mjs";
import { adminGetMatchLogDetails, adminGetMatches, deleteMatch } from "@/app/lib/matches.mjs";
import { getAllNames as getAllGametypeNames, getSplitByTeamSizeInfo } from "@/app/lib/gametypes.mjs";
import { getAllNames as getAllServerNames } from "@/app/lib/servers.mjs";



export async function POST(req){

    try{

        const sessionInfo = await getSessionInfo();

        if(sessionInfo === null) throw new Error(`You are not logged in`);

        console.log(sessionInfo);

        const res = await req.json();
        console.log(res);

        if(res.mode === undefined) throw new Error(`No mode specified`);

        const mode = res.mode.toLowerCase();

        if(mode === "add-server"){
            await addServer(res);
            return Response.json({"message": "passed"});
        }

        if(mode === "update-server"){
            if(res.serverId == undefined) throw new Error(`ServerId is undefined/null`);
            await editServer(res.serverId, res);
            return Response.json({"message": "passed"});
        }

        if(mode === "delete-server"){

            if(res.serverId == undefined) throw new Error(`ServerId is undefined/null`);
            await deleteServer(res.serverId);
            return Response.json({"message": "passed"});
        }

        if(mode === "update-importer-settings"){

            const ignoreBots = (res.ignoreBots !== undefined) ? res.ignoreBots : 0;
            const ignoreDuplicates = (res.ignoreDuplicates !== undefined) ? res.ignoreDuplicates : 0;
            const minPlayers = (res.minPlayers !== undefined) ? res.minPlayers : 0;
            const minPlaytime = (res.minPlaytime !== undefined) ? res.minPlaytime : 0;
            const appendTeamSizes = (res.appendTeamSizes !== undefined) ? res.appendTeamSizes : 0;

            await updateLogsFolderSettings(ignoreBots, ignoreDuplicates, minPlayers, minPlaytime, appendTeamSizes);

            return Response.json({"message": "passed"});
        }

        if(mode === "get-users"){

            const data = await getAllUsers();

            return Response.json({"data": data});

        }

        if(mode === "save-user-changes"){

            const userId = res.userId;
            const bEnabled = res.bEnabled;
            
            if(userId === undefined || bEnabled === undefined) throw new Error(`userId and bEnabled must be set if you want to update a user account`);

            await adminUpdateUser(userId, bEnabled);
            return Response.json({"message": "passed"});

        }

        if(mode === "save-site-settings"){

            const messages = await updateSiteSettings(res.settings);

            return Response.json({"messages": messages});
        }

        if(mode === "save-page-layouts"){


            await savePageLayoutChanges(res.settings);

            return Response.json({"message": "passed"});
        }

        if(mode === "save-ranking-settings"){

            if(res.data === undefined) throw new Error(`save-ranking-settings no data supplied`);

            const {passes, fails} = await updateRankingSettings(res.data);

            if(fails === 0){
                return Response.json({"message": "All changes applied successfully."});
            }

            if(passes === 0){
                return Response.json({"error": "Failed to apply any changes."});
            }

            return Response.json({"message": `Some settings failed to apply. (${passes}/${passes + fails})`});
        }


        if(mode === "merge-hwid-usage-to-player"){


            /**
             * 04/12/24
             * This probably doesn't work as intended? ATM it changes all match data for a matching player_id when we just want it to change
             * effected player_ids in the matches a match was used
             * 
             * Example:
             * Ooper could have had a HWID 0001 in 5 matches, but Ooper also played with HWID 0002 in 10 other matches,
             * when we merge HWID 0001 into a player profile we only want to change the player_id in the first 5 matches and not all 15 matches,
             * ATM all 15 change which is not correct
             */

            const playerId = (res.playerId !== undefined) ? parseInt(res.playerId) : NaN;
            const hwid = (res.hwid !== undefined) ? res.hwid : null;

            if(playerId !== playerId) throw new Error(`Player ID must be a valid integer.`);
            if(playerId === -1) throw new Error(`You have not selected a target player profile.`);
            if(hwid === null) throw new Error(`HWID is null.`);
            if(hwid.length === 0) throw new Error(`HWID can't be an empty string.`);


            const {affectedPlayers, result} = await adminAssignHWIDUsageToPlayerId(hwid, playerId);
            const killsResult = await changeKillsPlayerIds(affectedPlayers, playerId);
            const ctfResult = await changeCTFPlayerIds(affectedPlayers, playerId);
            const weaponsResult = await changeWeaponPlayerMatchIds(affectedPlayers, playerId);
            const domResult = await changeDominationPlayerMatchIds(affectedPlayers, playerId);
            const damageResult = await changeDamagePlayerMatchIds(affectedPlayers, playerId);

            let changedRows = result.changedRows + killsResult.changedRows + ctfResult.changedRows + 
            weaponsResult.changedRows + domResult.changedRows + damageResult.changedRows;

            const allPlayers = [... new Set([...affectedPlayers, playerId])];
            await updatePlayerGametypeTotals(allPlayers);

            //nstats_players
            const masterTotals = await getMasterPlayersStats(allPlayers);

            for(let i = 0; i < masterTotals.length; i++){

                const m = masterTotals[i];
                await updateMasterPlayer(m, null, null);
            }

            await recalculatePlayersRankingByIds(allPlayers);

            return Response.json({"changedRows": changedRows});
        }

        if(mode === "rename-player"){

            let playerId = res.playerId ?? -1;
            playerId = parseInt(playerId);

            if(playerId !== playerId) throw new Error(`PlayerId must be a valid integer.`);
            if(playerId === -1) throw new Error(`PlayerId was not set.`);

            const playerName = res.playerName ?? null;

            if(playerName === null) throw new Error(`playerName was not set`);
            if(playerName.length === 0) throw new Error(`Playername can not be a blank string.`);

            await adminRenamePlayer(playerId, playerName);
            return Response.json({"message": "passed"});
        }

        if(mode === "delete-player"){

            let playerId = res.playerId ?? -1;
            playerId = parseInt(playerId);

            if(playerId !== playerId) throw new Error(`PlayerId must be a valid integer.`);
            if(playerId === -1) throw new Error(`PlayerId was not set.`);

            const rowsDeleted = await adminDeletePlayer(playerId);
            return Response.json({"rowsDeleted": rowsDeleted});
        }


        if(mode === "clear-tables"){
 
            await clearAllDataTables();

            return Response.json({"message": "passed"});
        }

        if(mode === "restore-page-layout"){

            let page = res.page ?? null;

            if(page === null) throw new Error("Page has not been set");

            page = page.toLowerCase();

            await restoreDefaultPageLayout(page);

        }

        if(mode === "restore-page-settings"){

            let page = res.page ?? null;

            if(page === null) throw new Error("Page has not been set");

            await restorePageSettings(page);

        }

        if(mode === "delete-match"){


            console.log("#############################################################");
            if(res.id === undefined) throw new Error(`Match Id not set`);

            if(await deleteMatch(res.id)){
                return Response.json({"message": "passed"});
            }else{
                throw new Error(`Failed to delete match`);
            }
        }

        
        
        return Response.json({"message": "hi"});

    }catch(err){

        console.trace(err);

        return Response.json({"error": err.toString()});
    }
}


export async function GET(req){

    try{

        const sessionInfo = await getSessionInfo();

        if(sessionInfo === null) throw new Error(`You are not logged in`);

        console.log(sessionInfo);

        const { searchParams } = new URL(req.url);

        let page = searchParams.get("page");
        let perPage = searchParams.get("perPage");

        
        if(page === null) page = 1;
        if(perPage === null) perPage = 25;

        page = parseInt(page);
        if(page !== page) throw new Error(`Page must be a valid integer`);

        perPage = parseInt(perPage);
        if(perPage !== perPage) throw new Error(`perPage must be a valid integer`);

        if(page < 1) page = 1;
        if(perPage > 100) perPage = 100;
        if(perPage < 5) perPage = 5;

        const mode = searchParams.get("mode");

        if(mode === undefined){
            throw new Error("Mode is undefined");
        }

        console.log("mode");
        console.log(mode);

        if(mode === "load-ftp"){

            const data = await getAllFTPSettings();

            return Response.json(data);
        }

        if(mode === "get-log-settings"){

            const data = await getLogsFolderSettings();

            return Response.json(data);
        }

        if(mode === "get-importer-history"){

            const result = await getImporterHistory(page, perPage);

            const {totals, data} = result;
            
            return Response.json({"data": data, "totals": totals});
        }

        if(mode === "get-importer-names"){

            const data = await getImporterNames();
            
            return Response.json({"data": data});
        }

        if(mode === "get-rejected-history"){

            const result = await getRejectedHistory(page, perPage);

            const {totals, data} = result;
            
            return Response.json({"data": data, "totals": totals});
        }

        if(mode === "get-importer-logs"){

            const {totals, data} = await getLogImportHistory(page, perPage);

            return Response.json({"data": data, "totals": totals});
        }

        if(mode === "get-site-settings"){

            const data = await getAllSiteSettings();
            const pageLayouts = await getAllPagesLayout();

            return Response.json({"data": data, "pageLayouts": pageLayouts});
        }

        if(mode === "get-ranking-settings"){

            const data = await getAllRankingSettings();

            return Response.json({"data": data});
        }

        if(mode === "recalculate-rankings"){

            const data = await recalculateAllRankings();

            console.log(data);
        }

        if(mode === "get-map-images"){

            const mapNames = await getAllMapNames(true);
            const images = await getAllMapImages();

            return Response.json({mapNames, images});
        }

        if(mode === "get-all-player-history"){

            const history = await getAllUserHistory();
            const playerNames = await getAllPlayerNames();

            return Response.json({"history": history, "playerNames": playerNames});

        }

        if(mode === "get-all-player-names"){

            const playerNames = await getAllPlayerNames();
            return Response.json({playerNames});
        }

        if(mode === "recalculate-totals"){

            await recalcAllPlayerTotals();
            return Response.json({"message": "done"});
        }


        if(mode === "get-match-list"){

            let gametype = searchParams.get("g") ?? 0;
            let server = searchParams.get("s") ?? 0;
            let map = searchParams.get("m") ?? 0;

            gametype = parseInt(gametype);
            server = parseInt(server);
            map = parseInt(map);

            if(gametype !== gametype) gametype = 0;
            if(server !== server) server = 0;
            if(map !== map) map = 0;

            const data = await adminGetMatches(page, perPage, map, gametype, server);

            return Response.json(data);
        }

        //gametypes, maps, servers,....
        if(mode === "get-all-type-names"){
            
            const maps = await getAllMapNames();
            const gametypes = await getAllGametypeNames(false);
            const servers = await getAllServerNames();

            return Response.json({maps, gametypes, servers});
        }


        if(mode === "admin-get-match-details"){

            let id = searchParams.get("id") ?? -1;

            id = parseInt(id);

            return Response.json(await adminGetMatchLogDetails(id));
        }


        if(mode === "get-split-gametypes-by-teams-info"){
            return Response.json(await getSplitByTeamSizeInfo());
        }

        return Response.json({"message": "hi"});

    }catch(err){

        return Response.json({"error": err.toString()});
    }
}
