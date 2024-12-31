import { setAllPlayerMapAverages } from "./src/app/lib/players.mjs";
import { setAllMapTotals } from "./src/app/lib/weapons.mjs";

(async () =>{

    //UNCOMMENT AFTER TESTING
    await setAllPlayerMapAverages();

    await setAllMapTotals();

    process.exit();
})();