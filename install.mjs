import {sqliteInstall} from "./src/sqliteInstall.mjs";


export async function install(){



    await sqliteInstall(false);


    process.exit();
}

await install();

