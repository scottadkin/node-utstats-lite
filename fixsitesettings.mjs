import { restoreDefaultSettings } from "./src/siteSettings.mjs";
import Message from "./src/message.mjs";
import { simpleQuery } from "./src/database.mjs";

async function getDuplicates(){

    const query = `SELECT MIN(id) as first_id,category,setting_name,count(*) as total_rows FROM nstats_site_settings GROUP BY category,setting_name HAVING total_rows>1`;

    return await simpleQuery(query);
 
}

async function deleteDuplicates(){

    const dups = await getDuplicates();

    if(dups.length === 0){
        new Message(`No duplicate settings found`,"pass");
        return;
    }

    new Message(`Found ${dups.length} duplicate site settings.`,"note");

    const query = `DELETE FROM nstats_site_settings WHERE category=? AND setting_name=? AND id!=?`;

    for(let i = 0; i < dups.length; i++){

        const {category, setting_name, first_id} = dups[i];

        try{

            new Message(`Attempting to delete duplicate settings for ${category}.${setting_name}`,"note");
            await simpleQuery(query, [category, setting_name, first_id]);
            new Message(`Deleted duplicate settings for ${category}.${setting_name}`,"pass");

        }catch(err){
            new Message(`Failed to delete duplicate setting ${category}.${setting_name}, reason: ${err.toString()}`, "error");
        }
    }


    process.exit();

}


await deleteDuplicates();
