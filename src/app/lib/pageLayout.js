import { simpleQuery } from "./database.mjs";


export async function getPageLayout(pageName){

    pageName = pageName.toLowerCase();

    const query = `SELECT * FROM nstats_page_layout WHERE page=? ORDER BY page_order ASC`;

    const result = await simpleQuery(query, [pageName]);

    if(result.length === 0) return null;

    return result;
}