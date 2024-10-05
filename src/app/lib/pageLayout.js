import { simpleQuery } from "./database.mjs";


export async function getPageLayout(pageName){

    pageName = pageName.toLowerCase();

    const query = `SELECT * FROM nstats_page_layout WHERE page=? ORDER BY page_order ASC`;

    const result = await simpleQuery(query, [pageName]);

    if(result.length === 0) return null;

    return result;
}


export async function addPageLayout(page, item, pageOrder){

    page = page.toLowerCase();
    
    const query = `INSERT INTO nstats_page_layout VALUES(NULL,?,?,?)`;

    return await simpleQuery(query, [page, item, pageOrder]);
}

export async function getAllPagesLayout(){

    const query = `SELECT * FROM nstats_page_layout`;

    return await simpleQuery(query);
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
