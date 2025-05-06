import {calcPlayersMapResults} from "./src/app/lib/ctfLeague.mjs";


(async () =>{

    await calcPlayersMapResults(18, 1, 5);

    process.exit();
})();