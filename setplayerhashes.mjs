import { simpleQuery } from "./src/app/lib/database.mjs";
import { setAllPlayerHashes } from "./src/app/lib/players.mjs";


(async () =>{

    await setAllPlayerHashes();
    process.exit();
})();