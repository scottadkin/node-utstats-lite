import { simpleQuery } from "./database.mjs";
import Message from "./message.mjs";

const DEFAULT_PAGE_LAYOUTS = {
    "home": ["Welcome Message", "Social Media","Latest Screenshot", "Recent Matches", "Activity Heatmap", "Most Played Maps", "Most Played Gametypes", "Most Active Players", "Servers"],
    "map": ["Map Screenshot", "Basic Summary", "Activity Heatmap", "Recent Matches", "Rankings", "Weapon Statistics", "CTF League", "Player Top Averages"],
    "match": ["Basic Info", "Screenshot", "Frags", "CTF", "CTF Caps", "DOM","Damage Stats","Classic Weapon Stats", "Weapons", "Items", "Special Events", "Kills", "Pings", "JSON Links"],
    "player": ["General Summary","Activity Heatmap", "CTF","CTF League", "Special Events", "Weapons", "Rankings", "Items", "Recent Matches"],
    "nav": ["Home", "Matches", "Players", "Rankings","CTF League", "Records", "Maps", "Admin", "Login/Register", "Watchlist"]
};

function getNextAvailableIndex(usedIndexes, targetIndex){

    const index = usedIndexes.indexOf(targetIndex);

    if(index === -1){
        usedIndexes.push(targetIndex);
        return targetIndex;
    }

    let lastIndex = 0;

    for(let i = 0; i < usedIndexes.length; i++){

        const u = usedIndexes[i];

        if(i === 0 || u > lastIndex) lastIndex = u;
    }

    usedIndexes.push(lastIndex + 1);
    return lastIndex + 1;

}

export async function getPageLayout(pageName){

    pageName = pageName.toLowerCase();

    const query = `SELECT item,page_order FROM nstats_page_layout WHERE page=? ORDER BY page_order ASC`;

    const result = await simpleQuery(query, [pageName]);

    if(result.length === 0) return null;

    const data = [];

    for(let i = 0; i < result.length; i++){

        const r = result[i];

        data.push(r.item);
    }

    return data;
}


async function bPageIndexInUse(page, index){

    const query = `SELECT COUNT(*) as total_rows FROM nstats_page_layout WHERE page=? AND page_order=?`;

    const result = await simpleQuery(query, [page, index]);
  
    return result[0].total_rows > 0;
}

async function getLastIndex(page){

    const query = `SELECT page_order FROM nstats_page_layout WHERE page=? ORDER BY page_order DESC LIMIT 1`;
    const result = await simpleQuery(query, [page]);

    if(result.length > 0) return result[0].page_order;
    return 0;

}

export async function addPageLayout(page, item, pageOrder){

    page = page.toLowerCase();

    if(await bPageOrderItemExists(page, item)){
        new Message(`Page Layout for page ${page} with item ${item} already exists, skipping`, "warning");
        return;
    }
    
    const query = `INSERT INTO nstats_page_layout VALUES(NULL,?,?,?)`;

    return await simpleQuery(query, [page, item, pageOrder]);
}

export async function getAllPagesLayout(bReturnArray){

    if(bReturnArray === undefined) bReturnArray = false;

    const query = `SELECT * FROM nstats_page_layout ORDER BY page ASC, page_order ASC`;
    const result = await simpleQuery(query);

    if(bReturnArray) return result;

    const settings = {};

    for(let i = 0; i < result.length; i++){

        const r= result[i];

        if(settings[r.page] === undefined) settings[r.page] = [];

        settings[r.page].push(r);
    }

    return settings;
}


async function deleteAllPageLayouts(){

    return await simpleQuery("DELETE FROM nstats_page_layout");
}

export async function saveChanges(changes){

    await deleteAllPageLayouts();

    for(let i = 0; i < changes.length; i++){

        const c = changes[i];

        await addPageLayout(c.page, c.item, c.page_order);
    }
}

async function bPageOrderItemExists(page, itemName){

    page = page.toLowerCase();

    const query = `SELECT COUNT(*) as total_rows FROM nstats_page_layout WHERE page=? AND item=?`;

    const result = await simpleQuery(query, [page, itemName]);

    return result[0].total_rows > 0;
}

async function insertPageLayout(page, itemName, pageOrder){

    page = page.toLowerCase();

    if(await bPageOrderItemExists(page, itemName)) return;

    const bIndexInUse = await bPageIndexInUse(page, pageOrder);

    if(bIndexInUse){
        pageOrder = await getLastIndex(page) + 1;
    }

    const query = `INSERT INTO nstats_page_layout VALUES(NULL,?,?,?)`;

    await simpleQuery(query, [page, itemName, pageOrder]);
}

function bValidSetting(page, item){

    if(DEFAULT_PAGE_LAYOUTS[page] === undefined) return false;

    if(DEFAULT_PAGE_LAYOUTS[page].indexOf(item) !== -1){
        return true;
    }

    return false;
}

async function deleteById(id){

    return await simpleQuery(`DELETE FROM nstats_page_layout WHERE id=?`, [id]);
}

async function deleteDeprecatedSettings(){

    const currentSettings = await getAllPagesLayout(true);

    for(let i = 0; i < currentSettings.length; i++){

        const s = currentSettings[i];
        if(!bValidSetting(s.page, s.item)){
            new Message(`Found old page layout setting that the site no longer uses(${s.page}.${s.item}), deleting.`,"Note");
            await deleteById(s.id);
        }
    }
}

export async function restoreDefaultLayouts(){

    for(const [page, data] of Object.entries(DEFAULT_PAGE_LAYOUTS)){

        for(let i = 0; i < data.length; i++){

            const d = data[i];

            await insertPageLayout(page, d, i + 1);
        }
    }

    await deleteDeprecatedSettings();
}


async function deletePageLayout(page){

    await simpleQuery(`DELETE FROM nstats_page_layout WHERE page=?`, [page]);
}

export async function restoreDefaultPageLayout(page){

    page = page.toLowerCase();

    const pages = Object.keys(DEFAULT_PAGE_LAYOUTS);

    if(pages.indexOf(page) === -1) throw new Error(`There is no page called ${page}`);

    await deletePageLayout(page);

    const settings = DEFAULT_PAGE_LAYOUTS[page];

    for(let i = 0; i < settings.length; i++){

        const s = settings[i];
        await insertPageLayout(page, s, i + 1);
    }
}


export async function savePageLayoutChanges(data){

    let passed = 0;
    let failed = 0; 

    const query = `UPDATE nstats_page_layout SET page_order=? WHERE id=?`;

    for(let i = 0; i < data.length; i++){

        const d = data[i];

        if(d.pageIndex === undefined) continue;

        try{
            await simpleQuery(query, [d.pageIndex, d.id]);
            passed++;
        }catch(err){
            console.trace(err);
            failed++;
        }


    }

    return [passed, failed];
}