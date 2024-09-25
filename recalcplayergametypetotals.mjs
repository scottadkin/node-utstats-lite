import { simpleQuery } from "./src/app/lib/database.mjs";

import { recalcAllPlayerTotals } from "./src/app/lib/players.mjs";
//getPlayersAllMatchData


(async () =>{

    await recalcAllPlayerTotals();
    process.exit();
})();